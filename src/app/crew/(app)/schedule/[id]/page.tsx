import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Panel, DetailRow } from "@/components/crm/ui";
import { JobForm } from "@/components/crm/JobForm";
import { Badge, JOB_STATUS } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { prisma } from "@/lib/db";
import { toggleJobClock, deleteJob } from "@/app/crew/actions";
import { formatDuration, estimateAccuracy } from "@/lib/estimate";
import { formatMiles } from "@/lib/travel";
import { money, dateLong, time, dateInput, addMinutes } from "@/lib/format";
import { jobMinutes } from "@/lib/crm-data";

export const metadata = { title: "Job" };

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [job, clients, services, addOns, crew] = await Promise.all([
    prisma.job.findUnique({
      where: { id },
      include: {
        client: true,
        service: true,
        assignments: { include: { user: true } },
        addOns: { include: { addOn: true } },
      },
    }),
    prisma.client.findMany({ where: { status: "active" }, orderBy: { name: "asc" } }),
    prisma.service.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.addOn.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.user.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  if (!job) notFound();

  const status = JOB_STATUS[job.status] ?? JOB_STATUS.scheduled;
  const minutes = jobMinutes(job);
  const accuracy = job.actualMinutes
    ? estimateAccuracy(job.estimatedMinutes, job.actualMinutes)
    : null;

  // The breakdown is stored as JSON so history survives formula edits.
  let breakdown: Array<{ label: string; minutes: number; multiplier?: number }> = [];
  try {
    const parsed = JSON.parse(job.estimateBreakdown);
    if (Array.isArray(parsed)) breakdown = parsed;
  } catch {
    breakdown = [];
  }

  const profit =
    (job.price ?? 0) - job.laborCost - (job.travelBillable ? 0 : job.travelCost);

  return (
    <>
      <PageHeader
        title={job.client.name}
        description={`${job.service?.name ?? "Job"} · ${dateLong(job.scheduledFor)} at ${time(job.scheduledFor)}`}
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/crew/schedule"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text"
            >
              <Icon name="arrow" className="size-4 rotate-180" />
              Schedule
            </Link>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* ---------- Clock ---------- */}
        <div className="rounded-card border border-border-base bg-surface p-5">
          <div className="flex items-center justify-between">
            <Badge tone={status.tone}>{status.label}</Badge>
            {job.startedAt && !job.completedAt && (
              <span className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />
                Running
              </span>
            )}
          </div>

          <p className="mt-4 font-display text-2xl font-semibold tabular text-text">
            {job.actualMinutes
              ? formatDuration(job.actualMinutes)
              : formatDuration(minutes)}
          </p>
          <p className="text-xs text-text-muted">
            {job.actualMinutes ? "actual time" : "estimated time"}
          </p>

          {job.status !== "cancelled" && (
            <form action={toggleJobClock} className="mt-4">
              <input type="hidden" name="id" value={job.id} />
              <Button
                type="submit"
                size="sm"
                variant={job.startedAt && !job.completedAt ? "secondary" : "primary"}
                className="w-full"
                disabled={!!job.completedAt}
              >
                {job.completedAt ? (
                  <>
                    <Icon name="check" className="size-4" />
                    Done
                  </>
                ) : job.startedAt ? (
                  <>
                    <Icon name="pause" className="size-4" />
                    Clock out
                  </>
                ) : (
                  <>
                    <Icon name="play" className="size-4" />
                    Clock in
                  </>
                )}
              </Button>
            </form>
          )}
        </div>

        {/* ---------- Estimate vs actual ---------- */}
        <div className="rounded-card border border-border-base bg-surface p-5">
          <span className="grid size-9 place-items-center rounded-xl bg-plum-100 text-plum-800 dark:bg-plum-950 dark:text-plum-300">
            <Icon name="target" className="size-4" />
          </span>
          <p className="mt-4 font-display text-2xl font-semibold tabular text-text">
            {accuracy ? (
              <>
                {accuracy.deltaPercent > 0 ? "+" : ""}
                {accuracy.deltaPercent}%
              </>
            ) : (
              "—"
            )}
          </p>
          <p className="text-xs text-text-muted">
            {accuracy
              ? accuracy.verdict === "on-target"
                ? "Estimate was on target"
                : accuracy.verdict === "over"
                  ? `Ran ${formatDuration(Math.abs(accuracy.deltaMinutes))} long`
                  : `Finished ${formatDuration(Math.abs(accuracy.deltaMinutes))} early`
              : "Accuracy shows after clock-out"}
          </p>
        </div>

        {/* ---------- Travel ---------- */}
        <div className="rounded-card border border-border-base bg-surface p-5">
          <span className="grid size-9 place-items-center rounded-xl bg-plum-100 text-plum-800 dark:bg-plum-950 dark:text-plum-300">
            <Icon name="car" className="size-4" />
          </span>
          <p className="mt-4 font-display text-2xl font-semibold tabular text-text">
            {formatDuration(job.travelMinutes)}
          </p>
          <p className="text-xs text-text-muted">
            {formatMiles(job.travelMiles)} from {job.travelFromLabel}
          </p>
          <p className="mt-1 text-xs font-medium text-text-subtle tabular">
            {money(job.travelCost)} mileage
          </p>
        </div>

        {/* ---------- Money ---------- */}
        <div className="rounded-card border border-border-base bg-surface p-5">
          <span className="grid size-9 place-items-center rounded-xl bg-fern-100 text-fern-700 dark:bg-fern-900 dark:text-fern-300">
            <Icon name="chart" className="size-4" />
          </span>
          <p className="mt-4 font-display text-2xl font-semibold tabular text-text">
            {money(job.price)}
          </p>
          <p className="text-xs text-text-muted">
            {job.laborCost > 0
              ? `${money(profit)} after labour & travel`
              : "price for this visit"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        {/* ---------- Summary ---------- */}
        <div className="flex flex-col gap-6">
          <Panel title="Job details">
            <dl className="divide-y divide-[var(--border)] px-5 py-1">
              <DetailRow label="Client">
                <Link
                  href={`/crew/clients/${job.clientId}`}
                  className="text-brand hover:underline"
                >
                  {job.client.name}
                </Link>
              </DetailRow>
              <DetailRow label="Address">
                {job.client.address ? (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(
                      [job.client.address, job.client.city, job.client.state]
                        .filter(Boolean)
                        .join(", "),
                    )}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-brand hover:underline"
                  >
                    {job.client.address}, {job.client.city}
                  </a>
                ) : (
                  <span className="text-text-subtle">Not set</span>
                )}
              </DetailRow>
              <DetailRow label="Phone">
                {job.client.phone ? (
                  <a href={`tel:${job.client.phone}`} className="text-brand hover:underline">
                    {job.client.phone}
                  </a>
                ) : (
                  <span className="text-text-subtle">—</span>
                )}
              </DetailRow>
              <DetailRow label="Window">
                {time(job.scheduledFor)} – {time(addMinutes(job.scheduledFor, minutes))}
              </DetailRow>
              <DetailRow label="Crew">
                {job.assignments.length > 0 ? (
                  <span className="inline-flex flex-wrap justify-end gap-1.5">
                    {job.assignments.map((a) => (
                      <span
                        key={a.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2 py-0.5 text-xs"
                      >
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: a.user.color }}
                        />
                        {a.user.name}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="text-text-subtle">Unassigned</span>
                )}
              </DetailRow>
              {job.client.gateCode && (
                <DetailRow label="Access">
                  <span className="rounded bg-surface-2 px-2 py-0.5 font-mono text-xs">
                    {job.client.gateCode}
                  </span>
                </DetailRow>
              )}
              {job.addOns.length > 0 && (
                <DetailRow label="Add-ons">
                  <span className="text-right">
                    {job.addOns.map((a) => a.addOn.name).join(", ")}
                  </span>
                </DetailRow>
              )}
            </dl>

            {(job.notes || job.internalNotes || job.client.notes) && (
              <div className="space-y-3 border-t border-border-base bg-surface-2 px-5 py-4 text-sm">
                {job.client.notes && (
                  <p className="text-text-muted">
                    <span className="font-semibold text-text">Client note: </span>
                    {job.client.notes}
                  </p>
                )}
                {job.notes && (
                  <p className="text-text-muted">
                    <span className="font-semibold text-text">Job note: </span>
                    {job.notes}
                  </p>
                )}
                {job.internalNotes && (
                  <p className="text-text-muted">
                    <span className="font-semibold text-text">Internal: </span>
                    {job.internalNotes}
                  </p>
                )}
              </div>
            )}
          </Panel>

          {/* ---------- Estimate breakdown ---------- */}
          <Panel
            title="How the estimate was built"
            description="Captured when the job was saved."
          >
            {breakdown.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-text-subtle">
                No breakdown recorded for this job.
              </p>
            ) : (
              <dl className="divide-y divide-[var(--border)] px-5 py-1 text-sm">
                {breakdown.map((line, i) => (
                  <div
                    key={`${line.label}-${i}`}
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
                <div className="flex items-center justify-between gap-4 py-3 font-semibold">
                  <dt className="text-text">Estimated on site</dt>
                  <dd className="tabular text-text">
                    {formatDuration(job.estimatedMinutes)}
                  </dd>
                </div>
                {job.overrideMinutes && (
                  <div className="flex items-center justify-between gap-4 py-3 text-brand">
                    <dt className="font-semibold">Manual override</dt>
                    <dd className="tabular font-semibold">
                      {formatDuration(job.overrideMinutes)}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </Panel>

          <form action={deleteJob}>
            <input type="hidden" name="id" value={job.id} />
            <Button type="submit" variant="ghost" size="sm" className="text-red-600 dark:text-red-400">
              <Icon name="trash" className="size-4" />
              Delete this job
            </Button>
          </form>
        </div>

        {/* ---------- Editor ---------- */}
        <div>
          <h2 className="mb-4 font-display text-lg font-semibold text-text">
            Edit job
          </h2>
          <JobForm
            clients={clients}
            services={services}
            addOns={addOns}
            crew={crew}
            defaultDate={dateInput(job.scheduledFor)}
            job={{
              id: job.id,
              clientId: job.clientId,
              serviceId: job.serviceId,
              scheduledFor: dateInput(job.scheduledFor),
              status: job.status,
              overrideMinutes: job.overrideMinutes,
              price: job.price,
              notes: job.notes,
              internalNotes: job.internalNotes,
              recurrence: job.recurrence,
              crewIds: job.assignments.map((a) => a.userId),
              addOnIds: job.addOns.map((a) => a.addOnId),
            }}
          />
        </div>
      </div>
    </>
  );
}
