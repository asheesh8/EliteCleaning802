import Link from "next/link";
import { PageHeader, Panel, EmptyState, StatCard } from "@/components/crm/ui";
import { RouteTimeline } from "@/components/crm/RouteTimeline";
import { Icon } from "@/components/ui/Icon";
import { ButtonLink } from "@/components/ui/Button";
import { getDayRoute, weekBounds, getJobsBetween, jobMinutes } from "@/lib/crm-data";
import { optimiseOrder, buildRoute, type Waypoint } from "@/lib/travel";
import { formatDuration } from "@/lib/estimate";
import { money, dateShort } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Travel & route" };

export default async function TravelPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const { day } = await searchParams;
  const offset = Number(day ?? 0) || 0;

  const date = new Date();
  date.setDate(date.getDate() + offset);

  const { jobs, route, travel, hq } = await getDayRoute(date);

  // What the same stops would cost if driven in the nearest-neighbour
  // order instead of the booked order.
  const optimised = optimiseOrder(
    hq,
    jobs.map((job) => ({
      waypoint: {
        id: job.id,
        label: job.client.name,
        lat: job.client.lat,
        lng: job.client.lng,
      } as Waypoint,
      onSiteMinutes: jobMinutes(job),
    })),
    travel,
  );

  const optimisedRoute = buildRoute(hq, optimised, travel, {
    returnToHq: travel.returnToHq,
  });

  const savedMinutes =
    route.totalTravelMinutes - optimisedRoute.totalTravelMinutes;
  const savedMiles =
    Math.round((route.totalTravelMiles - optimisedRoute.totalTravelMiles) * 10) / 10;

  // Week-level mileage, for reimbursement and tax records.
  const { start: weekStart, end: weekEnd } = weekBounds(new Date());
  const weekJobs = await getJobsBetween(weekStart, weekEnd);
  const weekActive = weekJobs.filter((j) => j.status !== "cancelled");
  const weekMiles =
    Math.round(weekActive.reduce((sum, j) => sum + j.travelMiles, 0) * 10) / 10;
  const weekTravelMinutes = weekActive.reduce((sum, j) => sum + j.travelMinutes, 0);
  const weekMileageCost = weekActive.reduce((sum, j) => sum + j.travelCost, 0);

  return (
    <>
      <PageHeader
        title="Travel & route"
        description={date.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
        action={
          <div className="flex items-center gap-2">
            <Link
              href={`/crew/travel?day=${offset - 1}`}
              aria-label="Previous day"
              className="grid size-10 place-items-center rounded-field border border-border-strong bg-surface text-text-muted transition-colors hover:bg-surface-2"
            >
              <Icon name="chevron" className="size-4 rotate-180" />
            </Link>
            <Link
              href="/crew/travel"
              className={cn(
                "grid h-10 place-items-center rounded-field border border-border-strong bg-surface px-4 text-sm font-medium text-text-muted transition-colors hover:bg-surface-2",
                offset === 0 && "border-brand text-brand",
              )}
            >
              Today
            </Link>
            <Link
              href={`/crew/travel?day=${offset + 1}`}
              aria-label="Next day"
              className="grid size-10 place-items-center rounded-field border border-border-strong bg-surface text-text-muted transition-colors hover:bg-surface-2"
            >
              <Icon name="chevron" className="size-4" />
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Drive time"
          value={formatDuration(route.totalTravelMinutes)}
          sub={`${route.travelSharePercent}% of the working day`}
          icon="car"
          tone={route.travelSharePercent > 30 ? "warning" : "brand"}
        />
        <StatCard
          label="Miles today"
          value={route.totalTravelMiles}
          sub={`${money(route.totalTravelCost)} at ${travel.centsPerMile}¢/mi`}
          icon="route"
        />
        <StatCard
          label="Door to door"
          value={formatDuration(route.totalDayMinutes)}
          sub={`${formatDuration(route.totalOnSiteMinutes)} of it cleaning`}
          icon="clock"
          tone="neutral"
        />
        <StatCard
          label="This week"
          value={`${weekMiles} mi`}
          sub={`${formatDuration(weekTravelMinutes)} · ${money(weekMileageCost)}`}
          icon="chart"
          tone="success"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel
          title="Route as booked"
          description={`Starting and ending at ${travel.hqLabel}.`}
        >
          {jobs.length === 0 ? (
            <EmptyState
              icon="route"
              title="No stops today"
              body="Schedule some work and the route builds itself."
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
          {/* ---------- Optimiser ---------- */}
          <Panel
            title="Suggested order"
            description="Nearest-stop-first, ignoring time windows."
          >
            {jobs.length < 2 ? (
              <EmptyState
                icon="target"
                title="Not enough stops"
                body="Route suggestions need at least two jobs in a day."
              />
            ) : savedMinutes <= 2 ? (
              <div className="px-5 py-10 text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-fern-100 text-fern-700 dark:bg-fern-900 dark:text-fern-300">
                  <Icon name="check" className="size-5" />
                </span>
                <p className="mt-4 font-medium text-text">
                  Your order is already efficient
                </p>
                <p className="mx-auto mt-1.5 max-w-xs text-sm text-text-muted">
                  Reordering these stops wouldn&rsquo;t save meaningful drive
                  time.
                </p>
              </div>
            ) : (
              <div className="px-5 py-5">
                <div className="rounded-field bg-fern-50 px-4 py-3.5 dark:bg-fern-900/40">
                  <p className="font-display text-xl font-semibold tabular text-fern-800 dark:text-fern-300">
                    Save {formatDuration(savedMinutes)}
                  </p>
                  <p className="mt-0.5 text-xs text-fern-700 dark:text-fern-400">
                    {savedMiles} fewer miles ·{" "}
                    {money(route.totalTravelCost - optimisedRoute.totalTravelCost)}{" "}
                    less mileage
                  </p>
                </div>

                <ol className="mt-5 space-y-2.5">
                  {optimisedRoute.stops.map((stop, i) => (
                    <li key={stop.waypoint.id} className="flex items-center gap-3">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-2xs font-semibold text-text-muted ring-1 ring-border-base">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-text">
                        {stop.waypoint.label}
                      </span>
                      <span className="shrink-0 text-xs tabular text-text-subtle">
                        {stop.legIn.minutes}m
                      </span>
                    </li>
                  ))}
                </ol>

                <p className="mt-4 flex items-start gap-2 text-xs text-text-subtle">
                  <Icon name="bolt" className="mt-px size-3.5 shrink-0" />
                  <span>
                    A suggestion only — it ignores client time windows. Reorder
                    jobs by editing their start times.
                  </span>
                </p>
              </div>
            )}
          </Panel>

          {/* ---------- Mileage log ---------- */}
          <Panel
            title="Mileage log"
            description="This week, for reimbursement and tax records."
          >
            {weekActive.length === 0 ? (
              <EmptyState
                icon="car"
                title="No miles logged"
                body="Mileage accumulates as jobs are scheduled."
              />
            ) : (
              <>
                <ul className="max-h-80 divide-y divide-[var(--border)] overflow-y-auto scrollbar-slim">
                  {weekActive.map((job) => (
                    <li
                      key={job.id}
                      className="flex items-center justify-between gap-3 px-5 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm text-text">
                          {job.client.name}
                        </p>
                        <p className="text-xs text-text-subtle">
                          {dateShort(job.scheduledFor)} · from{" "}
                          {job.travelFromLabel}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-medium tabular text-text">
                          {job.travelMiles} mi
                        </p>
                        <p className="text-xs tabular text-text-subtle">
                          {money(job.travelCost)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between border-t border-border-base bg-surface-2 px-5 py-3.5">
                  <span className="text-sm font-semibold text-text">
                    Week total
                  </span>
                  <span className="font-display text-lg font-semibold tabular text-text">
                    {money(weekMileageCost)}
                  </span>
                </div>
              </>
            )}
          </Panel>

          <p className="text-xs leading-relaxed text-text-subtle">
            Distances are computed from client coordinates using a{" "}
            {travel.roadFactor}× road factor at {travel.avgMph} mph, plus a{" "}
            {travel.bufferMinutes}-minute per-stop buffer. Adjust these in{" "}
            <Link href="/crew/settings" className="text-brand hover:underline">
              Settings
            </Link>
            . Clients without coordinates fall back to a conservative default.
          </p>
        </div>
      </div>
    </>
  );
}
