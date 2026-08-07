"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Field, Select, Input } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { money } from "@/lib/format";
import {
  CONDITION_LABELS,
  estimateJob,
  formatDuration,
} from "@/lib/estimate";
import { cn } from "@/lib/utils";

type Service = {
  id: string;
  slug: string;
  name: string;
  category: string;
  hourlyRate: number;
  baseMinutes: number;
  minutesPer1kSqFt: number;
  minutesPerBedroom: number;
  minutesPerBathroom: number;
  setupMinutes: number;
};

type AddOn = { id: string; slug: string; name: string; minutes: number; price: number };

/**
 * The public-facing estimator.
 *
 * Runs the exact same `estimateJob` the CRM schedules against, so the
 * number a visitor sees is the number Laura and Lisa plan their day
 * around. A small padding percentage is applied on the public side so
 * the quote errs high rather than low.
 */
const PUBLIC_PADDING = 0.1;

export function QuoteEstimator({
  services,
  addOns,
}: {
  services: Service[];
  addOns: AddOn[];
}) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [squareFeet, setSquareFeet] = useState(1800);
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);
  const [condition, setCondition] = useState(3);
  const [frequency, setFrequency] = useState("biweekly");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const service = services.find((s) => s.id === serviceId) ?? services[0];

  const addOnMinutes = useMemo(
    () =>
      addOns
        .filter((a) => selectedAddOns.includes(a.id))
        .reduce((sum, a) => sum + a.minutes, 0),
    [addOns, selectedAddOns],
  );

  const addOnPrice = useMemo(
    () =>
      addOns
        .filter((a) => selectedAddOns.includes(a.id))
        .reduce((sum, a) => sum + a.price, 0),
    [addOns, selectedAddOns],
  );

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
      firstVisit: true,
      addOnMinutes,
      crewSize: 1,
    });
  }, [service, squareFeet, bedrooms, bathrooms, condition, frequency, addOnMinutes]);

  if (!service || !estimate) return null;

  const paddedMinutes = Math.round(estimate.laborMinutes * (1 + PUBLIC_PADDING));
  const price =
    Math.round(((paddedMinutes / 60) * service.hourlyRate) / 500) * 500 +
    addOnPrice;

  const isCommercial = service.category === "commercial";

  function toggleAddOn(id: string) {
    setSelectedAddOns((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-border-base bg-surface shadow-e2">
      {/* ---------- Inputs ---------- */}
      <div className="space-y-5 p-6 sm:p-7">
        <Field label="What do you need?">
          <Select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={`Approximate size — ${squareFeet.toLocaleString()} sq ft`}>
          <input
            type="range"
            min={400}
            max={6000}
            step={100}
            value={squareFeet}
            onChange={(e) => setSquareFeet(Number(e.target.value))}
            className="mt-1 h-2 w-full cursor-pointer appearance-none rounded-full bg-cream-200 accent-plum-800 dark:bg-cream-800"
            aria-label="Approximate square footage"
          />
          <div className="mt-1.5 flex justify-between text-2xs text-text-subtle">
            <span>400</span>
            <span>6,000+</span>
          </div>
        </Field>

        {!isCommercial && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Bedrooms">
              <Input
                type="number"
                min={0}
                max={12}
                value={bedrooms}
                onChange={(e) => setBedrooms(Math.max(0, Number(e.target.value)))}
              />
            </Field>
            <Field label="Bathrooms">
              <Input
                type="number"
                min={0}
                max={12}
                value={bathrooms}
                onChange={(e) => setBathrooms(Math.max(0, Number(e.target.value)))}
              />
            </Field>
          </div>
        )}

        <Field label="Current condition">
          <Select
            value={condition}
            onChange={(e) => setCondition(Number(e.target.value))}
          >
            {Object.entries(CONDITION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="How often?">
          <div className="grid grid-cols-4 gap-2">
            {[
              ["weekly", "Weekly"],
              ["biweekly", "2 weeks"],
              ["monthly", "Monthly"],
              ["one-time", "One-time"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFrequency(value)}
                aria-pressed={frequency === value}
                className={cn(
                  "rounded-field border px-2 py-2.5 text-xs font-semibold transition-all",
                  frequency === value
                    ? "border-brand bg-brand text-on-brand shadow-e1"
                    : "border-border-strong bg-surface text-text-muted hover:border-plum-300 hover:text-text",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Add-ons" hint="Optional extras, priced per visit.">
          <div className="flex flex-wrap gap-2">
            {addOns.map((a) => {
              const on = selectedAddOns.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggleAddOn(a.id)}
                  aria-pressed={on}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    on
                      ? "border-brand bg-plum-100 text-plum-800 dark:bg-plum-950 dark:text-plum-200"
                      : "border-border-strong bg-surface text-text-muted hover:border-plum-300 hover:text-text",
                  )}
                >
                  <Icon
                    name={on ? "check" : "plus"}
                    className="size-3"
                  />
                  {a.name}
                </button>
              );
            })}
          </div>
        </Field>
      </div>

      {/* ---------- Result ---------- */}
      <div className="border-t border-border-base bg-plum-800 p-6 text-cream-50 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-[0.14em] text-plum-300">
              <Icon name="clock" className="size-3.5" />
              Estimated time
            </p>
            <p className="mt-1.5 font-display text-4xl font-semibold tabular">
              {formatDuration(paddedMinutes)}
            </p>
            <p className="mt-1 text-xs text-plum-300">
              About {formatDuration(Math.round(paddedMinutes / 1.7))} with two
              cleaners
            </p>
          </div>

          <div className="text-right">
            <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-plum-300">
              Estimated price
            </p>
            <p className="mt-1.5 font-display text-4xl font-semibold tabular">
              {money(price)}
            </p>
            <p className="mt-1 text-xs text-plum-300">per visit, before tax</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowBreakdown((v) => !v)}
          aria-expanded={showBreakdown}
          className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-plum-200 transition-colors hover:text-cream-50"
        >
          <Icon
            name="chevron"
            className={cn(
              "size-3.5 transition-transform",
              showBreakdown && "rotate-90",
            )}
          />
          {showBreakdown ? "Hide" : "Show"} how we got this
        </button>

        {showBreakdown && (
          <dl className="mt-4 space-y-1.5 border-t border-plum-600/50 pt-4 text-sm">
            {estimate.lines.map((line) => (
              <div key={line.label} className="flex justify-between gap-4">
                <dt className="text-plum-200">{line.label}</dt>
                <dd className="tabular text-cream-50">
                  {line.multiplier
                    ? `×${line.multiplier} (${line.minutes > 0 ? "+" : ""}${line.minutes}m)`
                    : `${line.minutes}m`}
                </dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 border-t border-plum-600/50 pt-2 font-semibold">
              <dt>Padded for accuracy</dt>
              <dd className="tabular">
                +{paddedMinutes - estimate.laborMinutes}m
              </dd>
            </div>
          </dl>
        )}

        <Link
          href={`/contact?service=${service.slug}&sqft=${squareFeet}&beds=${bedrooms}&baths=${bathrooms}&freq=${frequency}&condition=${condition}`}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-field bg-cream-50 text-sm font-semibold text-plum-900 transition-colors hover:bg-white"
        >
          Book this estimate
          <Icon name="arrow" className="size-4" />
        </Link>

        <p className="mt-3 text-center text-2xs text-plum-300">
          An estimate, not a contract. We confirm after a free walkthrough.
        </p>
      </div>
    </div>
  );
}
