import { PageHeader, Panel, StatCard, EmptyState, TableWrap, Th, Td } from "@/components/crm/ui";
import { Badge } from "@/components/ui/Badge";
import { prisma } from "@/lib/db";
import { formatDuration, estimateAccuracy } from "@/lib/estimate";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);

  const [monthJobs, recentJobs, services, clients] = await Promise.all([
    prisma.job.findMany({
      where: { scheduledFor: { gte: monthStart }, status: { not: "cancelled" } },
      select: { price: true, travelCost: true, laborCost: true, actualMinutes: true, travelMinutes: true },
    }),
    prisma.job.findMany({
      where: {
        status: "completed",
        actualMinutes: { not: null },
        scheduledFor: { gte: ninetyDaysAgo },
      },
      include: { service: true },
    }),
    prisma.service.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.client.count({ where: { status: "active" } }),
  ]);

  const revenue = monthJobs.reduce((s, j) => s + (j.price ?? 0), 0);
  const labor = monthJobs.reduce((s, j) => s + j.laborCost, 0);
  const travelCost = monthJobs.reduce((s, j) => s + j.travelCost, 0);
  const onSite = monthJobs.reduce((s, j) => s + (j.actualMinutes ?? 0), 0);
  const driving = monthJobs.reduce((s, j) => s + j.travelMinutes, 0);
  const profit = revenue - labor - travelCost;

  /** Per-service accuracy — where the formulas need tuning. */
  const byService = services
    .map((service) => {
      const jobs = recentJobs.filter((j) => j.serviceId === service.id);
      if (jobs.length === 0) return null;

      const deltas = jobs
        .map((j) => estimateAccuracy(j.estimatedMinutes, j.actualMinutes ?? 0))
        .filter((a): a is NonNullable<typeof a> => a !== null);

      const avgDelta = Math.round(
        deltas.reduce((s, d) => s + d.deltaPercent, 0) / deltas.length,
      );
      const avgActual = Math.round(
        jobs.reduce((s, j) => s + (j.actualMinutes ?? 0), 0) / jobs.length,
      );
      const avgPrice = Math.round(
        jobs.reduce((s, j) => s + (j.price ?? 0), 0) / jobs.length,
      );

      return {
        service,
        count: jobs.length,
        avgDelta,
        avgActual,
        avgPrice,
        hourly: avgActual > 0 ? Math.round((avgPrice / avgActual) * 60) : 0,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  return (
    <>
      <PageHeader
        title="Reports"
        description={`${now.toLocaleDateString("en-US", { month: "long", year: "numeric" })} to date`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue this month"
          value={money(revenue)}
          sub={`${monthJobs.length} jobs · ${clients} active clients`}
          icon="chart"
          tone="success"
        />
        <StatCard
          label="Profit after costs"
          value={money(profit)}
          sub={
            revenue > 0
              ? `${Math.round((profit / revenue) * 100)}% margin`
              : "No revenue yet"
          }
          icon="target"
          tone={profit > 0 ? "success" : "warning"}
        />
        <StatCard
          label="Time on site"
          value={formatDuration(onSite)}
          sub={`plus ${formatDuration(driving)} driving`}
          icon="clock"
        />
        <StatCard
          label="Travel cost"
          value={money(travelCost)}
          sub={
            onSite + driving > 0
              ? `${Math.round((driving / (onSite + driving)) * 100)}% of hours are drive time`
              : "—"
          }
          icon="car"
          tone="neutral"
        />
      </div>

      <div className="mt-8">
        <Panel
          title="Estimate accuracy by service"
          description="Last 90 days of completed work. This is where you tune the time formulas."
        >
          {byService.length === 0 ? (
            <EmptyState
              icon="target"
              title="Not enough completed jobs"
              body="Clock in and out of a few jobs and this fills in automatically."
            />
          ) : (
            <TableWrap>
              <thead className="bg-surface-2">
                <tr>
                  <Th>Service</Th>
                  <Th className="text-right">Jobs</Th>
                  <Th className="text-right">Avg actual</Th>
                  <Th className="text-right">Accuracy</Th>
                  <Th className="text-right">Avg price</Th>
                  <Th className="text-right">Effective /hr</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {byService.map((row) => (
                  <tr key={row.service.id} className="hover:bg-surface-2">
                    <Td>
                      <span className="font-medium text-text">
                        {row.service.name}
                      </span>
                      <span className="block text-xs text-text-subtle">
                        base {row.service.baseMinutes}m ·{" "}
                        {row.service.minutesPer1kSqFt}m/1k sq ft
                      </span>
                    </Td>
                    <Td className="text-right tabular text-text-muted">
                      {row.count}
                    </Td>
                    <Td className="text-right tabular text-text">
                      {formatDuration(row.avgActual)}
                    </Td>
                    <Td className="text-right">
                      <Badge
                        tone={
                          Math.abs(row.avgDelta) <= 10
                            ? "success"
                            : row.avgDelta > 0
                              ? "warning"
                              : "info"
                        }
                      >
                        {row.avgDelta > 0 ? "+" : ""}
                        {row.avgDelta}%
                      </Badge>
                    </Td>
                    <Td className="text-right tabular text-text">
                      {money(row.avgPrice)}
                    </Td>
                    <Td
                      className={cn(
                        "text-right tabular font-semibold",
                        row.hourly >= 6000
                          ? "text-fern-700 dark:text-fern-400"
                          : "text-amber-700 dark:text-amber-400",
                      )}
                    >
                      {money(row.hourly)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}

          {byService.some((r) => Math.abs(r.avgDelta) > 10) && (
            <div className="border-t border-border-base bg-surface-2 px-5 py-4 text-sm text-text-muted">
              <p className="font-medium text-text">Suggested adjustments</p>
              <ul className="mt-2 space-y-1.5">
                {byService
                  .filter((r) => Math.abs(r.avgDelta) > 10)
                  .map((r) => (
                    <li key={r.service.id}>
                      <span className="font-medium text-text">
                        {r.service.name}
                      </span>{" "}
                      runs {r.avgDelta > 0 ? "long" : "short"} by {Math.abs(r.avgDelta)}
                      % — try setting base time to{" "}
                      <span className="font-semibold text-text tabular">
                        {Math.round(r.service.baseMinutes * (1 + r.avgDelta / 100))}m
                      </span>{" "}
                      in Services.
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
