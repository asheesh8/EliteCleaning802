/**
 * Travel engine.
 *
 * Drive time is the hidden cost in a cleaning business: two jobs that
 * bill the same can earn very differently once you count the 40 minutes
 * between them. This module turns a day's jobs into an ordered route
 * with per-leg drive time, mileage, and cost.
 *
 * Distance uses the haversine formula against stored lat/lng, scaled by
 * a road-winding factor. That is deliberately dependency-free and works
 * offline; `estimateLeg` is the single seam to swap in a real routing
 * API (Google Distance Matrix, Mapbox) without touching callers.
 */

export type Waypoint = {
  id: string;
  label: string;
  lat?: number | null;
  lng?: number | null;
};

export type TravelLeg = {
  fromId: string;
  fromLabel: string;
  toId: string;
  toLabel: string;
  miles: number;
  minutes: number;
  /** Mileage reimbursement for this leg, in cents. */
  cost: number;
  /** True when either endpoint lacks coordinates and we fell back. */
  estimated: boolean;
};

export type TravelSettings = {
  /** Straight-line miles are optimistic; roads wind. */
  roadFactor: number;
  /** Average speed on Vermont secondary roads. */
  avgMph: number;
  /** IRS-style reimbursement, cents per mile. */
  centsPerMile: number;
  /** Fixed minutes added to every leg for parking, gear, doors. */
  bufferMinutes: number;
};

export const DEFAULT_TRAVEL_SETTINGS: TravelSettings = {
  roadFactor: 1.28,
  avgMph: 34,
  centsPerMile: 70,
  bufferMinutes: 5,
};

const EARTH_RADIUS_MILES = 3958.8;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in miles between two coordinates. */
export function haversineMiles(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

/**
 * Drive time and cost between two points.
 *
 * When coordinates are missing we return a conservative default rather
 * than zero — a silent 0 would quietly under-book the day, which is the
 * exact failure this feature exists to prevent.
 */
export function estimateLeg(
  from: Waypoint,
  to: Waypoint,
  settings: TravelSettings = DEFAULT_TRAVEL_SETTINGS,
): TravelLeg {
  const hasCoords =
    from.lat != null && from.lng != null && to.lat != null && to.lng != null;

  if (!hasCoords) {
    const FALLBACK_MILES = 8;
    const minutes =
      Math.round((FALLBACK_MILES / settings.avgMph) * 60) +
      settings.bufferMinutes;
    return {
      fromId: from.id,
      fromLabel: from.label,
      toId: to.id,
      toLabel: to.label,
      miles: FALLBACK_MILES,
      minutes,
      cost: Math.round(FALLBACK_MILES * settings.centsPerMile),
      estimated: true,
    };
  }

  const straight = haversineMiles(from.lat!, from.lng!, to.lat!, to.lng!);
  const miles = Math.round(straight * settings.roadFactor * 10) / 10;
  const minutes =
    Math.round((miles / settings.avgMph) * 60) + settings.bufferMinutes;

  return {
    fromId: from.id,
    fromLabel: from.label,
    toId: to.id,
    toLabel: to.label,
    miles,
    minutes,
    cost: Math.round(miles * settings.centsPerMile),
    estimated: false,
  };
}

export type RouteStop = {
  waypoint: Waypoint;
  /** Time on site for this stop, in minutes. */
  onSiteMinutes: number;
  legIn: TravelLeg;
};

export type RouteSummary = {
  stops: RouteStop[];
  returnLeg: TravelLeg | null;
  totalTravelMinutes: number;
  totalTravelMiles: number;
  totalTravelCost: number;
  totalOnSiteMinutes: number;
  /** Door-to-door: travel + on-site + return to HQ. */
  totalDayMinutes: number;
  /** Share of the day spent driving rather than cleaning. */
  travelSharePercent: number;
};

/**
 * Build a route for one day, in the order given.
 *
 * The order is respected rather than optimised: Laura and Lisa book
 * around client time windows, so a "smarter" reordering would fight the
 * schedule. `optimiseOrder` below is offered separately, as a suggestion.
 */
export function buildRoute(
  hq: Waypoint,
  stops: Array<{ waypoint: Waypoint; onSiteMinutes: number }>,
  settings: TravelSettings = DEFAULT_TRAVEL_SETTINGS,
  options: { returnToHq?: boolean } = {},
): RouteSummary {
  const routeStops: RouteStop[] = [];
  let previous = hq;

  for (const stop of stops) {
    const legIn = estimateLeg(previous, stop.waypoint, settings);
    routeStops.push({
      waypoint: stop.waypoint,
      onSiteMinutes: stop.onSiteMinutes,
      legIn,
    });
    previous = stop.waypoint;
  }

  const returnLeg =
    options.returnToHq && stops.length > 0
      ? estimateLeg(previous, hq, settings)
      : null;

  const legs = [...routeStops.map((s) => s.legIn), ...(returnLeg ? [returnLeg] : [])];

  const totalTravelMinutes = legs.reduce((sum, l) => sum + l.minutes, 0);
  const totalTravelMiles =
    Math.round(legs.reduce((sum, l) => sum + l.miles, 0) * 10) / 10;
  const totalTravelCost = legs.reduce((sum, l) => sum + l.cost, 0);
  const totalOnSiteMinutes = routeStops.reduce(
    (sum, s) => sum + s.onSiteMinutes,
    0,
  );
  const totalDayMinutes = totalTravelMinutes + totalOnSiteMinutes;

  return {
    stops: routeStops,
    returnLeg,
    totalTravelMinutes,
    totalTravelMiles,
    totalTravelCost,
    totalOnSiteMinutes,
    totalDayMinutes,
    travelSharePercent:
      totalDayMinutes > 0
        ? Math.round((totalTravelMinutes / totalDayMinutes) * 100)
        : 0,
  };
}

/**
 * Nearest-neighbour reordering, offered as a suggestion in the UI.
 *
 * Nearest-neighbour is not optimal, but for the 3–7 stops a two-person
 * crew actually runs in a day it lands within a few minutes of optimal
 * while staying instant and easy to explain.
 */
export function optimiseOrder<T extends { waypoint: Waypoint }>(
  hq: Waypoint,
  stops: T[],
  settings: TravelSettings = DEFAULT_TRAVEL_SETTINGS,
): T[] {
  const remaining = [...stops];
  const ordered: T[] = [];
  let current = hq;

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestMinutes = Infinity;

    remaining.forEach((candidate, index) => {
      const { minutes } = estimateLeg(current, candidate.waypoint, settings);
      if (minutes < bestMinutes) {
        bestMinutes = minutes;
        bestIndex = index;
      }
    });

    const [next] = remaining.splice(bestIndex, 1);
    ordered.push(next);
    current = next.waypoint;
  }

  return ordered;
}

export function formatMiles(miles: number) {
  return `${miles.toFixed(1)} mi`;
}
