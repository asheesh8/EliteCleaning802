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

/**
 * Ordered by sortOrder alone, deliberately.
 *
 * Sorting `featured` first would lift "Oven — after" to the top of the
 * page and strand "Oven — before" three rows below it. Curated order is
 * what keeps a before/after pair side by side; `featured` only decides
 * what the home page shows — see `getFeaturedGallery`.
 */
export const getGallery = cache(async () =>
  prisma.galleryItem.findMany({
    where: { published: true },
    orderBy: { sortOrder: "asc" },
  }),
);

/** The handful of shots strong enough to lead the home page. */
export const getFeaturedGallery = cache(async (take = 4) => {
  const featured = await prisma.galleryItem.findMany({
    where: { published: true, featured: true },
    orderBy: { sortOrder: "asc" },
    take,
  });

  if (featured.length >= take) return featured;

  // Not enough featured picks yet — top up from the rest so the home
  // page strip never renders half-empty.
  const filler = await prisma.galleryItem.findMany({
    where: { published: true, featured: false },
    orderBy: { sortOrder: "asc" },
    take: take - featured.length,
  });

  return [...featured, ...filler];
});
