"use client";

import { useMemo, useState } from "react";
import { Field, Input, Select } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Panel } from "@/components/crm/ui";
import {
  CONDITION_LABELS,
  estimateJob,
  formatDuration,
} from "@/lib/estimate";
import { type TravelSettings } from "@/lib/travel";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";

type Service = {
  id: string;
  name: string;
  hourlyRate: number;
  baseMinutes: number;
  minutesPer1kSqFt: number;
  minutesPerBedroom: number;
  minutesPerBathroom: number;
  setupMinutes: number;
};

type AddOn = { id: string; name: string; minutes: number; price: number };

/**
 * A sandbox for pricing hypothetical jobs.
 *
 * Deliberately separate from the job editor: this is where the owners
 * answer "what would a 4-bed deep clean in Brandon actually cost us?"
 * without creating anything.
 */
export function EstimatorPlayground({
  services,
  addOns,
  travel,
  crewRate,
}: {
  services: Service[];
  addOns: AddOn[];
  travel: TravelSettings & { hqLat: number; hqLng: number; hqLabel: string };
  crewRate: number;
}) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [squareFeet, setSquareFeet] = useState(2000);
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);
  const [condition, setCondition] = useState(3);
  const [frequency, setFrequency] = useState("biweekly");
  const [firstVisit, setFirstVisit] = useState(false);
  const [crewSize, setCrewSize] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [miles, setMiles] = useState(8);

  const service = services.find((s) => s.id === serviceId) ?? services[0];

  const addOnMinutes = addOns
    .filter((a) => selected.includes(a.id))
    .reduce((sum, a) => sum + a.minutes, 0);
  const addOnPrice = addOns
    .filter((a) => selected.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0);

  const estimate = useMemo(() => {
    if (!service) return null;
    return estimateJob({
      baseMinutes: service.baseMinutes,
      minutesPer1kSqFt: service.minutesPer1kSqFt,
      minutesPerBedroom: service.minutesPerBedroom,
      minutesPerBathroom: service.minutesPerBathroom,
      setupMinutes: service.setupMinutes,
      squareFeet,
      bedrooms,
      bathrooms,
      conditionLevel: condition,
      frequency,
      firstVisit,
      addOnMinutes,
      crewSize,
    });
  }, [
    service,
    squareFeet,
    bedrooms,
    bathrooms,
    condition,
    frequency,
    firstVisit,
    addOnMinutes,
    crewSize,
  ]);

  // Round-trip drive, derived from a straight-line mile count so the
  // owners can sanity-check "is this town worth it?".
  const legMinutes = Math.round((miles / travel.avgMph) * 60) + travel.bufferMinutes;
  const travelMinutes = legMinutes * 2;
  const travelCost = Math.round(miles * 2 * travel.centsPerMile);

  if (!service || !estimate) return null;

  const price =
    Math.round(((estimate.laborMinutes / 60) * service.hourlyRate) / 500) * 500 +
    addOnPrice;

  // Labour is charged per person, so crew size multiplies cost.
  const laborCost = Math.round((estimate.laborMinutes / 60) * crewRate);
  const profit = price - laborCost - travelCost;
  const margin = price > 0 ? Math.round((profit / price) * 100) : 0;

  // Effective hourly rate counting the drive — the number that decides
  // whether a far-away job is actually worth taking.
  const doorToDoorHours = (estimate.onSiteMinutes + travelMinutes) / 60;
  const effectiveHourly = doorToDoorHours > 0 ? price / doorToDoorHours : 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      {/* ---------- Inputs ---------- */}
      <Panel title="The job" description="Nothing here is saved.">
        <div className="space-y-5 px-5 py-5">
          <Field label="Service">
            <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={`Size — ${squareFeet.toLocaleString()} sq ft`}>
            <input
              type="range"
              min={400}
              max={8000}
              step={100}
              value={squareFeet}
              onChange={(e) => setSquareFeet(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-cream-200 accent-plum-800 dark:bg-cream-800"
              aria-label="Square footage"
            />
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Bedrooms">
              <Input
                type="number"
                min={0}
                value={bedrooms}
                onChange={(e) => setBedrooms(Math.max(0, Number(e.target.value)))}
              />
            </Field>
            <Field label="Bathrooms">
              <Input
                type="number"
                min={0}
                value={bathrooms}
                onChange={(e) => setBathrooms(Math.max(0, Number(e.target.value)))}
              />
            </Field>
            <Field label="Crew size">
              <Input
                type="number"
                min={1}
                max={6}
                value={crewSize}
                onChange={(e) => setCrewSize(Math.max(1, Number(e.target.value)))}
              />
            </Field>
          </div>

          <Field label="Condition">
            <Select value={condition} onChange={(e) => setCondition(Number(e.target.value))}>
              {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Frequency">
            <Select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Every two weeks</option>
              <option value="monthly">Monthly</option>
              <option value="one-time">One time</option>
            </Select>
          </Field>

          <label className="flex items-center gap-2.5 text-sm text-text">
            <input
              type="checkbox"
              checked={firstVisit}
              onChange={(e) => setFirstVisit(e.target.checked)}
              className="size-4 accent-plum-800"
            />
            First visit (adds a deep-clean premium)
          </label>

          <Field label={`Distance one way — ${miles} miles`}>
            <input
              type="range"
              min={0}
              max={45}
              step={1}
              value={miles}
              onChange={(e) => setMiles(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-cream-200 accent-plum-800 dark:bg-cream-800"
              aria-label="Distance one way"
            />
            <span className="mt-1.5 block text-xs text-text-subtle">
              From {travel.hqLabel} · {formatDuration(travelMinutes)} round trip
            </span>
          </Field>

          <Field label="Add-ons">
            <div className="flex flex-wrap gap-2">
              {addOns.map((a) => {
                const on = selected.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() =>
                      setSelected((prev) =>
                        prev.includes(a.id)
                          ? prev.filter((x) => x !== a.id)
                          : [...prev, a.id],
                      )
                    }
                    aria-pressed={on}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                      on
                        ? "border-brand bg-plum-100 text-plum-800 dark:bg-plum-950 dark:text-plum-200"
                        : "border-border-strong bg-surface text-text-muted hover:text-text",
                    )}
                  >
                    <Icon name={on ? "check" : "plus"} className="size-3" />
                    {a.name}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>
      </Panel>

      {/* ---------- Output ---------- */}
      <div className="flex flex-col gap-6">
        <div className="overflow-hidden rounded-card border border-border-base bg-surface">
          <div className="bg-plum-800 p-6 text-cream-50">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-[0.14em] text-plum-300">
                  <Icon name="clock" className="size-3.5" />
                  On site
                </p>
                <p className="mt-1.5 font-display text-4xl font-semibold tabular">
                  {formatDuration(estimate.onSiteMinutes)}
                </p>
                <p className="mt-1 text-xs text-plum-300">
                  {formatDuration(estimate.laborMinutes)} of labour ÷ {crewSize}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-plum-300">
                  Quote
                </p>
                <p className="mt-1.5 font-display text-4xl font-semibold tabular">
                  {money(price)}
                </p>
                <p className="mt-1 text-xs text-plum-300">
                  {money(service.hourlyRate)}/hr basis
                </p>
              </div>
            </div>
          </div>

          <dl className="divide-y divide-[var(--border)] px-5 py-1 text-sm">
            {estimate.lines.map((line, i) => (
              <div
                key={`${line.label}-${i}`}
                className="flex items-center justify-between gap-4 py-2.5"
              >
                <dt className="text-text-muted">{line.label}</dt>
                <dd className="tabular font-medium text-text">
                  {line.multiplier
                    ? `×${line.multiplier} (${line.minutes > 0 ? "+" : ""}${line.minutes}m)`
                    : `${line.minutes}m`}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ---------- Is it worth it? ---------- */}
        <Panel title="Is this job worth taking?">
          <dl className="divide-y divide-[var(--border)] px-5 py-1 text-sm">
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-text-muted">Revenue</dt>
              <dd className="tabular font-semibold text-text">{money(price)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-text-muted">
                Labour ({formatDuration(estimate.laborMinutes)} @ {money(crewRate)}/hr)
              </dt>
              <dd className="tabular font-medium text-red-600 dark:text-red-400">
                −{money(laborCost)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-text-muted">
                Travel ({miles * 2} mi round trip)
              </dt>
              <dd className="tabular font-medium text-red-600 dark:text-red-400">
                −{money(travelCost)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="font-semibold text-text">Profit</dt>
              <dd
                className={cn(
                  "font-display text-lg font-semibold tabular",
                  profit > 0
                    ? "text-fern-700 dark:text-fern-400"
                    : "text-red-600 dark:text-red-400",
                )}
              >
                {money(profit)} <span className="text-sm font-normal">({margin}%)</span>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-text-muted">
                Effective rate, door to door
              </dt>
              <dd className="tabular font-semibold text-text">
                {money(Math.round(effectiveHourly))}/hr
              </dd>
            </div>
          </dl>

          <div className="border-t border-border-base bg-surface-2 px-5 py-4">
            <p
              className={cn(
                "flex items-start gap-2 text-sm",
                margin >= 40
                  ? "text-fern-700 dark:text-fern-400"
                  : margin >= 20
                    ? "text-text-muted"
                    : "text-amber-700 dark:text-amber-400",
              )}
            >
              <Icon
                name={margin >= 40 ? "check" : "bolt"}
                className="mt-0.5 size-4 shrink-0"
              />
              <span>
                {margin >= 40
                  ? "Strong margin. Worth the drive."
                  : margin >= 20
                    ? "Workable, but the drive is eating into it. Consider grouping with a nearby job."
                    : `Thin at ${margin}%. Raise the quote, or only take it alongside another job in that direction.`}
              </span>
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
