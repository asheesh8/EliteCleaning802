"use client";

import { cn } from "@/lib/utils";

/**
 * Theme toggle with no state and no effect.
 *
 * The inline script in the root layout sets `.dark` before first paint,
 * so which icon to show is already encoded in the DOM. Rendering both
 * icons and letting the `dark:` variant pick one avoids a mount effect,
 * a hydration mismatch, and the icon flicker that comes with them.
 */
export function ThemeToggle({ className }: { className?: string }) {
  function toggle() {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    try {
      localStorage.setItem("ec802-theme", next ? "dark" : "light");
    } catch {
      // Private browsing — the theme just won't persist.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className={cn(
        "grid size-9 place-items-center rounded-full text-text-muted transition-colors hover:bg-surface-2 hover:text-text",
        className,
      )}
    >
      {/* Sun — shown in light mode */}
      <svg
        viewBox="0 0 24 24"
        className="size-[1.15rem] dark:hidden"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>

      {/* Moon — shown in dark mode */}
      <svg
        viewBox="0 0 24 24"
        className="hidden size-[1.15rem] dark:block"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
      </svg>
    </button>
  );
}
