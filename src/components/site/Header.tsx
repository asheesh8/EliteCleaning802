"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/site/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

const links = [
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Our work" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header({ phone }: { phone: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border-base bg-bg/85 backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <div className="container-page flex h-18 items-center justify-between gap-4">
        <Link href="/" aria-label={`${"Elite Cleaning 802"} home`}>
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {links.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-field px-3.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-text"
                    : "text-text-muted hover:text-text",
                )}
              >
                {l.label}
                {active && (
                  <span className="absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-brand" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <a
            href={`tel:${phone.replace(/[^\d+]/g, "")}`}
            className="hidden items-center gap-2 rounded-field px-3 py-2 text-sm font-semibold text-text transition-colors hover:bg-surface-2 md:inline-flex"
          >
            <Icon name="phone" className="size-4 text-brand" />
            {phone}
          </a>
          <ThemeToggle />
          <ButtonLink href="/contact" size="sm" className="hidden sm:inline-flex">
            Get a quote
          </ButtonLink>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="grid size-9 place-items-center rounded-full text-text-muted hover:bg-surface-2 lg:hidden"
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border-base bg-bg lg:hidden">
          <nav className="container-page flex flex-col py-3" aria-label="Mobile">
            {/* Closing on click rather than in an effect keyed to the
                pathname — same result, one less render pass. */}
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-field px-3 py-3 text-sm font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
              >
                {l.label}
              </Link>
            ))}
            <a
              href={`tel:${phone.replace(/[^\d+]/g, "")}`}
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center gap-2 rounded-field px-3 py-3 text-sm font-semibold text-text"
            >
              <Icon name="phone" className="size-4 text-brand" />
              {phone}
            </a>
            <ButtonLink
              href="/contact"
              onClick={() => setOpen(false)}
              className="mt-2"
            >
              Get a free quote
            </ButtonLink>
          </nav>
        </div>
      )}
    </header>
  );
}
