"use client";

import { Background, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Building2, CalendarClock, GitCommitHorizontal, MessageSquareQuote, TriangleAlert } from "lucide-react";
import type { Account } from "@/lib/demo-data";

const kinds = {
  Account: { color: "var(--color-graph-account)", icon: Building2 },
  Opportunity: { color: "var(--color-graph-account)", icon: CalendarClock },
  Conversation: { color: "var(--color-graph-conversation)", icon: MessageSquareQuote },
  Signal: { color: "var(--color-graph-signal)", icon: TriangleAlert },
  Decision: { color: "var(--color-graph-decision)", icon: GitCommitHorizontal },
};

type GraphData = { title: string; kind: keyof typeof kinds; subtitle?: string };

function GraphNode({ data, selected }: NodeProps<Node<GraphData>>) {
  const { color, icon: Icon } = kinds[data.kind];
  return (
    <div className={`min-w-36 rounded-md bg-surface-elevated p-sm ring-1 ring-inset ${selected ? "ring-primary" : "ring-outline"}`}>
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <span className="label-caps flex items-center gap-xs" style={{ color }}>
        <Icon size={14} aria-hidden /> {data.kind}
      </span>
      <span className="mt-xs block text-label-md font-semibold text-on-surface">{data.title}</span>
      {data.subtitle && <span className="block text-label-sm text-on-surface-muted">{data.subtitle}</span>}
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  );
}

const nodeTypes = { evidence: GraphNode };

export function EvidenceGraph({
  account,
  selectedEvidence,
  onSelect,
}: {
  account: Account;
  selectedEvidence: string;
  onSelect: (id: string) => void;
}) {
  const nodes: Node<GraphData>[] = [
    { id: "account", type: "evidence", position: { x: 0, y: 100 }, data: { title: account.name, kind: "Account" } },
    { id: "opportunity", type: "evidence", position: { x: 240, y: 100 }, data: { title: "Renewal Q4", kind: "Opportunity" } },
    ...account.evidence.map((evidence, index) => ({
      id: evidence.id,
      type: "evidence",
      position: { x: 480, y: index * 100 },
      data: { title: evidence.label, kind: evidence.kind, subtitle: evidence.source },
      selected: evidence.id === selectedEvidence,
    })),
  ];

  const edges: Edge[] = [
    { id: "account-opportunity", source: "account", target: "opportunity", style: { stroke: "var(--color-primary)", strokeWidth: 2 } },
    ...account.evidence.map(evidence => {
      const active = evidence.id === selectedEvidence;
      return {
        id: `edge-${evidence.id}`,
        source: "opportunity",
        target: evidence.id,
        style: { stroke: active ? "var(--color-primary)" : "var(--color-outline-active)", strokeWidth: active ? 2 : 1 },
      };
    }),
  ];

  return (
    <div className="h-80 overflow-hidden rounded-md bg-neutral" aria-label="Evidence graph. The source quotes list below is the text alternative.">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        colorMode="dark"
        style={{ backgroundColor: "transparent" }}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        zoomOnScroll={false}
        preventScrolling={false}
        onNodeClick={(_, node) => account.evidence.some(evidence => evidence.id === node.id) && onSelect(node.id)}
      >
        <Background color="var(--color-outline)" gap={20} size={1} />
      </ReactFlow>
    </div>
  );
}
