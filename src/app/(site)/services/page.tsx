import type { Metadata } from "next";
import { ServiceCard } from "@/components/site/ServiceCard";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getServices, getAddOns } from "@/lib/data";
import { money } from "@/lib/format";
import { formatDuration } from "@/lib/estimate";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Recurring home cleaning, deep cleans, Airbnb turnovers, office cleaning, post-construction, and move-out cleans across Rutland County, Vermont.",
};

const CATEGORY_LABELS: Record<string, string> = {
  residential: "Homes",
  turnover: "Rentals & turnovers",
  commercial: "Business",
  specialty: "Specialty",
};

export default async function ServicesPage() {
  const [services, addOns] = await Promise.all([getServices(), getAddOns()]);

  const grouped = services.reduce<Record<string, typeof services>>(
    (acc, s) => {
      (acc[s.category] ??= []).push(s);
      return acc;
    },
    {},
  );

  return (
    <>
      <section className="grain relative overflow-hidden border-b border-border-base bg-bloom">
        <span className="grain-layer" />
        <div className="container-page py-16 lg:py-20">
          <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-brand">
            Services
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-headline font-semibold text-text">
            Every kind of clean we do, and what each one includes.
          </h1>
          <p className="mt-5 max-w-xl leading-relaxed text-text-muted">
            Prices start where they start because every property is different.
            Use the estimator on the home page for a number tailored to yours.
          </p>
        </div>
      </section>

      <div className="container-page py-16 lg:py-20">
        {Object.entries(grouped).map(([category, items]) => (
          <section key={category} className="mb-16 last:mb-0">
            <h2 className="mb-7 font-display text-2xl font-semibold text-text">
              {CATEGORY_LABELS[category] ?? category}
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {items.map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </div>
          </section>
        ))}

        {/* ---------- Add-ons ---------- */}
        <section className="mt-16 rounded-card border border-border-base bg-surface-2 p-8 sm:p-10">
          <h2 className="font-display text-2xl font-semibold text-text">
            Add-ons
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-muted">
            Bolt any of these onto a visit. Each one adds a known amount of time
            — no surprise charges after the fact.
          </p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {addOns.map((a) => (
              <li
                key={a.id}
                className="rounded-field border border-border-base bg-surface p-4"
              >
                <p className="text-sm font-semibold text-text">{a.name}</p>
                <p className="mt-2 flex items-center gap-3 text-xs text-text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="clock" className="size-3.5 text-brand" />
                    {formatDuration(a.minutes)}
                  </span>
                  <span className="font-semibold text-text">
                    +{money(a.price)}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-14 text-center">
          <ButtonLink href="/contact" size="lg">
            Get a free quote
            <Icon name="arrow" className="size-4" />
          </ButtonLink>
        </div>
      </div>
    </>
  );
}
