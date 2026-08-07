"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { submitQuote, type QuoteState } from "@/app/(site)/contact/actions";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { CONDITION_LABELS } from "@/lib/estimate";

type Service = { id: string; slug: string; name: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full">
      {pending ? "Sending…" : "Send my request"}
      {!pending && <Icon name="arrow" className="size-4" />}
    </Button>
  );
}

const initial: QuoteState = { ok: false };

export function QuoteForm({ services }: { services: Service[] }) {
  const [state, action] = useActionState(submitQuote, initial);
  const params = useSearchParams();

  // Pre-fill from the homepage estimator so nothing is retyped.
  const preset = {
    service: params.get("service") ?? "",
    sqft: params.get("sqft") ?? "",
    beds: params.get("beds") ?? "",
    baths: params.get("baths") ?? "",
    freq: params.get("freq") ?? "",
    condition: params.get("condition") ?? "3",
  };

  if (state.ok && state.message) {
    return (
      <div className="rounded-card border border-fern-300 bg-fern-50 p-10 text-center dark:border-fern-700 dark:bg-fern-900/40">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-fern-600 text-white">
          <Icon name="check" className="size-7" />
        </span>
        <h2 className="mt-5 font-display text-2xl font-semibold text-text">
          Request received
        </h2>
        <p className="mx-auto mt-3 max-w-sm leading-relaxed text-text-muted">
          {state.message}
        </p>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="rounded-card border border-border-base bg-surface p-7 shadow-e2 sm:p-9"
    >
      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Your name" required error={state.errors?.name}>
            <Input name="name" required autoComplete="name" placeholder="Jane Doe" />
          </Field>
          <Field label="Email" required error={state.errors?.email}>
            <Input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="jane@example.com"
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Phone" error={state.errors?.phone}>
            <Input
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="(802) 555-0100"
            />
          </Field>
          <Field label="What do you need?">
            <Select name="serviceSlug" defaultValue={preset.service}>
              <option value="">Not sure yet</option>
              {services.map((s) => (
                <option key={s.id} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Address" hint="Helps us plan drive time. Street is optional.">
          <Input name="address" autoComplete="street-address" placeholder="18 Grove Street" />
        </Field>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Town">
            <Input name="city" defaultValue="Rutland" autoComplete="address-level2" />
          </Field>
          <Field label="ZIP">
            <Input name="zip" autoComplete="postal-code" placeholder="05701" />
          </Field>
          <Field label="Property type">
            <Select name="propertyType" defaultValue="residential">
              <option value="residential">Home</option>
              <option value="airbnb">Airbnb / rental</option>
              <option value="commercial">Office / commercial</option>
            </Select>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Square feet">
            <Input
              name="squareFeet"
              type="number"
              min={0}
              defaultValue={preset.sqft}
              placeholder="1800"
            />
          </Field>
          <Field label="Bedrooms">
            <Input
              name="bedrooms"
              type="number"
              min={0}
              defaultValue={preset.beds}
              placeholder="3"
            />
          </Field>
          <Field label="Bathrooms">
            <Input
              name="bathrooms"
              type="number"
              min={0}
              defaultValue={preset.baths}
              placeholder="2"
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="How often?">
            <Select name="frequency" defaultValue={preset.freq || "biweekly"}>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Every two weeks</option>
              <option value="monthly">Monthly</option>
              <option value="one-time">One time</option>
            </Select>
          </Field>
          <Field label="Current condition">
            <Select name="conditionLevel" defaultValue={preset.condition}>
              {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          label="Preferred start date"
          hint="Optional — tells us how soon you need us."
        >
          <Input name="preferredDate" type="date" />
        </Field>

        <Field label="Anything we should know?">
          <Textarea
            name="message"
            rows={4}
            placeholder="Pets, access, problem areas, tight timelines…"
          />
        </Field>

        {/* Honeypot — visually and programmatically hidden from humans. */}
        <div aria-hidden className="hidden">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        {state.message && !state.ok && (
          <p
            role="alert"
            className="rounded-field border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
          >
            {state.message}
          </p>
        )}

        <SubmitButton />

        <p className="text-center text-xs text-text-subtle">
          No spam, no sales calls. We reply within one business day.
        </p>
      </div>
    </form>
  );
}
