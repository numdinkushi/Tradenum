"use client";

import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

import { cn } from "@/lib/utils";
import type { NodeRunStatus, PlayNodeModel } from "@/lib/play";

export type PlayNodeType = Node<
  PlayNodeModel & { status: NodeRunStatus; detail?: string },
  "play"
>;

const STATUS_COPY: Record<NodeRunStatus, string> = {
  idle: "IDLE",
  active: "LIVE",
  passed: "FIRE",
  blocked: "BLOCK",
  skipped: "SKIP",
};

function PlayNodeComponent({ data }: NodeProps<PlayNodeType>) {
  const { kicker, title, body, status, detail } = data;
  return (
    <div
      className={cn(
        "w-48 rounded-md border bg-[#0b0d12] px-3 py-2.5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] transition-all",
        status === "active" &&
          "border-cyan-400/80 shadow-[0_0_24px_rgba(34,211,238,0.25)]",
        status === "passed" && "border-emerald-500/50",
        status === "blocked" && "border-red-500/70",
        status === "skipped" && "border-white/10 opacity-50",
        status === "idle" && "border-white/10"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-1.5 !w-1.5 !border-0 !bg-cyan-400/80"
      />
      <div className="flex items-center justify-between gap-2 font-mono text-[10px] tracking-[0.18em] text-white/40">
        <span>{kicker}</span>
        <span
          className={cn(
            status === "active" && "text-cyan-300",
            status === "passed" && "text-emerald-400",
            status === "blocked" && "text-red-400",
            status === "skipped" && "text-white/30"
          )}
        >
          {STATUS_COPY[status]}
        </span>
      </div>
      <p className="mt-1 text-sm font-medium text-white">{title}</p>
      <p className="mt-0.5 text-[11px] leading-snug text-white/45">{detail ?? body}</p>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-1.5 !w-1.5 !border-0 !bg-cyan-400/80"
      />
    </div>
  );
}

export const PlayNode = memo(PlayNodeComponent);
