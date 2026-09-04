"use client";

import { cn } from "@/lib/utils";

export type LampTone = "live" | "demo" | "off" | "warn";

export function StatusLamp({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: LampTone;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] text-white/55">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          tone === "live" && "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]",
          tone === "demo" && "bg-amber-400",
          tone === "warn" && "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.7)]",
          tone === "off" && "bg-white/20"
        )}
      />
      <span className="text-white/35">{label}</span>
      <span
        className={cn(
          tone === "live" && "text-cyan-300",
          tone === "demo" && "text-amber-300",
          tone === "warn" && "text-red-400",
          tone === "off" && "text-white/40"
        )}
      >
        {value}
      </span>
    </span>
  );
}
