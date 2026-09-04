"use client";

import type { DeskStamp } from "@/lib/play";

export function StampRail({ stamps }: { stamps: DeskStamp[] }) {
  const shown = stamps.slice(-6);
  if (!shown.length) return null;
  return (
    <ol className="pointer-events-none absolute bottom-8 left-3 z-10 max-w-[min(22rem,calc(100%-5rem))] space-y-0.5">
      <p className="font-mono text-[9px] tracking-[0.22em] text-white/30">STAMPS</p>
      {shown.map((s, i) => (
        <li
          key={`${s.kicker}-${s.line}-${i}`}
          className="font-mono text-[10px] leading-tight text-white/55"
        >
          <span className="text-cyan-300/70">{s.kicker}</span>
          <span className="text-white/25"> · </span>
          {s.line}
        </li>
      ))}
    </ol>
  );
}
