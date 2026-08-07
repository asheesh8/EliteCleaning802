import { twMerge } from "tailwind-merge";

/**
 * Join class names, dropping falsy values and resolving Tailwind conflicts.
 *
 * Plain concatenation is not enough: components here put their base
 * classes first and the caller's `className` last, but CSS resolves by
 * stylesheet order, not attribute order. So `<Button className="hidden">`
 * lost to the base `inline-flex` and rendered a desktop-only button on
 * mobile. twMerge makes the last-specified utility win, which is what
 * every call site already assumes.
 */
export function cn(...parts: Array<string | false | null | undefined>) {
  return twMerge(parts.filter(Boolean).join(" "));
}

/** Parse a JSON column that should hold an array, without throwing. */
export function parseList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
}
