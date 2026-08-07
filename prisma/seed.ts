/**
 * Seed for Elite Cleaning 802.
 *
 * Business copy is taken from the client's own Facebook page. Clients,
 * jobs, and invoices are realistic sample data so the CRM has something
 * to show on first run — clear them from Settings once the real book of
 * business is entered.
 */

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import {
  estimateLeg,
  DEFAULT_TRAVEL_SETTINGS,
  type Waypoint,
} from "../src/lib/travel";

const scryptAsync = promisify(scrypt);

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

/** Days from today, at a given local hour. */
function at(dayOffset: number, hour: number, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log("Seeding Elite Cleaning 802…");

  // Idempotent: wipe in FK-safe order so `npm run db:seed` can be re-run.
  await prisma.chatMessage.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.jobAddOn.deleteMany();
  await prisma.jobAssignment.deleteMany();
  await prisma.job.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.note.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.client.deleteMany();
  await prisma.addOn.deleteMany();
  await prisma.service.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.galleryItem.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // ---------------------------------------------------------
  // Owners
  // ---------------------------------------------------------
  const password = await hashPassword("elite802");

  const laura = await prisma.user.create({
    data: {
      email: "laura@elitecleaning802.com",
      name: "Laura",
      passwordHash: password,
      role: "owner",
      hourlyRate: 3800,
      color: "#4e2f72",
    },
  });

  const lisa = await prisma.user.create({
    data: {
      email: "lisa@elitecleaning802.com",
      name: "Lisa",
      passwordHash: password,
      role: "owner",
      hourlyRate: 3800,
      color: "#b8934a",
    },
  });

  // ---------------------------------------------------------
  // Services — each carries its own estimated-time formula
  // ---------------------------------------------------------
  const services = await Promise.all(
    [
      {
        slug: "recurring-home",
        name: "Recurring Home Cleaning",
        blurb: "Weekly, bi-weekly, or monthly upkeep that keeps a home effortless.",
        description:
          "The service most of our clients settle into. We learn your home — which surfaces need care, where the dog sheds, which room the kids destroy — and we keep it consistently, genuinely clean. Same team every visit, so nothing needs re-explaining.",
        category: "residential",
        icon: "home",
        priceFrom: 13500,
        priceUnit: "visit",
        hourlyRate: 6500,
        baseMinutes: 45,
        minutesPer1kSqFt: 40,
        minutesPerBedroom: 18,
        minutesPerBathroom: 22,
        setupMinutes: 15,
        features: JSON.stringify([
          "All floors vacuumed and mopped",
          "Kitchen surfaces, sink, and exterior appliances",
          "Bathrooms fully sanitised",
          "Dusting, mirrors, and glass",
          "Beds made, trash out",
        ]),
        featured: true,
        sortOrder: 1,
      },
      {
        slug: "deep-clean",
        name: "Deep Clean",
        blurb: "The full reset — baseboards, inside appliances, the parts nobody gets to.",
        description:
          "A top-to-bottom clean for homes that need more than upkeep. We work through baseboards, door frames, light fixtures, inside the oven and fridge, window sills, and every surface that gets skipped in a normal visit. Most clients start here, then move to recurring.",
        category: "residential",
        icon: "sparkle",
        priceFrom: 28500,
        priceUnit: "visit",
        hourlyRate: 7000,
        baseMinutes: 90,
        minutesPer1kSqFt: 75,
        minutesPerBedroom: 35,
        minutesPerBathroom: 45,
        setupMinutes: 20,
        features: JSON.stringify([
          "Everything in a standard clean",
          "Baseboards, door frames, and switch plates",
          "Inside oven and refrigerator",
          "Light fixtures and ceiling fans",
          "Window sills and tracks",
          "Cabinet fronts degreased",
        ]),
        featured: true,
        sortOrder: 2,
      },
      {
        slug: "airbnb-turnover",
        name: "Airbnb & Rental Turnover",
        blurb: "Same-day turnarounds with linens, restock, and a guest-ready photo check.",
        description:
          "Built for hosts working against a checkout-to-checkin window. We strip and remake beds, run laundry, restock consumables, stage the space, and send you photos before we lock up — so you know it's guest-ready without driving over.",
        category: "turnover",
        icon: "key",
        priceFrom: 11500,
        priceUnit: "visit",
        hourlyRate: 7000,
        baseMinutes: 40,
        minutesPer1kSqFt: 35,
        minutesPerBedroom: 22,
        minutesPerBathroom: 25,
        setupMinutes: 10,
        features: JSON.stringify([
          "Linens stripped, laundered, and remade",
          "Consumables restocked",
          "Full kitchen and bath reset",
          "Staged to your listing photos",
          "Photo confirmation before lock-up",
          "Damage and low-stock reporting",
        ]),
        featured: true,
        sortOrder: 3,
      },
      {
        slug: "office-commercial",
        name: "Office & Commercial",
        blurb: "After-hours cleaning for offices, studios, and storefronts.",
        description:
          "Scheduled around your business, not through it. Evening or early-morning service for offices, salons, studios, and retail — with a documented checklist so you can see exactly what was done on every visit.",
        category: "commercial",
        icon: "building",
        priceFrom: 17500,
        priceUnit: "visit",
        hourlyRate: 6800,
        baseMinutes: 50,
        minutesPer1kSqFt: 30,
        minutesPerBedroom: 0,
        minutesPerBathroom: 30,
        setupMinutes: 15,
        features: JSON.stringify([
          "After-hours or pre-open scheduling",
          "Restrooms sanitised and restocked",
          "Break room and common areas",
          "Trash and recycling handled",
          "Documented checklist each visit",
        ]),
        sortOrder: 4,
      },
      {
        slug: "post-construction",
        name: "Post-Construction Clean",
        blurb: "Dust, debris, and residue removal after a build or renovation.",
        description:
          "Construction dust gets everywhere and normal cleaning won't touch it. We do the multi-pass work it actually takes: debris removal, full dust extraction from every surface and vent, adhesive and paint spot removal, and a final detail so the space is ready to hand over.",
        category: "specialty",
        icon: "hammer",
        priceFrom: 42500,
        priceUnit: "visit",
        hourlyRate: 7500,
        baseMinutes: 120,
        minutesPer1kSqFt: 110,
        minutesPerBedroom: 30,
        minutesPerBathroom: 50,
        setupMinutes: 30,
        features: JSON.stringify([
          "Debris and packaging removal",
          "Multi-pass dust extraction",
          "Paint, adhesive, and sticker removal",
          "Windows, tracks, and frames",
          "Vents and fixtures detailed",
        ]),
        sortOrder: 5,
      },
      {
        slug: "move-in-out",
        name: "Move-In / Move-Out",
        blurb: "Empty-home cleans that get deposits back and homes sold.",
        description:
          "A vacant property clean done to inspection standard — inside every cabinet and closet, appliances in and out, floors treated, and the whole place left genuinely empty-clean. We work with tenants, landlords, and realtors on tight closing timelines.",
        category: "specialty",
        icon: "box",
        priceFrom: 32500,
        priceUnit: "visit",
        hourlyRate: 7000,
        baseMinutes: 100,
        minutesPer1kSqFt: 85,
        minutesPerBedroom: 30,
        minutesPerBathroom: 45,
        setupMinutes: 20,
        features: JSON.stringify([
          "Inside all cabinets, drawers, and closets",
          "Appliances cleaned in and out",
          "Full bathroom and kitchen detail",
          "Baseboards, doors, and walls spot-cleaned",
          "Inspection-ready finish",
        ]),
        sortOrder: 6,
      },
    ].map((data) => prisma.service.create({ data })),
  );

  const byService = Object.fromEntries(services.map((s) => [s.slug, s]));

  // ---------------------------------------------------------
  // Add-ons
  // ---------------------------------------------------------
  const addOns = await Promise.all(
    [
      { slug: "inside-fridge", name: "Inside refrigerator", minutes: 25, price: 3500, sortOrder: 1 },
      { slug: "inside-oven", name: "Inside oven", minutes: 30, price: 4000, sortOrder: 2 },
      { slug: "interior-windows", name: "Interior windows", minutes: 45, price: 6500, sortOrder: 3 },
      { slug: "laundry", name: "Laundry (per load)", minutes: 20, price: 2500, sortOrder: 4 },
      { slug: "inside-cabinets", name: "Inside cabinets", minutes: 40, price: 5500, sortOrder: 5 },
      { slug: "garage-sweep", name: "Garage sweep-out", minutes: 30, price: 4500, sortOrder: 6 },
      { slug: "pet-hair", name: "Heavy pet hair treatment", minutes: 25, price: 3000, sortOrder: 7 },
      { slug: "basement", name: "Finished basement", minutes: 45, price: 6000, sortOrder: 8 },
    ].map((data) => prisma.addOn.create({ data })),
  );

  const byAddOn = Object.fromEntries(addOns.map((a) => [a.slug, a]));

  // ---------------------------------------------------------
  // Clients — coordinates are real Vermont towns, so the travel
  // engine produces believable drive times out of the box.
  // ---------------------------------------------------------
  const clientSeed = [
    {
      name: "Margaret Whitcomb",
      email: "m.whitcomb@example.com",
      phone: "(802) 555-0114",
      address: "18 Grove Street",
      city: "Rutland",
      zip: "05701",
      lat: 43.6089,
      lng: -72.9784,
      propertyType: "residential",
      squareFeet: 2200,
      bedrooms: 3,
      bathrooms: 2,
      conditionLevel: 2,
      frequency: "biweekly",
      rate: 16500,
      notes: "Two cats — bring the pet hair attachment. Key under the blue planter.",
      gateCode: "—",
    },
    {
      name: "Birchwood Rentals",
      company: "Birchwood Rentals LLC",
      email: "stay@birchwoodvt.example.com",
      phone: "(802) 555-0177",
      address: "94 Killington Road",
      city: "Killington",
      zip: "05751",
      lat: 43.6045,
      lng: -72.8201,
      propertyType: "airbnb",
      squareFeet: 1600,
      bedrooms: 3,
      bathrooms: 2,
      conditionLevel: 3,
      frequency: "weekly",
      rate: 14500,
      notes: "Ski season = Sat turnovers, hard 3pm check-in. Linens in hall closet.",
      gateCode: "4417",
    },
    {
      name: "Dr. Alan Reyes",
      company: "Green Mountain Dental",
      email: "office@gmdental.example.com",
      phone: "(802) 555-0132",
      address: "271 Woodstock Avenue",
      city: "Rutland",
      zip: "05701",
      lat: 43.6142,
      lng: -72.9503,
      propertyType: "commercial",
      squareFeet: 3400,
      bedrooms: 0,
      bathrooms: 3,
      conditionLevel: 3,
      frequency: "weekly",
      rate: 24500,
      notes: "After 6pm only. Alarm code on file — disarm at side entrance.",
      gateCode: "8823",
    },
    {
      name: "The Hollisters",
      email: "hollister.home@example.com",
      phone: "(802) 555-0198",
      address: "5 Meadow Lane",
      city: "Pittsford",
      zip: "05763",
      lat: 43.7156,
      lng: -73.0201,
      propertyType: "residential",
      squareFeet: 3100,
      bedrooms: 4,
      bathrooms: 3,
      conditionLevel: 4,
      frequency: "monthly",
      rate: 27500,
      notes: "Three kids, big dog. Always needs more time than the estimate says.",
    },
    {
      name: "Sarah Kwan",
      email: "sarahk@example.com",
      phone: "(802) 555-0161",
      address: "40 Merchants Row",
      city: "Rutland",
      zip: "05701",
      lat: 43.6097,
      lng: -72.9738,
      propertyType: "airbnb",
      squareFeet: 900,
      bedrooms: 2,
      bathrooms: 1,
      conditionLevel: 2,
      frequency: "weekly",
      rate: 11500,
      notes: "Downtown loft. Parking is street-only — budget extra time.",
    },
    {
      name: "Otter Creek Studio",
      company: "Otter Creek Studio",
      email: "hello@ottercreek.example.com",
      phone: "(802) 555-0143",
      address: "12 Depot Street",
      city: "Brandon",
      zip: "05733",
      lat: 43.7981,
      lng: -73.0873,
      propertyType: "commercial",
      squareFeet: 1800,
      bedrooms: 0,
      bathrooms: 2,
      conditionLevel: 3,
      frequency: "biweekly",
      rate: 18500,
      notes: "Yoga studio — floors are the priority. No scented products.",
    },
  ];

  const clients = await Promise.all(
    clientSeed.map((data) => prisma.client.create({ data })),
  );

  // ---------------------------------------------------------
  // Jobs — a mix of history (with actuals) and upcoming work
  // ---------------------------------------------------------
  type JobSeed = {
    client: number;
    service: string;
    day: number;
    hour: number;
    estimated: number;
    actual?: number;
    status: string;
    price: number;
    travelMinutes: number;
    travelMiles: number;
    travelFromLabel: string;
    crew: string[];
    addOns?: string[];
    notes?: string;
  };

  const jobSeeds: JobSeed[] = [
    // --- Completed history, so accuracy reporting has data ---
    { client: 0, service: "recurring-home", day: -14, hour: 9, estimated: 150, actual: 165, status: "completed", price: 16500, travelMinutes: 12, travelMiles: 4.2, travelFromLabel: "HQ", crew: ["laura"] },
    { client: 1, service: "airbnb-turnover", day: -12, hour: 11, estimated: 120, actual: 110, status: "completed", price: 14500, travelMinutes: 22, travelMiles: 11.4, travelFromLabel: "HQ", crew: ["lisa"] },
    { client: 3, service: "deep-clean", day: -10, hour: 9, estimated: 330, actual: 395, status: "completed", price: 34500, travelMinutes: 18, travelMiles: 8.9, travelFromLabel: "HQ", crew: ["laura", "lisa"], addOns: ["inside-oven", "interior-windows"], notes: "Underestimated — the basement wasn't in the walkthrough." },
    { client: 2, service: "office-commercial", day: -8, hour: 18, estimated: 165, actual: 160, status: "completed", price: 24500, travelMinutes: 9, travelMiles: 3.1, travelFromLabel: "HQ", crew: ["lisa"] },
    { client: 4, service: "airbnb-turnover", day: -7, hour: 11, estimated: 85, actual: 95, status: "completed", price: 11500, travelMinutes: 8, travelMiles: 2.4, travelFromLabel: "HQ", crew: ["laura"], notes: "Street parking added time again." },
    { client: 0, service: "recurring-home", day: -7, hour: 14, estimated: 150, actual: 145, status: "completed", price: 16500, travelMinutes: 11, travelMiles: 3.8, travelFromLabel: "Sarah Kwan", crew: ["laura"] },
    { client: 5, service: "office-commercial", day: -5, hour: 18, estimated: 120, actual: 130, status: "completed", price: 18500, travelMinutes: 28, travelMiles: 15.2, travelFromLabel: "HQ", crew: ["lisa"] },
    { client: 1, service: "airbnb-turnover", day: -5, hour: 11, estimated: 120, actual: 115, status: "completed", price: 14500, travelMinutes: 22, travelMiles: 11.4, travelFromLabel: "HQ", crew: ["lisa"] },

    // --- Today ---
    { client: 4, service: "airbnb-turnover", day: 0, hour: 9, estimated: 85, status: "completed", actual: 90, price: 11500, travelMinutes: 8, travelMiles: 2.4, travelFromLabel: "HQ", crew: ["laura"] },
    { client: 0, service: "recurring-home", day: 0, hour: 11, estimated: 150, status: "in_progress", price: 16500, travelMinutes: 11, travelMiles: 3.8, travelFromLabel: "Sarah Kwan", crew: ["laura"] },
    { client: 2, service: "office-commercial", day: 0, hour: 18, estimated: 165, status: "scheduled", price: 24500, travelMinutes: 14, travelMiles: 5.6, travelFromLabel: "Margaret Whitcomb", crew: ["lisa"] },

    // --- Upcoming ---
    { client: 1, service: "airbnb-turnover", day: 1, hour: 11, estimated: 120, status: "scheduled", price: 14500, travelMinutes: 22, travelMiles: 11.4, travelFromLabel: "HQ", crew: ["lisa"], addOns: ["laundry"] },
    { client: 5, service: "office-commercial", day: 2, hour: 18, estimated: 120, status: "scheduled", price: 18500, travelMinutes: 28, travelMiles: 15.2, travelFromLabel: "HQ", crew: ["lisa"] },
    { client: 3, service: "recurring-home", day: 3, hour: 9, estimated: 240, status: "scheduled", price: 27500, travelMinutes: 18, travelMiles: 8.9, travelFromLabel: "HQ", crew: ["laura", "lisa"], addOns: ["pet-hair"] },
    { client: 4, service: "airbnb-turnover", day: 4, hour: 11, estimated: 85, status: "scheduled", price: 11500, travelMinutes: 8, travelMiles: 2.4, travelFromLabel: "HQ", crew: ["laura"] },
    { client: 0, service: "recurring-home", day: 7, hour: 9, estimated: 150, status: "scheduled", price: 16500, travelMinutes: 12, travelMiles: 4.2, travelFromLabel: "HQ", crew: ["laura"] },
    { client: 1, service: "airbnb-turnover", day: 8, hour: 11, estimated: 120, status: "scheduled", price: 14500, travelMinutes: 22, travelMiles: 11.4, travelFromLabel: "HQ", crew: ["lisa"] },
  ];

  const crewMap = { laura, lisa };

  for (const seed of jobSeeds) {
    const client = clients[seed.client];
    const service = byService[seed.service];
    const scheduledFor = at(seed.day, seed.hour);
    const crewSize = seed.crew.length;

    const laborCost = seed.actual
      ? Math.round((seed.actual / 60) * 3800 * crewSize)
      : 0;

    const job = await prisma.job.create({
      data: {
        clientId: client.id,
        serviceId: service.id,
        scheduledFor,
        status: seed.status,
        estimatedMinutes: seed.estimated,
        estimateBreakdown: JSON.stringify([
          { label: "Base service", minutes: service.baseMinutes },
          { label: "Property size", minutes: Math.round(seed.estimated * 0.45) },
          { label: "Setup & supplies", minutes: service.setupMinutes },
        ]),
        actualMinutes: seed.actual ?? null,
        startedAt: seed.actual ? scheduledFor : seed.status === "in_progress" ? new Date() : null,
        completedAt: seed.actual
          ? new Date(scheduledFor.getTime() + seed.actual * 60000)
          : null,
        // Placeholders — recomputed from real coordinates below, so the
        // mileage log and the route timeline can never disagree.
        travelMinutes: 0,
        travelMiles: 0,
        travelFromLabel: seed.travelFromLabel,
        travelCost: 0,
        price: seed.price,
        laborCost,
        notes: seed.notes ?? null,
        recurrence: client.frequency === "one-time" ? "none" : client.frequency,
      },
    });

    await Promise.all(
      seed.crew.map((key, index) =>
        prisma.jobAssignment.create({
          data: {
            jobId: job.id,
            userId: crewMap[key as keyof typeof crewMap].id,
            role: index === 0 ? "lead" : "cleaner",
          },
        }),
      ),
    );

    if (seed.addOns) {
      await Promise.all(
        seed.addOns.map((slug) =>
          prisma.jobAddOn.create({
            data: {
              jobId: job.id,
              addOnId: byAddOn[slug].id,
              minutes: byAddOn[slug].minutes,
              price: byAddOn[slug].price,
            },
          }),
        ),
      );
    }
  }

  // ---------------------------------------------------------
  // Travel — derived, never hand-written.
  //
  // Walk each day in schedule order and measure every leg with the same
  // `estimateLeg` the app uses at runtime. Hand-written mileage would
  // drift from what the route timeline computes on screen.
  // ---------------------------------------------------------
  const hq: Waypoint = {
    id: "hq",
    label: "HQ — Rutland, VT",
    lat: 43.6106,
    lng: -72.9726,
  };

  const allJobs = await prisma.job.findMany({
    where: { status: { not: "cancelled" } },
    orderBy: { scheduledFor: "asc" },
    include: { client: true },
  });

  const byDay = new Map<string, typeof allJobs>();
  for (const job of allJobs) {
    const key = job.scheduledFor.toDateString();
    byDay.set(key, [...(byDay.get(key) ?? []), job]);
  }

  for (const dayJobs of byDay.values()) {
    let previous = hq;

    for (const job of dayJobs) {
      const to: Waypoint = {
        id: job.id,
        label: job.client.name,
        lat: job.client.lat,
        lng: job.client.lng,
      };

      const leg = estimateLeg(previous, to, DEFAULT_TRAVEL_SETTINGS);

      await prisma.job.update({
        where: { id: job.id },
        data: {
          travelMinutes: leg.minutes,
          travelMiles: leg.miles,
          travelCost: leg.cost,
          travelFromLabel: previous.label,
          travelFromId: previous.id === "hq" ? null : previous.id,
        },
      });

      previous = to;
    }
  }

  // ---------------------------------------------------------
  // Leads
  // ---------------------------------------------------------
  await prisma.lead.create({
    data: {
      name: "Tom Brackett",
      email: "tbrackett@example.com",
      phone: "(802) 555-0121",
      address: "77 Stratton Road",
      city: "Rutland",
      zip: "05701",
      propertyType: "residential",
      serviceId: byService["deep-clean"].id,
      squareFeet: 2600,
      bedrooms: 4,
      bathrooms: 2,
      frequency: "one-time",
      message:
        "Moving my mother into assisted living and need the house cleaned before it lists. Kitchen is rough.",
      estimatedMinutes: 345,
      estimatedPrice: 40200,
      status: "new",
      priority: "high",
      source: "website",
    },
  });

  await prisma.lead.create({
    data: {
      name: "Priya Raman",
      email: "praman@example.com",
      phone: "(802) 555-0155",
      city: "Mendon",
      propertyType: "airbnb",
      serviceId: byService["airbnb-turnover"].id,
      squareFeet: 1200,
      bedrooms: 2,
      bathrooms: 2,
      frequency: "weekly",
      message: "Two cabins near the access road. Need reliable Saturday turnovers for ski season.",
      estimatedMinutes: 105,
      estimatedPrice: 12300,
      status: "contacted",
      priority: "high",
      source: "facebook",
    },
  });

  await prisma.lead.create({
    data: {
      name: "Ken Duval",
      email: "kduval@example.com",
      phone: "(802) 555-0109",
      city: "Proctor",
      propertyType: "residential",
      serviceId: byService["recurring-home"].id,
      squareFeet: 1800,
      bedrooms: 3,
      bathrooms: 2,
      frequency: "monthly",
      message: "Looking for monthly cleaning, just the two of us.",
      estimatedMinutes: 135,
      estimatedPrice: 15800,
      status: "quoted",
      priority: "normal",
      source: "referral",
    },
  });

  // ---------------------------------------------------------
  // Testimonials
  //
  // NOTE: Facebook reviews are behind a login wall, so these are
  // placeholders written to match the tone of the client's page.
  // Replace them with real reviews from the CRM before launch.
  // ---------------------------------------------------------
  await Promise.all(
    [
      {
        author: "Margaret W.",
        location: "Rutland, VT",
        quote:
          "I've used three cleaning services in this town. Elite is the only one where I never have to point anything out afterwards. They just see it.",
        rating: 5,
        source: "direct",
        published: true,
        sortOrder: 1,
      },
      {
        author: "Birchwood Rentals",
        role: "Short-term rental host",
        location: "Killington, VT",
        quote:
          "Saturday turnovers during ski season are brutal and they have never once made me nervous. Photos before lock-up every time.",
        rating: 5,
        source: "direct",
        published: true,
        sortOrder: 2,
      },
      {
        author: "Dr. Alan R.",
        role: "Practice owner",
        location: "Rutland, VT",
        quote:
          "They clean the office after hours and leave a checklist. I know exactly what was done. That alone is worth what I pay.",
        rating: 5,
        source: "direct",
        published: true,
        sortOrder: 3,
      },
      {
        author: "Sarah K.",
        location: "Rutland, VT",
        quote:
          "Booked a move-out clean expecting to lose part of my deposit. Got all of it back. The landlord actually commented on it.",
        rating: 5,
        source: "direct",
        published: true,
        sortOrder: 4,
      },
    ].map((data) => prisma.testimonial.create({ data })),
  );

  // ---------------------------------------------------------
  // Gallery
  //
  // These files are checked into public/gallery. Keep their database rows
  // in the seed as well so a production build does not publish an empty
  // gallery after the reset above.
  // ---------------------------------------------------------
  await prisma.galleryItem.createMany({
    data: [
      {
        filename: "tub-before-after.png",
        title: "Tub deep clean",
        caption: "Years of buildup, one visit. No harsh scratching, no damage to the finish.",
        category: "before-after",
        featured: true,
      },
      {
        filename: "oven-before.png",
        title: "Oven — before",
        caption: "Baked-on grease on every surface, including the door glass.",
        category: "before-after",
      },
      {
        filename: "oven-during.png",
        title: "Oven — treatment",
        caption: "Degreaser left to work. Rushing this step is why most ovens come out streaked.",
        category: "before-after",
      },
      {
        filename: "oven-after.png",
        title: "Oven — after",
        caption: "Racks, walls, and door glass back to clean.",
        category: "before-after",
        featured: true,
      },
      {
        filename: "commercial-restroom-before-after.png",
        title: "Commercial restroom",
        caption: "After-hours service for a business — fixtures, sinks, and floors reset before opening.",
        category: "before-after",
        featured: true,
      },
      {
        filename: "toilet-before.png",
        title: "Toilet — before",
        caption: "Heavy mineral staining and neglect.",
        category: "before-after",
      },
      {
        filename: "toilet-after.png",
        title: "Toilet — after",
        caption: "Fully sanitised, inside and out.",
        category: "before-after",
      },
      {
        filename: "banister-before.png",
        title: "Banister — before",
        caption: "Spindles and handrail after a renovation.",
        category: "before-after",
      },
      {
        filename: "banister-after.png",
        title: "Banister — after",
        caption: "Every spindle done by hand — the part most cleans skip.",
        category: "before-after",
        featured: true,
      },
      {
        filename: "hardwood-floors-before.png",
        title: "Hardwood — before",
        caption: "Construction dust and residue ground into the finish.",
        category: "before-after",
      },
      {
        filename: "hardwood-floors-after.png",
        title: "Hardwood — after",
        caption: "Post-renovation floor clean, ready to hand over.",
        category: "before-after",
      },
      {
        filename: "basement-stairs-before.png",
        title: "Basement stairs — before",
        caption: "Debris and grime on every tread.",
        category: "before-after",
      },
      {
        filename: "basement-stairs-after.png",
        title: "Basement stairs — after",
        caption: "Treads and landing cleared and washed down.",
        category: "before-after",
      },
      {
        filename: "airbnb-turnover.png",
        title: "Airbnb turnover",
        caption: "Beds remade, linens fresh, surfaces staged — photographed before lock-up so the host knows it's guest-ready.",
        category: "work",
        featured: true,
      },
      {
        filename: "refrigerator-detailed.png",
        title: "Refrigerator detailed",
        caption: "Shelves, drawers, and seals — an add-on worth every minute.",
        category: "work",
      },
      {
        filename: "refrigerator-interior.png",
        title: "Refrigerator interior",
        caption: "Emptied, wiped down, and deodorised for a move-out.",
        category: "work",
      },
      {
        filename: "tub-shower-surround.png",
        title: "Tub & shower surround",
        caption: "Soap scum and hard-water film off the full surround.",
        category: "work",
      },
      {
        filename: "bathroom-vanity.png",
        title: "Bathroom reset",
        caption: "Vanity, mirror, and tile floor for a move-out clean.",
        category: "work",
      },
      {
        filename: "living-room-floors.png",
        title: "Move-out living room",
        caption: "Empty-home clean done to inspection standard.",
        category: "work",
      },
      {
        filename: "entry-door.png",
        title: "Entry door & glass",
        caption: "Glass, blinds, frame, and hardware — the details that get noticed.",
        category: "work",
      },
      {
        filename: "powder-room.png",
        title: "Powder room",
        caption: "Small spaces still get the full treatment.",
        category: "work",
      },
      {
        filename: "kitchen-cabinets.png",
        title: "Kitchen cabinetry",
        caption: "Cabinet fronts degreased, range and cooktop detailed.",
        category: "work",
      },
    ].map((item, sortOrder) => ({
      ...item,
      width: 414,
      height: 414,
      published: true,
      featured: item.featured ?? false,
      sortOrder,
    })),
  });

  // ---------------------------------------------------------
  // Chat conversations
  //
  // Samples only — the website widget is styled but not yet wired to a
  // backend, so nothing real arrives here until that's connected.
  // ---------------------------------------------------------
  const minutesAgo = (n: number) => new Date(Date.now() - n * 60000);

  const chats: Array<{
    name: string;
    email?: string;
    phone?: string;
    status: string;
    ago: number;
    messages: Array<[role: string, body: string, ago: number]>;
  }> = [
    {
      name: "Dana Ferrell",
      email: "dferrell@example.com",
      phone: "(802) 555-0146",
      status: "open",
      ago: 40,
      messages: [
        ["assistant", "Hi Dana — thanks for reaching out. What can we help with?", 42],
        ["visitor", "Hi! We just closed on a place on Grove St and it needs a deep clean before we move in next Friday. Is that doable?", 41],
        ["visitor", "It's about 2,000 sq ft, 3 bed 2 bath. Previous owners left it pretty rough.", 40],
      ],
    },
    {
      name: "Marcus Hill",
      email: "m.hill@example.com",
      status: "answered",
      ago: 260,
      messages: [
        ["assistant", "Hi Marcus — thanks for reaching out. What can we help with?", 300],
        ["visitor", "Do you do Airbnb turnovers in Killington? I have two units.", 298],
        ["staff", "We do — Killington is one of our regular runs. Same-day turnovers with linens and restock, and we send photos before we lock up.", 265],
        ["staff", "Are you working to a 11am checkout / 3pm check-in window?", 264],
        ["visitor", "Yes exactly. What would two units run me?", 260],
      ],
    },
    {
      name: "Jen Alvarez",
      phone: "(802) 555-0188",
      status: "closed",
      ago: 2600,
      messages: [
        ["assistant", "Hi Jen — thanks for reaching out. What can we help with?", 2700],
        ["visitor", "How much for a monthly clean on a small 2 bedroom?", 2690],
        ["staff", "For a 2 bed around 1,100 sq ft on a monthly schedule we'd be right around $145 a visit. Happy to do a free walkthrough first.", 2640],
        ["visitor", "That works. I'll call to book — thank you!", 2600],
      ],
    },
  ];

  for (const chat of chats) {
    const conversation = await prisma.conversation.create({
      data: {
        visitorName: chat.name,
        visitorEmail: chat.email ?? null,
        visitorPhone: chat.phone ?? null,
        status: chat.status,
        startedAt: minutesAgo(chat.messages[0][2] as number),
        lastMessageAt: minutesAgo(chat.ago),
      },
    });

    for (const [role, body, ago] of chat.messages) {
      await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          role: role as string,
          body: body as string,
          createdAt: minutesAgo(ago as number),
        },
      });
    }
  }

  // ---------------------------------------------------------
  // Settings
  // ---------------------------------------------------------
  const settings = [
    { key: "contact.phone", value: "(802) 555-0182", label: "Phone", group: "contact", type: "text", sortOrder: 1, hint: "Shown in the header, footer, and on every call-to-action." },
    { key: "contact.email", value: "hello@elitecleaning802.com", label: "Email", group: "contact", type: "text", sortOrder: 2 },
    { key: "contact.serviceArea", value: "Rutland County and central Vermont", label: "Service area", group: "contact", type: "text", sortOrder: 3 },
    { key: "contact.hours", value: "Mon–Sat, 8am–6pm", label: "Hours", group: "contact", type: "text", sortOrder: 4 },
    { key: "contact.facebook", value: "https://www.facebook.com/EliteCleaningLLCVT/", label: "Facebook page", group: "contact", type: "text", sortOrder: 5 },

    { key: "hero.title", value: "Vermont clean, done right.", label: "Hero headline", group: "general", type: "text", sortOrder: 1 },
    { key: "hero.body", value: "Woman-owned and detail-obsessed. We keep Airbnbs, homes, offices, and rentals spotless — including turnovers and post-construction cleans.", label: "Hero paragraph", group: "general", type: "textarea", sortOrder: 2, hint: "Taken from your Facebook page. Edit freely." },

    { key: "travel.hqLabel", value: "HQ — Rutland, VT", label: "Home base label", group: "travel", type: "text", sortOrder: 1, hint: "Where the day starts and ends." },
    { key: "travel.hqLat", value: "43.6106", label: "Home base latitude", group: "travel", type: "number", sortOrder: 2 },
    { key: "travel.hqLng", value: "-72.9726", label: "Home base longitude", group: "travel", type: "number", sortOrder: 3 },
    { key: "travel.centsPerMile", value: "70", label: "Mileage rate (cents/mile)", group: "travel", type: "number", sortOrder: 4, hint: "Used for reimbursement and job profitability." },
    { key: "travel.avgMph", value: "34", label: "Average speed (mph)", group: "travel", type: "number", sortOrder: 5, hint: "Vermont secondary roads. Lower it in winter." },
    { key: "travel.roadFactor", value: "1.28", label: "Road winding factor", group: "travel", type: "number", sortOrder: 6, hint: "Multiplier from straight-line distance to real road miles." },
    { key: "travel.bufferMinutes", value: "5", label: "Per-stop buffer (minutes)", group: "travel", type: "number", sortOrder: 7, hint: "Parking, unloading gear, finding the door." },
    { key: "travel.returnToHq", value: "true", label: "Count the drive home", group: "travel", type: "boolean", sortOrder: 8 },

    { key: "estimating.defaultCrewSize", value: "1", label: "Default crew size", group: "estimating", type: "number", sortOrder: 1 },
    { key: "estimating.showPublicEstimate", value: "true", label: "Show instant estimates on the website", group: "estimating", type: "boolean", sortOrder: 2, hint: "Turn off to collect enquiries without quoting a number." },
    { key: "estimating.publicBufferPercent", value: "10", label: "Public estimate padding (%)", group: "estimating", type: "number", sortOrder: 3, hint: "Quote slightly high to the public so you rarely go over." },
  ];

  await Promise.all(settings.map((data) => prisma.setting.create({ data })));

  console.log(`✓ ${services.length} services, ${addOns.length} add-ons`);
  console.log(`✓ ${clients.length} clients, ${jobSeeds.length} jobs, 3 leads`);
  console.log("✓ Owners: laura@elitecleaning802.com / lisa@elitecleaning802.com");
  console.log("  Password: elite802");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
