import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Panel, DetailRow, EmptyState, StatCard } from "@/components/crm/ui";
import { ClientForm } from "@/components/crm/ClientForm";
import { Badge, JOB_STATUS } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, Select, Textarea } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { prisma } from "@/lib/db";
import { addNote } from "@/app/crew/actions";
import { formatDuration, estimateAccuracy, CONDITION_LABELS } from "@/lib/estimate";
import { money, dateShort, relative, time } from "@/lib/format";
import { jobMinutes } from "@/lib/crm-data";

export const metadata = { title: "Client" };

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      jobs: {
        orderBy: { scheduledFor: "desc" },
        include: { service: true, assignments: { include: { user: true } } },
      },
      noteList: { include: { author: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!client) notFound();

  const completed = client.jobs.filter((j) => j.status === "completed");
  const upcoming = client.jobs.filter(
    (j) => j.status === "scheduled" && j.scheduledFor > new Date(),
  );

  const lifetime = completed.reduce((sum, j) => sum + (j.price ?? 0), 0);
  const totalMinutes = completed.reduce((sum, j) => sum + (j.actualMinutes ?? 0), 0);
  const totalMiles =
    Math.round(client.jobs.reduce((sum, j) => sum + j.travelMiles, 0) * 10) / 10;

  // Average estimate error for this client specifically — some homes
  // consistently take longer than the formula predicts.
  const accuracies = completed
    .map((j) => estimateAccuracy(j.estimatedMinutes, j.actualMinutes ?? 0))
    .filter((a): a is NonNullable<typeof a> => a !== null);
  const avgDelta =
    accuracies.length > 0
      ? Math.round(
          accuracies.reduce((s, a) => s + a.deltaPercent, 0) / accuracies.length,
        )
      : null;

  return (
    <>
      <PageHeader
        title={client.name}
        description={[client.company, client.city, client.propertyType]
          .filter(Boolean)
          .join(" · ")}
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/crew/clients"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text"
            >
              <Icon name="arrow" className="size-4 rotate-180" />
              Clients
            </Link>
            <ButtonLink href="/crew/schedule/new">
              <Icon name="plus" className="size-4" />
              Book a job
            </ButtonLink>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Lifetime value"
          value={money(lifetime)}
          sub={`${completed.length} completed jobs`}
          icon="chart"
          tone="success"
        />
        <StatCard
          label="Time on site"
          value={formatDuration(totalMinutes)}
          sub="across all visits"
          icon="clock"
        />
        <StatCard
          label="Miles driven"
          value={`${totalMiles}`}
          sub="to and from this property"
          icon="car"
          tone="neutral"
        />
        <StatCard
          label="Estimate accuracy"
          value={avgDelta === null ? "—" : `${avgDelta > 0 ? "+" : ""}${avgDelta}%`}
          sub={
            avgDelta === null
              ? "No completed jobs yet"
              : avgDelta > 10
                ? "Runs long — bump the condition level"
                : avgDelta < -10
                  ? "Finishes early — you may be over-quoting"
                  : "Estimates land well here"
          }
          icon="target"
          tone={
            avgDelta === null ? "neutral" : Math.abs(avgDelta) > 10 ? "warning" : "success"
          }
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-6">
          <Panel title="Property profile">
            <dl className="divide-y divide-[var(--border)] px-5 py-1">
              <DetailRow label="Type">
                <span className="capitalize">{client.propertyType}</span>
              </DetailRow>
              <DetailRow label="Size">
                {client.squareFeet
                  ? `${client.squareFeet.toLocaleString()} sq ft`
                  : "Not set"}
              </DetailRow>
              <DetailRow label="Rooms">
                {client.bedrooms ?? 0} bd · {client.bathrooms ?? 0} ba
              </DetailRow>
              <DetailRow label="Condition">
                {CONDITION_LABELS[client.conditionLevel]}
              </DetailRow>
              <DetailRow label="Frequency">
                <span className="capitalize">{client.frequency}</span>
              </DetailRow>
              <DetailRow label="Agreed rate">
                {client.rate ? money(client.rate) : "Per job"}
              </DetailRow>
              {client.phone && (
                <DetailRow label="Phone">
                  <a href={`tel:${client.phone}`} className="text-brand hover:underline">
                    {client.phone}
                  </a>
                </DetailRow>
              )}
              {client.email && (
                <DetailRow label="Email">
                  <a href={`mailto:${client.email}`} className="text-brand hover:underline">
                    {client.email}
                  </a>
                </DetailRow>
              )}
              {client.address && (
                <DetailRow label="Address">
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(
                      [client.address, client.city, client.state].filter(Boolean).join(", "),
                    )}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-brand hover:underline"
                  >
                    {client.address}
                  </a>
                </DetailRow>
              )}
              <DetailRow label="Coordinates">
                {client.lat != null && client.lng != null ? (
                  <span className="tabular text-xs">
                    {client.lat.toFixed(4)}, {client.lng.toFixed(4)}
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">
                    Missing — travel is estimated
                  </span>
                )}
              </DetailRow>
              {client.gateCode && (
                <DetailRow label="Access">
                  <span className="rounded bg-surface-2 px-2 py-0.5 font-mono text-xs">
                    {client.gateCode}
                  </span>
                </DetailRow>
              )}
            </dl>

            {client.notes && (
              <div className="border-t border-border-base bg-surface-2 px-5 py-4">
                <p className="text-2xs font-semibold uppercase tracking-wide text-text-subtle">
                  Crew notes
                </p>
                <p className="mt-2 text-sm leading-relaxed text-text">
                  {client.notes}
                </p>
              </div>
            )}
          </Panel>

          <Panel title="Activity">
            <div className="border-b border-border-base px-5 py-4">
              <form action={addNote} className="space-y-3">
                <input type="hidden" name="clientId" value={client.id} />
                <Field label="Log something">
                  <Textarea name="body" rows={2} required placeholder="Called about rescheduling…" />
                </Field>
                <div className="flex gap-2">
                  <Select name="kind" defaultValue="note" className="w-36">
                    <option value="note">Note</option>
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="text">Text</option>
                  </Select>
                  <Button type="submit" variant="secondary">
                    Add
                  </Button>
                </div>
              </form>
            </div>

            {client.noteList.length === 0 ? (
              <EmptyState icon="quote" title="Nothing logged" body="Notes you add here stay with the client." />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {client.noteList.map((note) => (
                  <li key={note.id} className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Badge tone="neutral">{note.kind}</Badge>
                      <span className="text-xs text-text-subtle">
                        {note.author?.name ?? "System"} · {relative(note.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-text">{note.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel
            title="Job history"
            description={`${upcoming.length} upcoming · ${completed.length} completed`}
          >
            {client.jobs.length === 0 ? (
              <EmptyState
                icon="calendar"
                title="No jobs yet"
                body="Book the first visit and it'll show up here."
                action={
                  <ButtonLink href="/crew/schedule/new" size="sm">
                    Book a job
                  </ButtonLink>
                }
              />
            ) : (
              <ul className="max-h-[32rem] divide-y divide-[var(--border)] overflow-y-auto scrollbar-slim">
                {client.jobs.map((job) => {
                  const status = JOB_STATUS[job.status] ?? JOB_STATUS.scheduled;
                  const acc = job.actualMinutes
                    ? estimateAccuracy(job.estimatedMinutes, job.actualMinutes)
                    : null;

                  return (
                    <li key={job.id}>
                      <Link
                        href={`/crew/schedule/${job.id}`}
                        className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-surface-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-text">
                              {job.service?.name ?? "Job"}
                            </p>
                            <Badge tone={status.tone}>{status.label}</Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-text-muted">
                            {dateShort(job.scheduledFor)} at {time(job.scheduledFor)}
                            {job.assignments.length > 0 &&
                              ` · ${job.assignments.map((a) => a.user.name).join(", ")}`}
                          </p>
                          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-text-subtle tabular">
                            <span>
                              {job.actualMinutes
                                ? `${formatDuration(job.actualMinutes)} actual`
                                : `${formatDuration(jobMinutes(job))} est`}
                            </span>
                            <span>{job.travelMinutes}m drive</span>
                            {acc && (
                              <span
                                className={
                                  acc.verdict === "on-target"
                                    ? "text-fern-600 dark:text-fern-400"
                                    : "text-amber-600 dark:text-amber-400"
                                }
                              >
                                {acc.deltaPercent > 0 ? "+" : ""}
                                {acc.deltaPercent}%
                              </span>
                            )}
                          </p>
                        </div>
                        <span className="shrink-0 text-right text-sm font-semibold tabular text-text">
                          {money(job.price)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <div>
            <h2 className="mb-4 font-display text-lg font-semibold text-text">
              Edit client
            </h2>
            <ClientForm client={client} />
          </div>
        </div>
      </div>
    </>
  );
}
