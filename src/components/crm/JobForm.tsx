"use client";

import { useMemo, useState } from "react";
import { saveJob } from "@/app/crew/actions";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { estimateJob, formatDuration } from "@/lib/estimate";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";

type Client = {
  id: string;
  name: string;
  city: string | null;
  squareFeet: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  conditionLevel: number;
  frequency: string;
  rate: number | null;
};

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
type Crew = { id: string; name: string; color: string };

type Existing = {
  id: string;
  clientId: string;
  serviceId: string | null;
  scheduledFor: string;
  status: string;
  overrideMinutes: number | null;
  price: number | null;
  notes: string | null;
  internalNotes: string | null;
  recurrence: string;
  crewIds: string[];
  addOnIds: string[];
};

/**
 * Job editor with a live estimate.
 *
 * The estimate recomputes as the form changes so the owners can see the
 * schedule impact of adding a crew member or an add-on before saving —
 * the same `estimateJob` the server re-runs on submit.
 */
export function JobForm({
  clients,
  services,
  addOns,
  crew,
  job,
  defaultDate,
}: {
  clients: Client[];
  services: Service[];
  addOns: AddOn[];
  crew: Crew[];
  job?: Existing;
  defaultDate: string;
}) {
  const [clientId, setClientId] = useState(job?.clientId ?? clients[0]?.id ?? "");
  const [serviceId, setServiceId] = useState(job?.serviceId ?? services[0]?.id ?? "");
  const [crewIds, setCrewIds] = useState<string[]>(job?.crewIds ?? []);
  const [addOnIds, setAddOnIds] = useState<string[]>(job?.addOnIds ?? []);
  const [override, setOverride] = useState(
    job?.overrideMinutes ? String(job.overrideMinutes) : "",
  );

  const client = clients.find((c) => c.id === clientId);
  const service = services.find((s) => s.id === serviceId);

  const addOnMinutes = addOns
    .filter((a) => addOnIds.includes(a.id))
    .reduce((sum, a) => sum + a.minutes, 0);
  const addOnPrice = addOns
    .filter((a) => addOnIds.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0);

  const estimate = useMemo(() => {
    if (!service || !client) return null;
    return estimateJob({
      baseMinutes: service.baseMinutes,
      minutesPer1kSqFt: service.minutesPer1kSqFt,
      minutesPerBedroom: service.minutesPerBedroom,
      minutesPerBathroom: service.minutesPerBathroom,
      setupMinutes: service.setupMinutes,
      squareFeet: client.squareFeet,
      bedrooms: client.bedrooms,
      bathrooms: client.bathrooms,
      conditionLevel: client.conditionLevel,
      frequency: client.frequency,
      addOnMinutes,
      crewSize: Math.max(1, crewIds.length),
    });
  }, [service, client, addOnMinutes, crewIds.length]);

  const suggestedPrice = estimate
    ? Math.round(((estimate.laborMinutes / 60) * (service?.hourlyRate ?? 0)) / 500) *
        500 +
      addOnPrice
    : 0;

  const toggle = (list: string[], setList: (v: string[]) => void, id: string) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  return (
    <form action={saveJob} className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      {job && <input type="hidden" name="id" value={job.id} />}

      {/* ---------- Details ---------- */}
      <div className="space-y-5 rounded-card border border-border-base bg-surface p-6">
        <Field label="Client" required>
          <Select
            name="clientId"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.city ? ` — ${c.city}` : ""}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Service">
          <Select
            name="serviceId"
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

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Date & time" required>
            <Input
              name="scheduledFor"
              type="datetime-local"
              defaultValue={job?.scheduledFor ?? defaultDate}
              required
            />
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue={job?.status ?? "scheduled"}>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No show</option>
            </Select>
          </Field>
        </div>

        <Field label="Who's going?" hint="Crew size divides the on-site time.">
          <div className="flex flex-wrap gap-2">
            {crew.map((member) => {
              const on = crewIds.includes(member.id);
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggle(crewIds, setCrewIds, member.id)}
                  aria-pressed={on}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all",
                    on
                      ? "border-brand bg-plum-100 text-plum-800 dark:bg-plum-950 dark:text-plum-200"
                      : "border-border-strong bg-surface text-text-muted hover:text-text",
                  )}
                >
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: member.color }}
                  />
                  {member.name}
                  {on && <Icon name="check" className="size-3.5" />}
                </button>
              );
            })}
          </div>
          {crewIds.map((id) => (
            <input key={id} type="hidden" name="crew" value={id} />
          ))}
        </Field>

        <Field label="Add-ons">
          <div className="flex flex-wrap gap-2">
            {addOns.map((a) => {
              const on = addOnIds.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggle(addOnIds, setAddOnIds, a.id)}
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
                  <span className="text-text-subtle">+{a.minutes}m</span>
                </button>
              );
            })}
          </div>
          {addOnIds.map((id) => (
            <input key={id} type="hidden" name="addOns" value={id} />
          ))}
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Override time (minutes)"
            hint="Leave blank to use the estimate."
          >
            <Input
              name="overrideMinutes"
              type="number"
              min={0}
              value={override}
              onChange={(e) => setOverride(e.target.value)}
              placeholder={estimate ? String(estimate.onSiteMinutes) : ""}
            />
          </Field>
          <Field label="Price ($)">
            <Input
              name="price"
              type="number"
              step="0.01"
              min={0}
              defaultValue={
                job?.price != null
                  ? (job.price / 100).toFixed(2)
                  : (suggestedPrice / 100).toFixed(2)
              }
            />
          </Field>
        </div>

        <Field label="Repeats">
          <Select name="recurrence" defaultValue={job?.recurrence ?? "none"}>
            <option value="none">Doesn&rsquo;t repeat</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every two weeks</option>
            <option value="monthly">Monthly</option>
          </Select>
        </Field>

        <Field label="Notes for the client">
          <Textarea name="notes" rows={2} defaultValue={job?.notes ?? ""} />
        </Field>

        <Field label="Internal notes" hint="Never shown to the client.">
          <Textarea
            name="internalNotes"
            rows={2}
            defaultValue={job?.internalNotes ?? ""}
          />
        </Field>

        <div className="flex gap-3 pt-1">
          <Button type="submit" size="lg">
            {job ? "Save changes" : "Schedule job"}
          </Button>
        </div>
      </div>

      {/* ---------- Live estimate ---------- */}
      <aside className="xl:sticky xl:top-8 xl:self-start">
        <div className="overflow-hidden rounded-card border border-border-base bg-surface">
          <div className="bg-plum-800 p-6 text-cream-50">
            <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-[0.14em] text-plum-300">
              <Icon name="clock" className="size-3.5" />
              Estimated time
            </p>
            <p className="mt-1.5 font-display text-4xl font-semibold tabular">
              {override
                ? formatDuration(Number(override))
                : estimate
                  ? formatDuration(estimate.onSiteMinutes)
                  : "—"}
            </p>
            <p className="mt-1 text-xs text-plum-300">
              {estimate
                ? `${formatDuration(estimate.laborMinutes)} of labour across ${estimate.crewSize} ${estimate.crewSize === 1 ? "person" : "people"}`
                : "Pick a client and service"}
              {override && " · manual override"}
            </p>

            <div className="mt-5 border-t border-plum-600/50 pt-4">
              <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-plum-300">
                Suggested price
              </p>
              <p className="mt-1 font-display text-2xl font-semibold tabular">
                {money(suggestedPrice)}
              </p>
            </div>
          </div>

          {estimate && (
            <dl className="divide-y divide-[var(--border)] px-5 py-1 text-sm">
              {estimate.lines.map((line) => (
                <div
                  key={line.label}
                  className="flex items-center justify-between gap-4 py-2.5"
                >
                  <dt className="text-text-muted">{line.label}</dt>
                  <dd className="tabular font-medium text-text">
                    {line.multiplier
                      ? `×${line.multiplier}`
                      : `${line.minutes}m`}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {client && (
          <div className="mt-5 rounded-card border border-border-base bg-surface-2 p-5 text-sm">
            <p className="font-semibold text-text">{client.name}</p>
            <dl className="mt-3 space-y-1.5 text-text-muted">
              <div className="flex justify-between gap-3">
                <dt>Size</dt>
                <dd className="tabular text-text">
                  {client.squareFeet?.toLocaleString() ?? "—"} sq ft
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Rooms</dt>
                <dd className="tabular text-text">
                  {client.bedrooms ?? 0} bd · {client.bathrooms ?? 0} ba
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Condition</dt>
                <dd className="text-text">Level {client.conditionLevel}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Frequency</dt>
                <dd className="capitalize text-text">{client.frequency}</dd>
              </div>
            </dl>
            <p className="mt-3 border-t border-border-base pt-3 text-xs text-text-subtle">
              Estimates read from the client&rsquo;s property profile. Edit the
              client to change them.
            </p>
          </div>
        )}
      </aside>
    </form>
  );
}
