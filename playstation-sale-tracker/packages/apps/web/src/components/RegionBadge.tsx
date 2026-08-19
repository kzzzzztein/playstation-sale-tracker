import type { RegionCode } from "@pst/types";

const FLAGS: Record<RegionCode, string> = { us: "🇺🇸", sg: "🇸🇬", hk: "🇭🇰", tr: "🇹🇷" };
const NAMES: Record<RegionCode, string> = { us: "United States", sg: "Singapore", hk: "Hong Kong", tr: "Turkey" };

export function RegionBadge({ code, className = "" }: { code: RegionCode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm text-zinc-300 ${className}`}>
      <span aria-hidden="true">{FLAGS[code]}</span>
      <span>{NAMES[code]}</span>
    </span>
  );
}

export function regionName(code: RegionCode): string {
  return NAMES[code];
}

export function regionFlag(code: RegionCode): string {
  return FLAGS[code];
}
