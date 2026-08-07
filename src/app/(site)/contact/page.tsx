import type { Metadata } from "next";
import { Suspense } from "react";
import { QuoteForm } from "@/components/site/QuoteForm";
import { Icon } from "@/components/ui/Icon";
import { getServices } from "@/lib/data";
import { getSiteSettings } from "@/lib/settings";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Get a quote",
  description:
    "Tell us about your place and we'll get back to you within one business day with a firm price.",
};

export default async function ContactPage() {
  const [services, settings] = await Promise.all([
    getServices(),
    getSiteSettings(),
  ]);

  return (
    <>
      <section className="grain relative overflow-hidden border-b border-border-base bg-bloom">
        <span className="grain-layer" />
        <div className="container-page py-16 lg:py-20">
          <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-brand">
            Get in touch
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-headline font-semibold text-text">
            Tell us about your place.
          </h1>
          <p className="mt-5 max-w-xl leading-relaxed text-text-muted">
            The more you tell us, the tighter the quote. Everything below is
            optional except your name and email.
          </p>
        </div>
      </section>

      <div className="container-page grid gap-12 py-16 lg:grid-cols-[1fr_1.6fr] lg:py-20">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="font-display text-xl font-semibold text-text">
            Rather just call?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            Laura and Lisa both answer the phone. You&rsquo;ll get a person, not
            a queue.
          </p>

          <ul className="mt-7 space-y-4">
            {[
              { icon: "phone", label: "Phone", value: settings.phone, href: `tel:${settings.phone.replace(/[^\d+]/g, "")}` },
              { icon: "mail", label: "Email", value: settings.email, href: `mailto:${settings.email}` },
              { icon: "clock", label: "Hours", value: settings.hours },
              { icon: "pin", label: "Service area", value: settings.serviceArea },
            ].map((row) => (
              <li key={row.label} className="flex gap-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-plum-100 text-plum-800 dark:bg-plum-950 dark:text-plum-300">
                  <Icon name={row.icon} className="size-[1.15rem]" />
                </span>
                <div className="min-w-0">
                  <p className="text-2xs font-semibold uppercase tracking-[0.12em] text-text-subtle">
                    {row.label}
                  </p>
                  {row.href ? (
                    <a
                      href={row.href}
                      className="text-sm font-medium text-text transition-colors hover:text-brand"
                    >
                      {row.value}
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-text">{row.value}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <a
            href={settings.facebook}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
          >
            See our work on Facebook
            <Icon name="arrow" className="size-4" />
          </a>

          <div className="mt-8 rounded-card border border-border-base bg-surface-2 p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-text">
              <Icon name="shield" className="size-4 text-brand" />
              Insured & bonded
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-text-muted">
              {brand.legalName} carries full liability coverage. Certificates
              available on request for property managers and landlords.
            </p>
          </div>
        </aside>

        {/* useSearchParams needs a Suspense boundary to keep the route
            statically renderable. */}
        <Suspense
          fallback={
            <div className="h-[40rem] animate-pulse rounded-card border border-border-base bg-surface-2" />
          }
        >
          <QuoteForm services={services} />
        </Suspense>
      </div>
    </>
  );
}
