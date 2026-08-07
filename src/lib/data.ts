import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/db";
import { parseList } from "@/lib/utils";

/** Public-facing reads. All cached per render pass. */

export const getServices = cache(async () => {
  const rows = await prisma.service.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((s) => ({ ...s, features: parseList(s.features) }));
});

export const getService = cache(async (slug: string) => {
  const s = await prisma.service.findUnique({ where: { slug } });
  if (!s || !s.active) return null;
  return { ...s, features: parseList(s.features) };
});

export const getAddOns = cache(async () =>
  prisma.addOn.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  }),
);

export const getTestimonials = cache(async () =>
  prisma.testimonial.findMany({
    where: { published: true },
    orderBy: { sortOrder: "asc" },
  }),
);

export const getGallery = cache(async () =>
  prisma.galleryItem.findMany({
    where: { published: true },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
  }),
);
