import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ServiceCard } from "@/components/site/ServiceCard";
import { QuoteEstimator } from "@/components/site/QuoteEstimator";
import { brand } from "@/lib/brand";
import { getServices, getTestimonials, getAddOns, getGallery } from "@/lib/data";
import { getSiteSettings } from "@/lib/settings";

export default async function HomePage() {
  const [services, testimonials, addOns, gallery, settings] = await Promise.all([
    getServices(),
    getTestimonials(),
    getAddOns(),
    getGallery(),
    getSiteSettings(),
  ]);

  const featured = services.filter((s) => s.featured).slice(0, 3);

  return (
    <>
      {/* ================= Hero ================= */}
      <section className="grain relative overflow-hidden bg-bloom">
        <span className="grain-layer" />
        <div className="container-page relative grid gap-14 py-20 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:py-28">
          <div className="animate-rise">
            <p className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface/70 px-3.5 py-1.5 text-2xs font-semibold uppercase tracking-[0.14em] text-brand backdrop-blur">
              <Icon name="leaf" className="size-3.5" />
              Woman-owned · {brand.serviceArea}
            </p>

            <h1 className="mt-6 font-display text-display font-semibold text-text">
              {settings.heroTitle}
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-text-muted">
              {settings.heroBody}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <ButtonLink href="/contact" size="lg">
                Get a free quote
                <Icon name="arrow" className="size-4" />
              </ButtonLink>
              <ButtonLink href="/services" size="lg" variant="secondary">
                See what we do
              </ButtonLink>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-1 gap-6 border-t border-border-base pt-8 min-[420px]:grid-cols-3">
              {[
                ["Insured", "& bonded"],
                ["Same team", "every visit"],
                ["Free", "walkthrough"],
              ].map(([big, small]) => (
                <div key={big}>
                  <dt className="font-display text-lg font-semibold text-text">
                    {big}
                  </dt>
                  <dd className="text-sm text-text-muted">{small}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* The logo is the client's real mark — it carries the brand
              better than any stock photo of a spray bottle would. */}
          <div className="animate-rise justify-self-center [animation-delay:120ms] lg:justify-self-end">
            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-6 rounded-[2rem] bg-plum-200/40 blur-2xl dark:bg-plum-800/30"
              />
              <Image
                src={brand.logo}
                alt={`${brand.name} logo`}
                width={420}
                height={420}
                priority
                className="relative w-64 rounded-3xl shadow-e3 ring-1 ring-border-base sm:w-80 lg:w-[24rem]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================= Services ================= */}
      <section className="container-page py-20 lg:py-28">
        <div className="reveal-on-scroll flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-brand">
              What we do
            </p>
            <h2 className="mt-3 font-display text-headline font-semibold text-text">
              Cleaning built around how you actually live.
            </h2>
          </div>
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
          >
            All services
            <Icon name="arrow" className="size-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {featured.map((s, i) => (
            <div
              key={s.id}
              className="reveal-on-scroll"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <ServiceCard service={s} />
            </div>
          ))}
        </div>
      </section>

      {/* ================= Instant estimate ================= */}
      <section className="border-y border-border-base bg-surface-2">
        <div className="container-page grid gap-12 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:py-24">
          <div className="reveal-on-scroll lg:sticky lg:top-28">
            <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-brand">
              No waiting
            </p>
            <h2 className="mt-3 font-display text-headline font-semibold text-text">
              See your estimate before you call.
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-text-muted">
              Most companies make you wait two days for a number. Tell us about
              your place and we&rsquo;ll show you the time and price right now —
              the same maths our schedule runs on.
            </p>

            <ul className="mt-8 space-y-3.5">
              {[
                "Built from real job times, not guesses",
                "Adjusts for size, condition, and how often we visit",
                "No obligation, no sales call",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3 text-sm text-text-muted">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-fern-100 text-fern-700 dark:bg-fern-900 dark:text-fern-300">
                    <Icon name="check" className="size-3" />
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="reveal-on-scroll">
            <QuoteEstimator services={services} addOns={addOns} />
          </div>
        </div>
      </section>

      {/* ================= Process ================= */}
      <section className="container-page py-20 lg:py-28">
        <div className="reveal-on-scroll mx-auto max-w-2xl text-center">
          <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-brand">
            How it works
          </p>
          <h2 className="mt-3 font-display text-headline font-semibold text-text">
            Three steps, no runaround.
          </h2>
        </div>

        <ol className="mt-14 grid gap-8 md:grid-cols-3">
          {[
            {
              icon: "quote",
              title: "Tell us about your place",
              body: "Use the estimator or call. We ask about size, condition, and how often you want us — enough to quote honestly.",
            },
            {
              icon: "calendar",
              title: "We walk through and confirm",
              body: "A free walkthrough for anything beyond a standard visit. You get a fixed time and price before we start.",
            },
            {
              icon: "sparkle",
              title: "Same team, every visit",
              body: "You get the people who already know your home. No rotating crews, no re-explaining what matters to you.",
            },
          ].map((step, i) => (
            <li
              key={step.title}
              className="reveal-on-scroll relative"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-brand text-on-brand shadow-e2">
                <Icon name={step.icon} className="size-5" />
              </span>
              <span className="mt-5 block font-display text-sm font-semibold uppercase tracking-[0.14em] text-brand">
                Step {i + 1}
              </span>
              <h3 className="mt-2 font-display text-xl font-semibold text-text">
                {step.title}
              </h3>
              <p className="mt-2.5 leading-relaxed text-text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ================= Gallery strip ================= */}
      {gallery.length > 0 && (
        <section className="container-page pb-20 lg:pb-28">
          <div className="reveal-on-scroll flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-headline font-semibold text-text">
              Recent work
            </h2>
            <Link
              href="/gallery"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
            >
              View gallery
              <Icon name="arrow" className="size-4" />
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {gallery.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="reveal-on-scroll aspect-4/3 overflow-hidden rounded-card ring-1 ring-border-base"
              >
                <Image
                  src={`/gallery/${item.filename}`}
                  alt={item.title}
                  width={item.width}
                  height={item.height}
                  className="size-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================= Testimonials ================= */}
      {testimonials.length > 0 && (
        <section className="border-y border-border-base bg-surface-2">
          <div className="container-page py-20 lg:py-24">
            <div className="reveal-on-scroll mx-auto max-w-2xl text-center">
              <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-brand">
                What clients say
              </p>
              <h2 className="mt-3 font-display text-headline font-semibold text-text">
                The reason we don&rsquo;t advertise much.
              </h2>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {testimonials.slice(0, 4).map((t, i) => (
                <figure
                  key={t.id}
                  className="reveal-on-scroll flex flex-col rounded-card border border-border-base bg-surface p-6 shadow-e1"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex gap-0.5 text-brass-500">
                    {Array.from({ length: t.rating }).map((_, n) => (
                      <Icon key={n} name="star" className="size-4" />
                    ))}
                  </div>
                  <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-text">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-5 border-t border-border-base pt-4">
                    <span className="block text-sm font-semibold text-text">
                      {t.author}
                    </span>
                    <span className="block text-xs text-text-subtle">
                      {[t.role, t.location].filter(Boolean).join(" · ")}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= CTA ================= */}
      <section className="container-page py-20 lg:py-28">
        <div className="grain relative overflow-hidden rounded-[1.75rem] bg-plum-800 px-8 py-16 text-center shadow-e3 sm:px-16">
          <span className="grain-layer" />
          <div
            aria-hidden
            className="absolute -right-20 -top-24 size-72 rounded-full bg-plum-600/40 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-24 -left-16 size-72 rounded-full bg-brass-500/20 blur-3xl"
          />

          <h2 className="relative font-display text-headline font-semibold text-cream-50">
            Let&rsquo;s get your place on the schedule.
          </h2>
          <p className="relative mx-auto mt-5 max-w-xl leading-relaxed text-plum-200">
            Free quotes, honest timelines, and a team that treats your home the
            way we&rsquo;d want ours treated.
          </p>
          <div className="relative mt-9 flex flex-wrap justify-center gap-3">
            <ButtonLink
              href="/contact"
              size="lg"
              className="bg-cream-50 text-plum-900 hover:bg-white"
            >
              Get a free quote
              <Icon name="arrow" className="size-4" />
            </ButtonLink>
            <a
              href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}
              className="inline-flex h-13 items-center justify-center gap-2.5 rounded-field border border-plum-400/50 px-7 text-base font-semibold text-cream-50 transition-colors hover:bg-plum-700"
            >
              <Icon name="phone" className="size-4" />
              {settings.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
