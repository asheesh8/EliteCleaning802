"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoMark } from "@/components/site/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Icon } from "@/components/ui/Icon";
import { logout } from "@/app/crew/login/actions";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
  badge?: number;
};

type Section = { label: string; items: NavItem[] };

export function CrmNav({
  user,
  newLeads,
  todayJobs,
  openChats,
}: {
  user: { name: string; email: string; role: string };
  newLeads: number;
  todayJobs: number;
  openChats: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const sections: Section[] = [
    {
      label: "Today",
      items: [
        { href: "/crew", label: "Dashboard", icon: "dashboard", exact: true },
        { href: "/crew/schedule", label: "Schedule", icon: "calendar", badge: todayJobs },
        { href: "/crew/travel", label: "Travel & route", icon: "route" },
      ],
    },
    {
      label: "Pipeline",
      items: [
        { href: "/crew/leads", label: "Leads", icon: "quote", badge: newLeads },
        { href: "/crew/messages", label: "Messages", icon: "chat", badge: openChats },
        { href: "/crew/clients", label: "Clients", icon: "users" },
        { href: "/crew/invoices", label: "Invoices", icon: "invoice" },
      ],
    },
    {
      label: "Tools",
      items: [
        { href: "/crew/estimator", label: "Time estimator", icon: "clock" },
        { href: "/crew/reports", label: "Reports", icon: "chart" },
      ],
    },
    {
      label: "Website",
      items: [
        { href: "/crew/services", label: "Services", icon: "sparkle" },
        { href: "/crew/gallery", label: "Gallery", icon: "image" },
        { href: "/crew/reviews", label: "Reviews", icon: "star" },
        { href: "/crew/settings", label: "Settings", icon: "settings" },
      ],
    },
  ];

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const nav = (
    <nav className="flex flex-col gap-6" aria-label="CRM">
      {sections.map((section) => (
        <div key={section.label}>
          <p className="px-3 pb-2 text-2xs font-semibold uppercase tracking-[0.14em] text-text-subtle">
            {section.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  // Dismiss the mobile drawer on navigation. Harmless on
                  // desktop, where the sidebar is always open.
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-field px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand text-on-brand shadow-e1"
                      : "text-text-muted hover:bg-surface-2 hover:text-text",
                  )}
                >
                  <Icon name={item.icon} className="size-[1.15rem]" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {!!item.badge && item.badge > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-2xs font-semibold tabular",
                        active
                          ? "bg-white/20 text-on-brand"
                          : "bg-plum-100 text-plum-800 dark:bg-plum-950 dark:text-plum-300",
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="border-t border-border-base pt-4">
      <Link
        href="/"
        target="_blank"
        className="mb-1 flex items-center gap-3 rounded-field px-3 py-2.5 text-sm text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
      >
        <Icon name="eye" className="size-[1.15rem]" />
        View website
      </Link>

      <form action={logout}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-field px-3 py-2.5 text-sm text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
        >
          <Icon name="logout" className="size-[1.15rem]" />
          Sign out
        </button>
      </form>

      <div className="mt-2 flex items-center gap-2.5 border-t border-border-base px-3 pt-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-plum-100 text-xs font-semibold text-plum-800 dark:bg-plum-950 dark:text-plum-300">
          {user.name.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text">{user.name}</p>
          <p className="truncate text-2xs capitalize text-text-subtle">
            {user.role}
          </p>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border-base bg-bg/90 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link href="/crew" className="flex items-center gap-2.5">
          <LogoMark className="size-8" />
          <span className="font-display text-sm font-semibold text-text">
            Elite 802
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="grid size-9 place-items-center rounded-full text-text-muted hover:bg-surface-2"
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-b border-border-base bg-surface p-4 lg:hidden">
          {nav}
          <div className="mt-6">{footer}</div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="scrollbar-slim sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-border-base bg-surface p-4 lg:flex">
        <Link href="/crew" className="flex items-center gap-2.5 px-2 py-2">
          <LogoMark className="size-9" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-sm font-semibold tracking-tight text-text">
              Elite Cleaning 802
            </span>
            <span className="mt-1 text-2xs font-medium uppercase tracking-[0.16em] text-brand">
              Workspace
            </span>
          </span>
        </Link>

        <div className="mt-7 flex-1">{nav}</div>
        {footer}
      </aside>
    </>
  );
}
