import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { money } from "@/lib/format";

export function ServiceCard({
  service,
}: {
  service: {
    slug: string;
    name: string;
    blurb: string;
    icon: string;
    priceFrom: number | null;
    priceUnit: string;
    features: string[];
  };
}) {
  return (
    <Link
      href={`/services/${service.slug}`}
      className="group flex h-full flex-col rounded-card border border-border-base bg-surface p-7 shadow-e1 transition-all duration-300 hover:-translate-y-1 hover:border-plum-300 hover:shadow-e3 dark:hover:border-plum-700"
    >
      <span className="grid size-12 place-items-center rounded-2xl bg-plum-100 text-plum-800 transition-colors group-hover:bg-brand group-hover:text-on-brand dark:bg-plum-950 dark:text-plum-300">
        <Icon name={service.icon} className="size-5" />
      </span>

      <h3 className="mt-5 font-display text-xl font-semibold text-text">
        {service.name}
      </h3>
      <p className="mt-2.5 flex-1 text-sm leading-relaxed text-text-muted">
        {service.blurb}
      </p>

      <ul className="mt-5 space-y-2">
        {service.features.slice(0, 3).map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-text-muted">
            <Icon name="check" className="mt-0.5 size-3.5 shrink-0 text-fern-600 dark:text-fern-400" />
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between border-t border-border-base pt-4">
        <span className="text-sm text-text-subtle">
          {service.priceFrom ? (
            <>
              from{" "}
              <span className="font-display text-lg font-semibold text-text">
                {money(service.priceFrom)}
              </span>
              <span className="text-text-subtle">/{service.priceUnit}</span>
            </>
          ) : (
            "Quoted per job"
          )}
        </span>
        <Icon
          name="arrow"
          className="size-4 text-brand transition-transform group-hover:translate-x-1"
        />
      </div>
    </Link>
  );
}
