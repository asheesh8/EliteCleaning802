import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/db";
import { brand } from "@/lib/brand";
import { DEFAULT_TRAVEL_SETTINGS, type TravelSettings } from "@/lib/travel";

/**
 * Settings are a key/value table so the owners can edit copy and operating
 * numbers without a deploy. `cache` dedupes the read across a render pass.
 */
export const getSettings = cache(async (): Promise<Record<string, string>> => {
  const rows = await prisma.setting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
});

export async function getSiteSettings() {
  const s = await getSettings();
  return {
    phone: s["contact.phone"] || brand.phone,
    email: s["contact.email"] || brand.email,
    serviceArea: s["contact.serviceArea"] || brand.serviceArea,
    hours: s["contact.hours"] || "Mon–Sat, 8am–6pm",
    heroTitle: s["hero.title"] || "Vermont clean, done right.",
    heroBody:
      s["hero.body"] ||
      "Woman-owned and detail-obsessed. We keep Airbnbs, homes, offices, and rentals spotless — including turnovers and post-construction cleans.",
    facebook: s["contact.facebook"] || brand.facebook,
  };
}

/** Travel config, falling back to sane Vermont defaults. */
export async function getTravelSettings(): Promise<
  TravelSettings & { hqLabel: string; hqLat: number; hqLng: number; returnToHq: boolean }
> {
  const s = await getSettings();
  const num = (key: string, fallback: number) => {
    const parsed = Number(s[key]);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  return {
    roadFactor: num("travel.roadFactor", DEFAULT_TRAVEL_SETTINGS.roadFactor),
    avgMph: num("travel.avgMph", DEFAULT_TRAVEL_SETTINGS.avgMph),
    centsPerMile: num("travel.centsPerMile", DEFAULT_TRAVEL_SETTINGS.centsPerMile),
    bufferMinutes: num("travel.bufferMinutes", DEFAULT_TRAVEL_SETTINGS.bufferMinutes),
    hqLabel: s["travel.hqLabel"] || "HQ — Rutland, VT",
    // Rutland, VT town centre.
    hqLat: num("travel.hqLat", 43.6106),
    hqLng: num("travel.hqLng", -72.9726),
    returnToHq: (s["travel.returnToHq"] ?? "true") === "true",
  };
}
