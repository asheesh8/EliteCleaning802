import Link from "next/link";
import { Wordmark } from "@/components/site/Logo";
import { Icon } from "@/components/ui/Icon";
import { brand } from "@/lib/brand";

export function Footer({
  phone,
  email,
  serviceArea,
  hours,
  facebook,
}: {
  phone: string;
  email: string;
  serviceArea: string;
  hours: string;
  facebook: string;
}) {
  return (
    <footer className="mt-24 border-t border-border-base bg-surface-2">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Wordmark />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-text-muted">
            Woman-owned, locally run, and genuinely particular about the work.
            Serving {serviceArea}.
          </p>
          <a
            href={facebook}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"
          >
            Follow on Facebook
            <Icon name="arrow" className="size-4" />
          </a>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-text">Services</h2>
          <ul className="mt-3.5 space-y-2.5 text-sm text-text-muted">
            {[
              ["Recurring cleaning", "/services/recurring-home"],
              ["Deep cleans", "/services/deep-clean"],
              ["Airbnb turnovers", "/services/airbnb-turnover"],
              ["Office & commercial", "/services/office-commercial"],
              ["Post-construction", "/services/post-construction"],
              ["Move-in / move-out", "/services/move-in-out"],
            ].map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="transition-colors hover:text-text">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-text">Get in touch</h2>
          <ul className="mt-3.5 space-y-2.5 text-sm text-text-muted">
            <li>
              <a
                href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                className="flex items-center gap-2 transition-colors hover:text-text"
              >
                <Icon name="phone" className="size-4 text-brand" />
                {phone}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-2 transition-colors hover:text-text"
              >
                <Icon name="mail" className="size-4 text-brand" />
                {email}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Icon name="clock" className="size-4 text-brand" />
              {hours}
            </li>
            <li className="flex items-center gap-2">
              <Icon name="pin" className="size-4 text-brand" />
              {brand.city}, {brand.state}
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border-base">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-5 text-xs text-text-subtle">
          <p>
            © {new Date().getFullYear()} {brand.legalName}. All rights reserved.
          </p>
          {/* The CRM entrance. Unlisted, not hidden — a private page needs
              to be reachable by the people who own it. */}
          <Link href="/crew" className="transition-colors hover:text-text-muted">
            Team login
          </Link>
        </div>
      </div>
    </footer>
  );
}
