"use client";

import { GATE_PLAIN, REGIME_PLAIN, STATUS_PLAIN, STRUCTURE_PLAIN } from "@/lib/copy";
import type { GateName, Regime, Structure, TicketStatus } from "@/lib/enums";

function pick<K extends string>(map: Record<K, string>, key: string, fallback = key) {
  return map[key as K] ?? fallback;
}

export function useEnumLabel() {
  return {
    status: (value: TicketStatus | string) => pick(STATUS_PLAIN, value),
    structure: (value: Structure | string) => pick(STRUCTURE_PLAIN, value),
    gate: (value: GateName | string) => pick(GATE_PLAIN, value),
    regime: (value: Regime | string) => pick(REGIME_PLAIN, value),
    pretty: (value: string) => value.replaceAll("_", " "),
  };
}
