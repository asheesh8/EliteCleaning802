import "server-only";

import { prisma } from "@/lib/db";
import { buildRoute, type Waypoint } from "@/lib/travel";
import { getTravelSettings } from "@/lib/settings";

/** Local-midnight bounds for a given day. */
export function dayBounds(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/** Monday-start week bounds. */
export function weekBounds(date: Date) {
  const start = new Date(date);
  const day = (start.getDay() + 6) % 7; // Monday = 0
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export type JobWithContext = Awaited<ReturnType<typeof getJobsBetween>>[number];

export async function getJobsBetween(start: Date, end: Date) {
  return prisma.job.findMany({
    where: { scheduledFor: { gte: start, lte: end } },
    orderBy: { scheduledFor: "asc" },
    include: {
      client: true,
      service: true,
      assignments: { include: { user: true } },
      addOns: { include: { addOn: true } },
    },
  });
}

/** Minutes a job is expected to take, honouring an owner override. */
export function jobMinutes(job: {
  estimatedMinutes: number;
  overrideMinutes: number | null;
  actualMinutes: number | null;
}) {
  return job.actualMinutes ?? job.overrideMinutes ?? job.estimatedMinutes;
}

/**
 * Build the travel route for one day from the jobs already scheduled.
 * Used by the dashboard, the schedule, and the travel page — one source
 * of truth so the three screens can never disagree about the drive.
 */
export async function getDayRoute(date: Date) {
  const { start, end } = dayBounds(date);
  const [jobs, travel] = await Promise.all([
    getJobsBetween(start, end),
    getTravelSettings(),
  ]);

  const active = jobs.filter((j) => j.status !== "cancelled");

  const hq: Waypoint = {
    id: "hq",
    label: travel.hqLabel,
    lat: travel.hqLat,
    lng: travel.hqLng,
  };

  const route = buildRoute(
    hq,
    active.map((job) => ({
      waypoint: {
        id: job.id,
        label: job.client.name,
        lat: job.client.lat,
        lng: job.client.lng,
      },
      onSiteMinutes: jobMinutes(job),
    })),
    travel,
    { returnToHq: travel.returnToHq },
  );

  return { jobs: active, route, travel, hq };
}
