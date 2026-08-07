import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getService, getServices } from "@/lib/data";
import { money } from "@/lib/format";
import { formatDuration, estimateJob } from "@/lib/estimate";

export async function generateStaticParams() {
  const services = await getServices();
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) return { title: "Service not found" };
  return { title: service.name, description: service.blurb };
}

/** Three representative properties, so visitors can self-locate. */
const SAMPLE_PROPERTIES = [
  { label: "Small — 1 bed apartment", sqFt: 750, beds: 1, baths: 1 },
  { label: "Medium — 3 bed home", sqFt: 1800, beds: 3, baths: 2 },
  { label: "Large — 4 bed home", sqFt: 3000, beds: 4, baths: 3 },
];

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) notFound();

  const others = (await getServices()).filter((s) => s.slug !== slug).slice(0, 3);

  const samples = SAMPLE_PROPERTIES.map((p) => {
    const est = estimateJob({
      baseMinutes: service.baseMinutes,
      minutesPer1kSqFt: service.minutesPer1kSqFt,
      minutesPerBedroom: service.minutesPerBedroom,
      minutesPerBathroom: service.minutesPerBathroom,
      setupMinutes: service.setupMinutes,
      squareFeet: p.sqFt,
      bedrooms: p.beds,
      bathrooms: p.baths,
      conditionLevel: 3,
      frequency: "one-time",
      crewSize: 1,
    });
    return {
      ...p,
      minutes: est.laborMinutes,
      price: Math.round(((est.laborMinutes / 60) * service.hourlyRate) / 500) * 500,
    };
  });

  return (
    <>
      <section className="grain relative overflow-hidden border-b border-border-base bg-bloom">
        <span className="grain-layer" />
        <div className="container-page py-16 lg:py-20">
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted transition-colors hover:text-text"
          >
            <Icon name="arrow" className="size-4 rotate-180" />
            All services
          </Link>

          <div className="mt-6 flex items-start gap-5">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand text-on-brand shadow-e2">
              <Icon name={service.icon} className="size-6" />
            </span>
            <div>
              <h1 className="font-display text-headline font-semibold text-text">
                {service.name}
              </h1>
              <p className="mt-3 max-w-2xl text-lg leading-relaxed text-text-muted">
                {service.blurb}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-14 py-16 lg:grid-cols-[1.4fr_1fr] lg:py-20">
        <div>
          <p className="text-lg leading-relaxed text-text">
            {service.description}
          </p>

          <h2 className="mt-12 font-display text-2xl font-semibold text-text">
            What&rsquo;s included
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {service.features.map((f) => (
              <li
                key={f}
                className="flex items-start gap-3 rounded-field border border-border-base bg-surface p-4 text-sm text-text"
              >
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-fern-100 text-fern-700 dark:bg-fern-900 dark:text-fern-300">
                  <Icon name="check" className="size-3" />
                </span>
                {f}
              </li>
            ))}
          </ul>

          {/* ---------- Estimated time, per property size ---------- */}
          <h2 className="mt-12 font-display text-2xl font-semibold text-text">
            How long it takes
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            Typical times for a property in normal condition, with one cleaner.
            Two cleaners cut the on-site time roughly in half.
          </p>

          <div className="mt-6 overflow-hidden rounded-card border border-border-base">
            <table className="w-full text-sm">
              <thead className="bg-surface-2">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-subtle">
                    Property
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-text-subtle">
                    Time
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-text-subtle">
                    Typical price
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-surface">
                {samples.map((s) => (
                  <tr key={s.label}>
                    <td className="px-4 py-3.5 text-text">{s.label}</td>
                    <td className="px-4 py-3.5 text-right tabular font-medium text-text">
                      {formatDuration(s.minutes)}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular font-semibold text-text">
                      {money(s.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-text-subtle">
            Estimates, not quotes. Condition, clutter, and access all move the
            number — we confirm after a free walkthrough.
          </p>
        </div>

        {/* ---------- Sidebar ---------- */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-card border border-border-base bg-surface p-7 shadow-e2">
            <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-brand">
              Starting at
            </p>
            <p className="mt-2 font-display text-4xl font-semibold text-text">
              {service.priceFrom ? money(service.priceFrom) : "Quoted"}
              {service.priceFrom && (
                <span className="text-lg font-normal text-text-subtle">
                  /{service.priceUnit}
                </span>
              )}
            </p>

            <dl className="mt-6 space-y-3 border-t border-border-base pt-6 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Base time</dt>
                <dd className="tabular font-medium text-text">
                  {formatDuration(service.baseMinutes)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Per 1,000 sq ft</dt>
                <dd className="tabular font-medium text-text">
                  +{formatDuration(service.minutesPer1kSqFt)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Hourly rate</dt>
                <dd className="tabular font-medium text-text">
                  {money(service.hourlyRate)}/hr
                </dd>
              </div>
            </dl>

            <ButtonLink
              href={`/contact?service=${service.slug}`}
              size="lg"
              className="mt-7 w-full"
            >
              Get a free quote
            </ButtonLink>
          </div>

          <div className="mt-6 rounded-card border border-border-base bg-surface-2 p-6">
            <h2 className="text-sm font-semibold text-text">Also popular</h2>
            <ul className="mt-3 space-y-1">
              {others.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/services/${o.slug}`}
                    className="flex items-center justify-between gap-3 rounded-field px-3 py-2.5 text-sm text-text-muted transition-colors hover:bg-surface hover:text-text"
                  >
                    {o.name}
                    <Icon name="chevron" className="size-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
