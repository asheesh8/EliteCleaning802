"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Drag-to-compare before/after slider.
 *
 * The control is a real `<input type="range">` laid transparently over
 * the image. That buys mouse, touch, keyboard, and screen-reader support
 * from the platform instead of hand-rolling pointer maths — and it means
 * the arrow keys work, which a div-with-listeners version never does.
 */
export function BeforeAfter({
  beforeSrc,
  afterSrc,
  title,
  caption,
  priority,
  className,
}: {
  beforeSrc: string;
  afterSrc: string;
  title: string;
  caption?: string | null;
  priority?: boolean;
  className?: string;
}) {
  const [position, setPosition] = useState(50);
  const id = useId();

  return (
    <figure
      className={cn(
        "group overflow-hidden rounded-card border border-border-base bg-surface shadow-e1 transition-shadow hover:shadow-e2",
        className,
      )}
    >
      <div className="relative aspect-square touch-pan-y select-none bg-surface-2">
        {/* After sits underneath, fully visible. */}
        <Image
          src={afterSrc}
          alt={`${title} — after cleaning`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={priority}
          className="object-cover"
          draggable={false}
        />

        {/* Before is clipped from the right edge inward. */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <Image
            src={beforeSrc}
            alt={`${title} — before cleaning`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            className="object-cover"
            draggable={false}
          />
        </div>

        {/* Corner labels. Each fades out as the divider passes it, so the
            label never sits over the image it isn't describing. */}
        <span
          className="pointer-events-none absolute left-3 top-3 rounded-full bg-plum-950/75 px-2.5 py-1 text-2xs font-semibold uppercase tracking-[0.12em] text-cream-50 backdrop-blur-sm transition-opacity duration-200"
          style={{ opacity: position > 12 ? 1 : 0 }}
        >
          Before
        </span>
        <span
          className="pointer-events-none absolute right-3 top-3 rounded-full bg-fern-700/85 px-2.5 py-1 text-2xs font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-sm transition-opacity duration-200"
          style={{ opacity: position < 88 ? 1 : 0 }}
        >
          After
        </span>

        {/* Divider + grip. Purely decorative — the range input below is
            what actually receives input. */}
        <div
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-cream-50 shadow-[0_0_0_1px_rgba(42,24,63,0.25)]"
          style={{ left: `${position}%`, transform: "translateX(-50%)" }}
        >
          <span className="absolute top-1/2 left-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-cream-50 shadow-e2 ring-1 ring-plum-900/10 transition-transform duration-200 group-hover:scale-105">
            <svg
              viewBox="0 0 24 24"
              className="size-4 text-plum-800"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 6l-4 6 4 6M15 6l4 6-4 6" />
            </svg>
          </span>
        </div>

        <label htmlFor={id} className="sr-only">
          {title}: reveal before or after
        </label>
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={position}
          onChange={(e) => setPosition(Number(e.target.value))}
          aria-valuetext={`${Math.round(position)}% before`}
          className="absolute inset-0 size-full cursor-ew-resize appearance-none bg-transparent opacity-0"
        />
      </div>

      <figcaption className="px-4 py-3.5">
        <span className="text-sm font-semibold text-text">{title}</span>
        {caption && (
          <span className="mt-1 block text-sm leading-relaxed text-text-muted">
            {caption}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
