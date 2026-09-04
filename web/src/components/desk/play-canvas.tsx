"use client";

import { useEffect, useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  ReactFlow,
  useReactFlow,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";

import { PlayNode, type PlayNodeType } from "@/components/desk/play-node";
import { PlayVerdict } from "@/components/desk/play-verdict";
import { StampRail } from "@/components/desk/stamp-rail";
import { layoutEdges, layoutNodes, PLAY_GRAPH, STRUCTURE_SHORT } from "@/lib/play";
import type { DeskStamp, NodeRunStatus, PlayNodeId, PrintCall } from "@/lib/play";
import type { Ticket } from "@/lib/types";

import "@xyflow/react/dist/style.css";

const nodeTypes: NodeTypes = { play: PlayNode };

const FIT_PAD = 0.2;

function nodeLit(status: NodeRunStatus, active: PlayNodeId | null, id: PlayNodeId) {
  return id === active || status === "passed" || status === "blocked" || status === "skipped";
}

function detailsFor(
  ticket: Ticket | null,
  printCall: PrintCall | null,
  statuses: Record<PlayNodeId, NodeRunStatus>,
  active: PlayNodeId | null
): Partial<Record<PlayNodeId, string>> {
  if (!ticket) {
    return printCall === "pass" && nodeLit(statuses.print, active, "print")
      ? { print: "Pass. Nothing to sell or buy." }
      : {};
  }
  const structure = STRUCTURE_SHORT[ticket.proposal.structure] ?? ticket.proposal.structure;
  const failed = ticket.gates.filter((g) => !g.passed).map((g) => g.name);
  const extra: Partial<Record<PlayNodeId, string>> = {};
  if (nodeLit(statuses.print, active, "print")) {
    extra.print =
      printCall === "fade"
        ? "Fade: overcrowded hedge, sell the wings."
        : "Follow: defined-risk spread with the print.";
  }
  if (nodeLit(statuses.structure, active, "structure")) {
    extra.structure = structure;
  }
  if (nodeLit(statuses.gate, active, "gate")) {
    extra.gate = failed.length ? failed.join(" · ") : "All gates clear.";
  }
  if (nodeLit(statuses.execute, active, "execute")) {
    extra.execute =
      ticket.status === "proposed"
        ? "Compiled. Arm was off — not posted."
        : ticket.status === "executed" || ticket.status === "supervising"
          ? "Posted to Alpaca paper."
          : ticket.status === "vetoed"
            ? "Not posted."
            : ticket.status;
  }
  if (nodeLit(statuses.supervise, active, "supervise")) {
    extra.supervise =
      ticket.status === "supervising" || ticket.status === "executed"
        ? "Watching max loss vs last price."
        : "No live position.";
  }
  return extra;
}

function AgentMarker({ active }: { active: PlayNodeId | null }) {
  const { getNode, setCenter, fitView } = useReactFlow();
  useEffect(() => {
    if (active) {
      const node = getNode(active);
      if (!node) return;
      void setCenter(node.position.x + 96, node.position.y + 48, {
        zoom: 1.05,
        duration: 280,
      });
      return;
    }
    void fitView({ padding: FIT_PAD, duration: 220 });
  }, [active, fitView, getNode, setCenter]);
  return null;
}

export function PlayCanvas({
  statuses,
  active,
  ticket,
  printCall,
  verdictReady,
  stamps,
  sending,
  onSend,
}: {
  statuses: Record<PlayNodeId, NodeRunStatus>;
  active: PlayNodeId | null;
  ticket: Ticket | null;
  printCall: PrintCall | null;
  verdictReady: boolean;
  stamps: DeskStamp[];
  sending?: boolean;
  onSend?: (override: boolean) => void;
}) {
  const extra = detailsFor(ticket, printCall, statuses, active);
  const nodes: PlayNodeType[] = useMemo(
    () =>
      layoutNodes().map((node) => ({
        ...node,
        data: {
          ...PLAY_GRAPH.find((n) => n.id === node.id)!,
          status:
            node.id === active ? "active" : statuses[node.id as PlayNodeId],
          detail: extra[node.id as PlayNodeId],
        },
      })),
    [active, extra, statuses]
  );
  const edges: Edge[] = useMemo(
    () =>
      layoutEdges().map((edge) => ({
        ...edge,
        animated: active === edge.source || active === edge.target,
        style: {
          stroke:
            statuses[edge.source as PlayNodeId] === "blocked"
              ? "#f87171"
              : statuses[edge.source as PlayNodeId] === "passed"
                ? "#22d3ee"
                : "rgba(255,255,255,0.16)",
          strokeWidth: 1.5,
        },
      })),
    [active, statuses]
  );

  return (
    <div className="relative h-full min-h-[320px] bg-[#07080c]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: FIT_PAD }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
        proOptions={{ hideAttribution: true }}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={{ type: "smoothstep" }}
        colorMode="dark"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1}
          color="rgba(255,255,255,0.06)"
        />
        <AgentMarker active={active} />
      </ReactFlow>
      {verdictReady ? (
        <PlayVerdict ticket={ticket} printCall={printCall} sending={sending} onSend={onSend} />
      ) : null}
      <StampRail stamps={stamps} />
      <p className="pointer-events-none absolute bottom-3 left-3 font-mono text-[10px] tracking-[0.22em] text-white/35">
        AGENT AUTHORED · NOT A BUILDER
      </p>
    </div>
  );
}
