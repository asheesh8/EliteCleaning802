import { cn } from "@/lib/utils";

/**
 * Hand-rolled icon set.
 *
 * A dependency-free set keeps the bundle honest and guarantees every
 * glyph shares one stroke weight and corner radius — which is most of
 * what makes an icon set look designed rather than assembled.
 */
const paths: Record<string, React.ReactNode> = {
  sparkle: (
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
  ),
  home: <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z" />,
  building: (
    <>
      <path d="M4 21V5a1 1 0 011-1h9a1 1 0 011 1v16" />
      <path d="M15 21V9h4a1 1 0 011 1v11" />
      <path d="M8 8h3M8 12h3M8 16h3" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="8" r="4" />
      <path d="M11 11l9 9M17 17l2-2M14 14l2-2" />
    </>
  ),
  hammer: <path d="M14 3l7 7-3 3-7-7 3-3zM11 8L3 16v5h5l8-8" />,
  box: <path d="M3 8l9-5 9 5v8l-9 5-9-5V8zM3 8l9 5 9-5M12 13v8" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  car: (
    <>
      <path d="M3 13l2-5a2 2 0 012-1.4h10A2 2 0 0119 8l2 5v5h-3v-2H6v2H3v-5z" />
      <circle cx="7.5" cy="15.5" r="1.2" />
      <circle cx="16.5" cy="15.5" r="1.2" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M8.5 6H15a3 3 0 010 6H9a3 3 0 000 6h6.5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20a6 6 0 0112 0M16 5.5a3.2 3.2 0 010 6M17 20a6 6 0 00-1.5-4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0114 0" />
    </>
  ),
  dashboard: (
    <>
      <rect x="3" y="3" width="7.5" height="8.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="5" rx="1.5" />
      <rect x="3" y="14.5" width="7.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="11" width="7.5" height="10" rx="1.5" />
    </>
  ),
  quote: (
    <>
      <path d="M5 4h11l4 4v12a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
      <path d="M15 4v5h5M8 13h8M8 17h5" />
    </>
  ),
  invoice: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  star: <path d="M12 3l2.7 5.9 6.3.7-4.7 4.3 1.3 6.1L12 17l-5.6 3 1.3-6.1L3 9.6l6.3-.7L12 3z" />,
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.8" />
      <path d="M3 17l5-4 4 3 3-2 6 5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5l1.4 2.4 2.7-.5.4 2.7 2.5 1.1-1.2 2.5 1.2 2.5-2.5 1.1-.4 2.7-2.7-.5L12 21.5l-1.4-2.4-2.7.5-.4-2.7L5 15.8l1.2-2.5L5 10.8l2.5-1.1.4-2.7 2.7.5L12 2.5z" />
    </>
  ),
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  check: <path d="M4 12.5l5 5L20 6.5" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  phone: (
    <path d="M6 3h3l2 5-2.2 1.4a12 12 0 005.8 5.8L16 13l5 2v3a2 2 0 01-2.2 2A17 17 0 014 5.2 2 2 0 016 3z" />
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 6.5L12 13l8.5-6.5" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  logout: <path d="M14 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M10 8l-4 4 4 4M6 12h10" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5" />,
  bolt: <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  shield: <path d="M12 3l8 3v6c0 5-3.5 8.3-8 9.5-4.5-1.2-8-4.5-8-9.5V6l8-3z" />,
  leaf: <path d="M20 4S8 4 6 12c-1 4 1.5 7 5 7 6 0 9-8 9-15zM6 20c1-5 4-8 8-10" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  chat: (
    <path d="M21 11.5a8.4 8.4 0 01-9 8.4 9.3 9.3 0 01-3.3-.6L3 21l1.8-5A8.1 8.1 0 013.5 11.5a8.4 8.4 0 018.5-8.4 8.4 8.4 0 019 8.4z" />
  ),
  send: <path d="M21 3L10.5 13.5M21 3l-6.5 18-4-8-8-4L21 3z" />,
  play: <path d="M7 4l12 8-12 8V4z" />,
  pause: <path d="M8 4v16M16 4v16" />,
};

export function Icon({
  name,
  className,
  filled,
}: {
  name: string;
  className?: string;
  filled?: boolean;
}) {
  const node = paths[name] ?? paths.sparkle;
  const solid = filled || name === "star" || name === "sparkle" || name === "bolt" || name === "play";

  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-5 shrink-0", className)}
      fill={solid ? "currentColor" : "none"}
      stroke={solid ? "none" : "currentColor"}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {node}
    </svg>
  );
}
