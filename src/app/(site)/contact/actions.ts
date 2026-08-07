"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { estimateJob } from "@/lib/estimate";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  email: z.email("Please enter a valid email"),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  zip: z.string().trim().optional(),
  propertyType: z.string().default("residential"),
  serviceSlug: z.string().optional(),
  squareFeet: z.coerce.number().int().min(0).max(100000).optional(),
  bedrooms: z.coerce.number().int().min(0).max(30).optional(),
  bathrooms: z.coerce.number().int().min(0).max(30).optional(),
  frequency: z.string().optional(),
  conditionLevel: z.coerce.number().int().min(1).max(5).optional(),
  preferredDate: z.string().trim().optional(),
  message: z.string().trim().max(4000).optional(),
  // Honeypot: bots fill hidden fields, humans don't.
  website: z.string().max(0).optional(),
});

export type QuoteState = {
  ok: boolean;
  errors?: Record<string, string>;
  message?: string;
};

export async function submitQuote(
  _prev: QuoteState,
  formData: FormData,
): Promise<QuoteState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      errors[key] ??= issue.message;
    }
    return { ok: false, errors, message: "Please check the highlighted fields." };
  }

  const data = parsed.data;

  // Silently accept honeypot hits so bots don't learn they were caught.
  if (data.website) return { ok: true };

  const service = data.serviceSlug
    ? await prisma.service.findUnique({ where: { slug: data.serviceSlug } })
    : null;

  // Snapshot the estimate so the owners see the same number the visitor did.
  let estimatedMinutes: number | null = null;
  let estimatedPrice: number | null = null;

  if (service) {
    const est = estimateJob({
      baseMinutes: service.baseMinutes,
      minutesPer1kSqFt: service.minutesPer1kSqFt,
      minutesPerBedroom: service.minutesPerBedroom,
      minutesPerBathroom: service.minutesPerBathroom,
      setupMinutes: service.setupMinutes,
      squareFeet: data.squareFeet,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      conditionLevel: data.conditionLevel ?? 3,
      frequency: data.frequency,
      firstVisit: true,
      crewSize: 1,
    });
    estimatedMinutes = Math.round(est.laborMinutes * 1.1);
    estimatedPrice =
      Math.round(((estimatedMinutes / 60) * service.hourlyRate) / 500) * 500;
  }

  await prisma.lead.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      address: data.address || null,
      city: data.city || null,
      zip: data.zip || null,
      propertyType: data.propertyType,
      serviceId: service?.id ?? null,
      squareFeet: data.squareFeet ?? null,
      bedrooms: data.bedrooms ?? null,
      bathrooms: data.bathrooms ?? null,
      frequency: data.frequency || null,
      preferredDate: data.preferredDate || null,
      message: data.message || null,
      estimatedMinutes,
      estimatedPrice,
      // A request with a date attached is someone ready to book.
      priority: data.preferredDate ? "high" : "normal",
      source: "website",
    },
  });

  return {
    ok: true,
    message:
      "Thanks — we've got your request. Laura or Lisa will be in touch within one business day.",
  };
}
