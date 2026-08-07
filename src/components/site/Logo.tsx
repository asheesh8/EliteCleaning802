import Image from "next/image";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src={brand.logo}
      alt=""
      width={80}
      height={80}
      className={cn("size-9 rounded-lg object-cover", className)}
      priority
    />
  );
}

export function Wordmark({
  className,
  subtitle,
}: {
  className?: string;
  subtitle?: string;
}) {
  return (
    <span className={cn("flex shrink-0 items-center gap-2.5", className)}>
      <LogoMark />
      {/* Below ~380px the mark alone carries the brand — letting the
          wordmark wrap here would blow out the fixed-height header. */}
      <span className="hidden flex-col leading-none min-[380px]:flex">
        <span className="whitespace-nowrap font-display text-[0.95rem] font-semibold tracking-tight text-text">
          {brand.name}
        </span>
        <span className="mt-1 whitespace-nowrap text-2xs font-medium uppercase tracking-[0.16em] text-brand">
          {subtitle ?? `${brand.city}, ${brand.state}`}
        </span>
      </span>
    </span>
  );
}
