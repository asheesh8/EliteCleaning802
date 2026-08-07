import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getGallery } from "@/lib/data";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Our work",
  description: "Recent cleans across Rutland County and central Vermont.",
};

export default async function GalleryPage() {
  const [items, settings] = await Promise.all([getGallery(), getSiteSettings()]);

  return (
    <>
      <section className="grain relative overflow-hidden border-b border-border-base bg-bloom">
        <span className="grain-layer" />
        <div className="container-page py-16 lg:py-20">
          <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-brand">
            Our work
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-headline font-semibold text-text">
            Recent cleans.
          </h1>
          <p className="mt-5 max-w-xl leading-relaxed text-text-muted">
            Real jobs across {settings.serviceArea}.
          </p>
        </div>
      </section>

      <div className="container-page py-16 lg:py-20">
        {items.length === 0 ? (
          // Empty state that tells the owners exactly what to do next,
          // rather than showing visitors a broken-looking page.
          <div className="mx-auto max-w-lg rounded-card border border-dashed border-border-strong bg-surface-2 px-8 py-16 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-plum-100 text-plum-800 dark:bg-plum-950 dark:text-plum-300">
              <Icon name="image" className="size-6" />
            </span>
            <h2 className="mt-5 font-display text-xl font-semibold text-text">
              Photos coming soon
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-text-muted">
              We&rsquo;re putting together a gallery of recent work. In the
              meantime, our Facebook page has plenty.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a
                href={settings.facebook}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-field bg-brand px-5 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-hover"
              >
                See our Facebook
                <Icon name="arrow" className="size-4" />
              </a>
              <ButtonLink href="/contact" variant="secondary">
                Get a quote
              </ButtonLink>
            </div>
          </div>
        ) : (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
            {items.map((item) => (
              <figure
                key={item.id}
                className="break-inside-avoid overflow-hidden rounded-card border border-border-base bg-surface shadow-e1"
              >
                <Image
                  src={`/gallery/${item.filename}`}
                  alt={item.title}
                  width={item.width}
                  height={item.height}
                  className="w-full object-cover"
                />
                {item.caption && (
                  <figcaption className="px-4 py-3 text-sm text-text-muted">
                    {item.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
