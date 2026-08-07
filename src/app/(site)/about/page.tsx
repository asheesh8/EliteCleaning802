import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { brand } from "@/lib/brand";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "About",
  description:
    "Woman-owned, locally run, and genuinely particular. Meet the people behind Elite Cleaning 802.",
};

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <section className="grain relative overflow-hidden border-b border-border-base bg-bloom">
        <span className="grain-layer" />
        <div className="container-page grid gap-12 py-16 lg:grid-cols-[1.3fr_1fr] lg:items-center lg:py-20">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-brand">
              About us
            </p>
            <h1 className="mt-3 font-display text-headline font-semibold text-text">
              Woman-owned, locally run, and genuinely particular.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-text-muted">
              {settings.heroBody}
            </p>
          </div>

          <div className="justify-self-center lg:justify-self-end">
            <Image
              src={brand.logo}
              alt={`${brand.name} logo`}
              width={320}
              height={320}
              className="w-52 rounded-3xl shadow-e3 ring-1 ring-border-base sm:w-64"
            />
          </div>
        </div>
      </section>

      <div className="container-page py-16 lg:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display text-2xl font-semibold text-text">
            Why we started
          </h2>
          <div className="mt-5 space-y-5 text-lg leading-relaxed text-text-muted">
            <p>
              {brand.owners.join(" and ")} started {brand.name} because too many
              cleaning services in Vermont treat the work as interchangeable —
              rotating crews, rushed visits, and a checklist nobody actually
              follows.
            </p>
            <p>
              We run it differently. You get the same people every visit, so
              nobody has to be told twice about the floor that scratches or the
              room the baby sleeps in. We quote honestly, including the drive,
              and we&rsquo;d rather turn down work than take on more than we can
              do properly.
            </p>
            <p>
              That&rsquo;s the whole strategy. It&rsquo;s why most of our work
              comes from people who were referred by someone we already clean
              for.
            </p>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-3">
          {[
            {
              icon: "users",
              title: "Same team, every visit",
              body: "No rotating crews. The people who clean your home this month are the ones who clean it next month.",
            },
            {
              icon: "clock",
              title: "Honest timelines",
              body: "We tell you how long it will actually take, including drive time. If we're running behind, you hear it from us first.",
            },
            {
              icon: "shield",
              title: "Insured & bonded",
              body: "Full liability coverage. Certificates on request for landlords and property managers.",
            },
          ].map((v) => (
            <div
              key={v.title}
              className="rounded-card border border-border-base bg-surface p-6 shadow-e1"
            >
              <span className="grid size-11 place-items-center rounded-2xl bg-plum-100 text-plum-800 dark:bg-plum-950 dark:text-plum-300">
                <Icon name={v.icon} className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-text">
                {v.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                {v.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <ButtonLink href="/contact" size="lg">
            Work with us
            <Icon name="arrow" className="size-4" />
          </ButtonLink>
        </div>
      </div>
    </>
  );
}
