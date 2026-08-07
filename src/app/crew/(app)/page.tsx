import Link from "next/link";
import { PageHeader, Panel, StatCard, EmptyState } from "@/components/crm/ui";
import { RouteTimeline } from "@/components/crm/RouteTimeline";
import { Badge, LEAD_STATUS } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDayRoute, weekBounds } from "@/lib/crm-data";
import { formatDuration, estimateAccuracy } from "@/lib/estimate";
import { money, relative, dateShort } from "@/lib/format";

export default async function DashboardPage() {
  const user = await requireUser();
  const today = new Date();
  const { start: weekStart, end: weekEnd } = weekBounds(today);

  const [{ jobs, route, travel }, newLeads, weekJobs, recentDone, openInvoices] =
    await Promise.all([
      getDayRoute(today),
      prisma.lead.findMany({
        where: { status: { in: ["new", "contacted"] } },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        take: 5,
        include: { service: true },
      }),
      prisma.job.findMany({
        where: { scheduledFor: { gte: weekStart, lte: weekEnd } },
        select: { price: true, status: true, travelCost: true },
      }),
      prisma.job.findMany({
        where: { status: "completed", actualMinutes: { not: null } },
        orderBy: { completedAt: "desc" },
        take: 6,
        include: { client: true },
      }),
      prisma.invoice.findMany({
        where: { status: { in: ["sent", "overdue"] } },
        select: { total: true },
      }),
    ]);

  const weekRevenue = weekJobs
    .filter((j) => j.status !== "cancelled")
    .reduce((sum, j) => sum + (j.price ?? 0), 0);

  const outstanding = openInvoices.reduce((sum, i) => sum + i.total, 0);

  // Estimate accuracy across recent completed work — the number that
  // tells the owners whether their formulas are honest.
  const accuracies = recentDone
    .map((j) => estimateAccuracy(j.estimatedMinutes, j.actualMinutes ?? 0))
    .filter((a): a is NonNullable<typeof a> => a !== null);

  const avgDelta =
    accuracies.length > 0
      ? Math.round(
          accuracies.reduce((sum, a) => sum + a.deltaPercent, 0) /
            accuracies.length,
        )
      : null;

  const hour = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <PageHeader
        title={`${greeting}, ${user.name}`}
        description={today.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
        action={
          <ButtonLink href="/crew/schedule/new">
            <Icon name="plus" className="size-4" />
            New job
          </ButtonLink>
        }
      />

      {/* ---------- Stats ---------- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Jobs today"
          value={jobs.length}
          sub={
            jobs.length > 0
              ? `${formatDuration(route.totalOnSiteMinutes)} on site`
              : "Nothing scheduled"
          }
          icon="calendar"
          href="/crew/schedule"
        />
        <StatCard
          label="Drive time today"
          value={formatDuration(route.totalTravelMinutes)}
          sub={`${route.totalTravelMiles} mi · ${money(route.totalTravelCost)}`}
          icon="car"
          tone={route.travelSharePercent > 30 ? "warning" : "neutral"}
          href="/crew/travel"
        />
        <StatCard
          label="Booked this week"
          value={money(weekRevenue)}
          sub={`${weekJobs.length} jobs`}
          icon="chart"
          tone="success"
          href="/crew/reports"
        />
        <StatCard
          label="New leads"
          value={newLeads.filter((l) => l.status === "new").length}
          sub={outstanding > 0 ? `${money(outstanding)} unpaid` : "All invoices settled"}
          icon="quote"
          tone={newLeads.length > 0 ? "warning" : "neutral"}
          href="/crew/leads"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* ---------- Today's route ---------- */}
        <Panel
          title="Today's route"
          description={
            jobs.length > 0
              ? `${formatDuration(route.totalDayMinutes)} door to door · ${route.travelSharePercent}% of it driving`
              : undefined
          }
          action={
            <Link
              href="/crew/travel"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
            >
              Plan route
              <Icon name="arrow" className="size-4" />
            </Link>
          }
        >
          {jobs.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="Nothing on today"
              body="A clear day. Schedule a job or work through the lead pipeline."
              action={
                <ButtonLink href="/crew/schedule/new" size="sm">
                  Schedule a job
                </ButtonLink>
              }
            />
          ) : (
            <RouteTimeline jobs={jobs} route={route} hqLabel={travel.hqLabel} />
          )}
        </Panel>

        <div className="flex flex-col gap-6">
          {/* ---------- Leads ---------- */}
          <Panel
            title="Needs a reply"
            action={
              <Link
                href="/crew/leads"
                className="text-sm font-semibold text-brand hover:underline"
              >
                All leads
              </Link>
            }
          >
            {newLeads.length === 0 ? (
              <EmptyState
                icon="check"
                title="Inbox clear"
                body="Every lead has been contacted. Nice."
              />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {newLeads.map((lead) => {
                  const status = LEAD_STATUS[lead.status];
                  return (
                    <li key={lead.id}>
                      <Link
                        href={`/crew/leads/${lead.id}`}
                        className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-surface-2"
                      >
                        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-plum-100 text-2xs font-semibold text-plum-800 dark:bg-plum-950 dark:text-plum-300">
                          {lead.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium text-text">
                              {lead.name}
                            </p>
                            {lead.priority === "high" && (
                              <Icon
                                name="bolt"
                                className="size-3.5 shrink-0 text-amber-500"
                              />
                            )}
                          </div>
                          <p className="truncate text-xs text-text-muted">
                            {lead.service?.name ?? "Not sure yet"} ·{" "}
                            {relative(lead.createdAt)}
                          </p>
                          {lead.estimatedPrice && (
                            <p className="mt-1 text-xs font-medium text-text-subtle tabular">
                              Est. {money(lead.estimatedPrice)} ·{" "}
                              {formatDuration(lead.estimatedMinutes ?? 0)}
                            </p>
                          )}
                        </div>
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          {/* ---------- Estimate accuracy ---------- */}
          <Panel
            title="Estimate accuracy"
            description="Recent completed jobs, estimated vs actual."
          >
            {accuracies.length === 0 ? (
              <EmptyState
                icon="clock"
                title="No completed jobs yet"
                body="Once you clock out of a few jobs, accuracy shows up here."
              />
            ) : (
              <>
                <div className="border-b border-border-base px-5 py-4">
                  <p className="font-display text-2xl font-semibold tabular text-text">
                    {avgDelta! > 0 ? "+" : ""}
                    {avgDelta}%
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {avgDelta! > 10
                      ? "Jobs are running long — consider raising your base times."
                      : avgDelta! < -10
                        ? "You're beating estimates — you may be quoting high."
                        : "Estimates are landing well."}
                  </p>
                </div>
                <ul className="divide-y divide-[var(--border)]">
                  {recentDone.slice(0, 5).map((job) => {
                    const acc = estimateAccuracy(
                      job.estimatedMinutes,
                      job.actualMinutes ?? 0,
                    );
                    if (!acc) return null;
                    return (
                      <li
                        key={job.id}
                        className="flex items-center justify-between gap-3 px-5 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm text-text">
                            {job.client.name}
                          </p>
                          <p className="text-xs text-text-subtle">
                            {dateShort(job.scheduledFor)} ·{" "}
                            {formatDuration(job.estimatedMinutes)} est
                          </p>
                        </div>
                        <Badge
                          tone={
                            acc.verdict === "on-target"
                              ? "success"
                              : acc.verdict === "over"
                                ? "warning"
                                : "info"
                          }
                        >
                          {acc.deltaPercent > 0 ? "+" : ""}
                          {acc.deltaPercent}%
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
