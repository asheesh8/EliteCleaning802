/** All money is stored in cents. This is the only place it becomes a string. */
export function money(cents: number | null | undefined, opts: { cents?: boolean } = {}) {
  const value = (cents ?? 0) / 100;
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: opts.cents ? 2 : value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function dateLong(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function dateShort(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function dateInput(d: Date | string) {
  const date = new Date(d);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function time(d: Date | string) {
  return new Date(d).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "3 days ago", "in 2 hours" — for activity feeds. */
export function relative(d: Date | string) {
  const diff = new Date(d).getTime() - Date.now();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31536000000],
    ["month", 2592000000],
    ["day", 86400000],
    ["hour", 3600000],
    ["minute", 60000],
  ];

  for (const [unit, ms] of units) {
    if (abs >= ms) return rtf.format(Math.round(diff / ms), unit);
  }
  return "just now";
}

/** Add the day's minutes to a start time, for schedule end-times. */
export function addMinutes(d: Date | string, minutes: number) {
  return new Date(new Date(d).getTime() + minutes * 60000);
}
