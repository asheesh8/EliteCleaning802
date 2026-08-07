/**
 * Estimated-time engine.
 *
 * One pure function, used in three places that must never disagree:
 *   - the public quote form (what the visitor is shown)
 *   - the CRM job editor (what Laura and Lisa schedule against)
 *   - the estimator playground in the CRM (what they tune)
 *
 * Every estimate returns its own breakdown, so a number on screen can
 * always be expanded into the line items that produced it. An estimate
 * nobody can explain is an estimate nobody trusts.
 */

export type EstimateInput = {
  /** Time formula from the Service record. */
  baseMinutes: number;
  minutesPer1kSqFt: number;
  minutesPerBedroom: number;
  minutesPerBathroom: number;
  setupMinutes: number;

  /** Property profile. */
  squareFeet?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;

  /** 1 = spotless upkeep … 5 = heavy first-time deep clean. */
  conditionLevel?: number | null;
  /** How often we visit. Recurring visits get faster. */
  frequency?: string | null;
  /** Whether this is the first ever visit to the property. */
  firstVisit?: boolean;

  /** Selected add-ons, already resolved to minutes. */
  addOnMinutes?: number;

  /** People on the job. Wall-clock time divides across the crew. */
  crewSize?: number;
};

export type EstimateLine = {
  label: string;
  minutes: number;
  /** Multipliers render as "x1.25" rather than a minute count. */
  multiplier?: number;
};

export type EstimateResult = {
  /** Total person-minutes of labour. */
  laborMinutes: number;
  /** Wall-clock minutes on site, after dividing across the crew. */
  onSiteMinutes: number;
  crewSize: number;
  lines: EstimateLine[];
};

/**
 * How much longer a place takes based on how dirty it is.
 * Level 3 is the baseline — a normal, lived-in home.
 */
const CONDITION_MULTIPLIER: Record<number, number> = {
  1: 0.8, // spotless, maintained weekly
  2: 0.9,
  3: 1.0, // normal
  4: 1.25,
  5: 1.55, // neglected / post-construction
};

/**
 * Recurring clients get faster over time: less clutter, known layout,
 * and no deep-clean backlog. These are the multipliers the industry
 * broadly uses; they're tunable per-business in Settings.
 */
const FREQUENCY_MULTIPLIER: Record<string, number> = {
  weekly: 0.75,
  biweekly: 0.85,
  monthly: 0.95,
  "one-time": 1.0,
};

/** A first visit always carries a deep-clean premium. */
const FIRST_VISIT_MULTIPLIER = 1.3;

const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);

export function estimateJob(input: EstimateInput): EstimateResult {
  const lines: EstimateLine[] = [];

  const base = Math.max(0, input.baseMinutes || 0);
  if (base > 0) lines.push({ label: "Base service", minutes: base });

  // Square footage, charged per 1,000 sq ft so the setting reads naturally.
  const sqFt = Math.max(0, input.squareFeet ?? 0);
  const sqFtMinutes =
    sqFt > 0 ? (sqFt / 1000) * Math.max(0, input.minutesPer1kSqFt || 0) : 0;
  if (sqFtMinutes > 0) {
    lines.push({
      label: `${sqFt.toLocaleString()} sq ft`,
      minutes: Math.round(sqFtMinutes),
    });
  }

  const bedrooms = Math.max(0, input.bedrooms ?? 0);
  const bedroomMinutes = bedrooms * Math.max(0, input.minutesPerBedroom || 0);
  if (bedroomMinutes > 0) {
    lines.push({
      label: `${bedrooms} bedroom${bedrooms === 1 ? "" : "s"}`,
      minutes: bedroomMinutes,
    });
  }

  const bathrooms = Math.max(0, input.bathrooms ?? 0);
  const bathroomMinutes = bathrooms * Math.max(0, input.minutesPerBathroom || 0);
  if (bathroomMinutes > 0) {
    lines.push({
      label: `${bathrooms} bathroom${bathrooms === 1 ? "" : "s"}`,
      minutes: bathroomMinutes,
    });
  }

  const addOns = Math.max(0, input.addOnMinutes ?? 0);
  if (addOns > 0) lines.push({ label: "Add-ons", minutes: addOns });

  // Subtotal before multipliers. Setup is deliberately excluded — loading
  // the van doesn't take 55% longer because a house is filthy.
  let subtotal =
    base + sqFtMinutes + bedroomMinutes + bathroomMinutes + addOns;

  const condition = CONDITION_MULTIPLIER[input.conditionLevel ?? 3] ?? 1;
  if (condition !== 1) {
    const delta = subtotal * condition - subtotal;
    lines.push({
      label: `Condition level ${input.conditionLevel ?? 3}`,
      minutes: Math.round(delta),
      multiplier: condition,
    });
    subtotal *= condition;
  }

  const frequency = FREQUENCY_MULTIPLIER[input.frequency ?? "one-time"] ?? 1;
  if (frequency !== 1) {
    const delta = subtotal * frequency - subtotal;
    lines.push({
      label: `${labelFrequency(input.frequency)} visit`,
      minutes: Math.round(delta),
      multiplier: frequency,
    });
    subtotal *= frequency;
  }

  if (input.firstVisit) {
    const delta = subtotal * FIRST_VISIT_MULTIPLIER - subtotal;
    lines.push({
      label: "First visit deep clean",
      minutes: Math.round(delta),
      multiplier: FIRST_VISIT_MULTIPLIER,
    });
    subtotal *= FIRST_VISIT_MULTIPLIER;
  }

  const setup = Math.max(0, input.setupMinutes || 0);
  if (setup > 0) lines.push({ label: "Setup & supplies", minutes: setup });

  const laborMinutes = round5(subtotal + setup);

  // Two cleaners don't halve the work perfectly — there's coordination
  // overhead, and some tasks (one bathroom) can't be parallelised.
  const crewSize = Math.max(1, Math.round(input.crewSize ?? 1));
  const crewEfficiency = crewSize === 1 ? 1 : 1 / (crewSize * 0.85);
  const onSiteMinutes = round5(laborMinutes * crewEfficiency);

  return { laborMinutes, onSiteMinutes, crewSize, lines };
}

function labelFrequency(frequency?: string | null) {
  switch (frequency) {
    case "weekly":
      return "Weekly";
    case "biweekly":
      return "Bi-weekly";
    case "monthly":
      return "Monthly";
    default:
      return "One-time";
  }
}

/** "2h 45m" — the only place minutes get formatted for humans. */
export function formatDuration(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Compare an estimate against what actually happened.
 * This is what turns the CRM into something that gets smarter: after a
 * few dozen jobs the owners can see which services they consistently
 * under-quote and nudge the formula.
 */
export function estimateAccuracy(estimated: number, actual: number) {
  if (!estimated || !actual) return null;
  const deltaMinutes = actual - estimated;
  const deltaPercent = Math.round((deltaMinutes / estimated) * 100);
  return {
    deltaMinutes,
    deltaPercent,
    // Within 10% is a good estimate in this trade.
    verdict:
      Math.abs(deltaPercent) <= 10
        ? ("on-target" as const)
        : deltaMinutes > 0
          ? ("over" as const)
          : ("under" as const),
  };
}

export const CONDITION_LABELS: Record<number, string> = {
  1: "Spotless — weekly upkeep",
  2: "Light — tidy, low traffic",
  3: "Normal — lived in",
  4: "Heavy — needs real work",
  5: "Deep — neglected or post-construction",
};
