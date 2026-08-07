"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { estimateJob } from "@/lib/estimate";
import { estimateLeg, type Waypoint } from "@/lib/travel";
import { getTravelSettings } from "@/lib/settings";

/** Every action in this file is behind the session guard. */
async function guard() {
  return requireUser();
}

// ============================================================
// Leads
// ============================================================

export async function updateLeadStatus(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));

  await prisma.lead.update({
    where: { id },
    data: {
      status,
      lostReason: status === "lost" ? String(formData.get("lostReason") ?? "") || null : null,
    },
  });

  revalidatePath("/crew/leads");
  revalidatePath(`/crew/leads/${id}`);
  revalidatePath("/crew");
}

export async function addNote(formData: FormData) {
  const user = await guard();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const leadId = formData.get("leadId") ? String(formData.get("leadId")) : null;
  const clientId = formData.get("clientId") ? String(formData.get("clientId")) : null;

  await prisma.note.create({
    data: {
      body,
      kind: String(formData.get("kind") ?? "note"),
      authorId: user.id,
      leadId,
      clientId,
    },
  });

  if (leadId) revalidatePath(`/crew/leads/${leadId}`);
  if (clientId) revalidatePath(`/crew/clients/${clientId}`);
}

/** Turn a won lead into a client record, carrying the property profile over. */
export async function convertLead(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return;

  const client = await prisma.client.create({
    data: {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      address: lead.address,
      city: lead.city ?? "Rutland",
      zip: lead.zip,
      propertyType: lead.propertyType,
      squareFeet: lead.squareFeet,
      bedrooms: lead.bedrooms,
      bathrooms: lead.bathrooms,
      frequency: lead.frequency ?? "one-time",
      notes: lead.message,
    },
  });

  await prisma.lead.update({
    where: { id },
    data: { status: "won", convertedClientId: client.id },
  });

  // Carry the lead's history across so context isn't lost.
  await prisma.note.updateMany({
    where: { leadId: id },
    data: { clientId: client.id },
  });

  revalidatePath("/crew/leads");
  revalidatePath("/crew/clients");
  redirect(`/crew/clients/${client.id}`);
}

// ============================================================
// Clients
// ============================================================

const clientSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  company: z.string().trim().optional(),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  zip: z.string().trim().optional(),
  lat: z.string().trim().optional(),
  lng: z.string().trim().optional(),
  propertyType: z.string().default("residential"),
  squareFeet: z.string().trim().optional(),
  bedrooms: z.string().trim().optional(),
  bathrooms: z.string().trim().optional(),
  conditionLevel: z.coerce.number().int().min(1).max(5).default(3),
  frequency: z.string().default("one-time"),
  rate: z.string().trim().optional(),
  status: z.string().default("active"),
  notes: z.string().trim().optional(),
  gateCode: z.string().trim().optional(),
});

const optInt = (v?: string) => {
  if (!v) return null;
  const n = Number(v.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : null;
};

const optFloat = (v?: string) => {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export async function saveClient(formData: FormData) {
  await guard();
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const d = parsed.data;
  const data = {
    name: d.name,
    email: d.email || null,
    phone: d.phone || null,
    company: d.company || null,
    address: d.address || null,
    city: d.city || null,
    state: d.state || "VT",
    zip: d.zip || null,
    lat: optFloat(d.lat),
    lng: optFloat(d.lng),
    propertyType: d.propertyType,
    squareFeet: optInt(d.squareFeet),
    bedrooms: optInt(d.bedrooms),
    bathrooms: optInt(d.bathrooms),
    conditionLevel: d.conditionLevel,
    frequency: d.frequency,
    // Rate is entered in dollars but stored in cents.
    rate: d.rate ? Math.round(Number(d.rate.replace(/[^0-9.]/g, "")) * 100) : null,
    status: d.status,
    notes: d.notes || null,
    gateCode: d.gateCode || null,
  };

  const saved = id
    ? await prisma.client.update({ where: { id }, data })
    : await prisma.client.create({ data });

  revalidatePath("/crew/clients");
  redirect(`/crew/clients/${saved.id}`);
}

// ============================================================
// Jobs
// ============================================================

const jobSchema = z.object({
  clientId: z.string().min(1),
  serviceId: z.string().optional(),
  scheduledFor: z.string().min(1),
  status: z.string().default("scheduled"),
  overrideMinutes: z.string().trim().optional(),
  price: z.string().trim().optional(),
  crew: z.array(z.string()).or(z.string()).optional(),
  addOns: z.array(z.string()).or(z.string()).optional(),
  notes: z.string().trim().optional(),
  internalNotes: z.string().trim().optional(),
  recurrence: z.string().default("none"),
});

const asArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(String) : v ? [String(v)] : [];

/**
 * Create or update a job, recomputing the estimate and the inbound
 * travel leg from whatever the form supplied.
 */
export async function saveJob(formData: FormData) {
  await guard();
  const id = formData.get("id") ? String(formData.get("id")) : null;

  const raw = {
    ...Object.fromEntries(formData),
    crew: formData.getAll("crew"),
    addOns: formData.getAll("addOns"),
  };

  const parsed = jobSchema.safeParse(raw);
  if (!parsed.success) return;
  const d = parsed.data;

  const [client, service, travel] = await Promise.all([
    prisma.client.findUnique({ where: { id: d.clientId } }),
    d.serviceId
      ? prisma.service.findUnique({ where: { id: d.serviceId } })
      : Promise.resolve(null),
    getTravelSettings(),
  ]);
  if (!client) return;

  const crew = asArray(d.crew);
  const addOnIds = asArray(d.addOns);

  const addOnRows = addOnIds.length
    ? await prisma.addOn.findMany({ where: { id: { in: addOnIds } } })
    : [];
  const addOnMinutes = addOnRows.reduce((sum, a) => sum + a.minutes, 0);

  // --- Estimated time ---
  let estimatedMinutes = 120;
  let breakdown: Array<{ label: string; minutes: number }> = [];

  if (service) {
    const est = estimateJob({
      baseMinutes: service.baseMinutes,
      minutesPer1kSqFt: service.minutesPer1kSqFt,
      minutesPerBedroom: service.minutesPerBedroom,
      minutesPerBathroom: service.minutesPerBathroom,
      setupMinutes: service.setupMinutes,
      squareFeet: client.squareFeet,
      bedrooms: client.bedrooms,
      bathrooms: client.bathrooms,
      conditionLevel: client.conditionLevel,
      frequency: client.frequency,
      addOnMinutes,
      crewSize: Math.max(1, crew.length),
    });
    estimatedMinutes = est.onSiteMinutes;
    breakdown = est.lines;
  }

  // --- Travel: measured from the previous stop that day, else HQ ---
  const scheduledFor = new Date(d.scheduledFor);
  const dayStart = new Date(scheduledFor);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(scheduledFor);
  dayEnd.setHours(23, 59, 59, 999);

  const priorJob = await prisma.job.findFirst({
    where: {
      scheduledFor: { gte: dayStart, lt: scheduledFor },
      status: { not: "cancelled" },
      ...(id ? { id: { not: id } } : {}),
    },
    orderBy: { scheduledFor: "desc" },
    include: { client: true },
  });

  const from: Waypoint = priorJob
    ? {
        id: priorJob.id,
        label: priorJob.client.name,
        lat: priorJob.client.lat,
        lng: priorJob.client.lng,
      }
    : { id: "hq", label: travel.hqLabel, lat: travel.hqLat, lng: travel.hqLng };

  const leg = estimateLeg(
    from,
    { id: d.clientId, label: client.name, lat: client.lat, lng: client.lng },
    travel,
  );

  const data = {
    clientId: d.clientId,
    serviceId: d.serviceId || null,
    scheduledFor,
    status: d.status,
    estimatedMinutes,
    overrideMinutes: optInt(d.overrideMinutes),
    estimateBreakdown: JSON.stringify(breakdown),
    travelMinutes: leg.minutes,
    travelMiles: leg.miles,
    travelFromId: priorJob?.id ?? null,
    travelFromLabel: from.label,
    travelCost: leg.cost,
    price: d.price ? Math.round(Number(d.price.replace(/[^0-9.]/g, "")) * 100) : null,
    notes: d.notes || null,
    internalNotes: d.internalNotes || null,
    recurrence: d.recurrence,
  };

  const job = id
    ? await prisma.job.update({ where: { id }, data })
    : await prisma.job.create({ data });

  // Replace assignments and add-ons wholesale — simpler and safe at this scale.
  await prisma.jobAssignment.deleteMany({ where: { jobId: job.id } });
  if (crew.length > 0) {
    await prisma.jobAssignment.createMany({
      data: crew.map((userId, i) => ({
        jobId: job.id,
        userId,
        role: i === 0 ? "lead" : "cleaner",
      })),
    });
  }

  await prisma.jobAddOn.deleteMany({ where: { jobId: job.id } });
  if (addOnRows.length > 0) {
    await prisma.jobAddOn.createMany({
      data: addOnRows.map((a) => ({
        jobId: job.id,
        addOnId: a.id,
        minutes: a.minutes,
        price: a.price,
      })),
    });
  }

  revalidatePath("/crew");
  revalidatePath("/crew/schedule");
  revalidatePath("/crew/travel");
  redirect(`/crew/schedule/${job.id}`);
}

/** Clock in / clock out. Writing actualMinutes is what feeds accuracy. */
export async function toggleJobClock(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return;

  if (!job.startedAt) {
    await prisma.job.update({
      where: { id },
      data: { startedAt: new Date(), status: "in_progress" },
    });
  } else if (!job.completedAt) {
    const completedAt = new Date();
    const actualMinutes = Math.max(
      1,
      Math.round((completedAt.getTime() - job.startedAt.getTime()) / 60000),
    );

    const assignments = await prisma.jobAssignment.findMany({
      where: { jobId: id },
      include: { user: true },
    });
    const laborCost = assignments.reduce(
      (sum, a) => sum + Math.round((actualMinutes / 60) * a.user.hourlyRate),
      0,
    );

    await prisma.job.update({
      where: { id },
      data: { completedAt, actualMinutes, status: "completed", laborCost },
    });
  }

  revalidatePath("/crew");
  revalidatePath(`/crew/schedule/${id}`);
  revalidatePath("/crew/schedule");
}

export async function setJobStatus(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  await prisma.job.update({
    where: { id },
    data: { status: String(formData.get("status")) },
  });
  revalidatePath("/crew");
  revalidatePath(`/crew/schedule/${id}`);
  revalidatePath("/crew/schedule");
}

export async function deleteJob(formData: FormData) {
  await guard();
  await prisma.job.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/crew/schedule");
  redirect("/crew/schedule");
}

// ============================================================
// Website content
// ============================================================

export async function saveSetting(formData: FormData) {
  await guard();
  const entries = Array.from(formData.entries()).filter(
    ([key]) => key !== "$ACTION_ID",
  );

  await Promise.all(
    entries.map(([key, value]) =>
      prisma.setting.updateMany({
        where: { key },
        data: { value: String(value) },
      }),
    ),
  );

  revalidatePath("/crew/settings");
  revalidatePath("/", "layout");
}

export async function saveService(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));

  const num = (key: string, fallback = 0) => {
    const n = Number(formData.get(key));
    return Number.isFinite(n) ? Math.round(n) : fallback;
  };

  await prisma.service.update({
    where: { id },
    data: {
      name: String(formData.get("name")),
      blurb: String(formData.get("blurb")),
      description: String(formData.get("description")),
      priceFrom: Math.round(Number(formData.get("priceFrom") || 0) * 100) || null,
      hourlyRate: Math.round(Number(formData.get("hourlyRate") || 0) * 100),
      baseMinutes: num("baseMinutes"),
      minutesPer1kSqFt: num("minutesPer1kSqFt"),
      minutesPerBedroom: num("minutesPerBedroom"),
      minutesPerBathroom: num("minutesPerBathroom"),
      setupMinutes: num("setupMinutes"),
      active: formData.get("active") === "on",
      featured: formData.get("featured") === "on",
    },
  });

  revalidatePath("/crew/services");
  revalidatePath("/services");
  revalidatePath("/");
}

export async function saveTestimonial(formData: FormData) {
  await guard();
  const id = formData.get("id") ? String(formData.get("id")) : null;

  const data = {
    author: String(formData.get("author")),
    role: String(formData.get("role") ?? "") || null,
    location: String(formData.get("location") ?? "") || null,
    quote: String(formData.get("quote")),
    rating: Number(formData.get("rating") ?? 5),
    source: String(formData.get("source") ?? "direct"),
    published: formData.get("published") === "on",
  };

  if (id) {
    await prisma.testimonial.update({ where: { id }, data });
  } else {
    await prisma.testimonial.create({ data });
  }

  revalidatePath("/crew/reviews");
  revalidatePath("/");
}

export async function deleteTestimonial(formData: FormData) {
  await guard();
  await prisma.testimonial.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/crew/reviews");
  revalidatePath("/");
}

export async function toggleGalleryItem(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const item = await prisma.galleryItem.findUnique({ where: { id } });
  if (!item) return;

  await prisma.galleryItem.update({
    where: { id },
    data: { published: !item.published },
  });

  revalidatePath("/crew/gallery");
  revalidatePath("/gallery");
  revalidatePath("/");
}

export async function deleteGalleryItem(formData: FormData) {
  await guard();
  await prisma.galleryItem.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/crew/gallery");
  revalidatePath("/gallery");
}
