"use client";

import { Background, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Building2, TriangleAlert } from "lucide-react";
import { factorWeight, type Account, type RiskFactor } from "@/lib/accounts";

const kinds = {
  Account: { color: "var(--color-graph-account)", icon: Building2 },
  Factor: { color: "var(--color-graph-signal)", icon: TriangleAlert },
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
  selectedFactor,
  onSelect,
}: {
  account: Account;
  selectedFactor: RiskFactor | undefined;
  onSelect: (factor: RiskFactor) => void;
}) {
  const nodes: Node<GraphData>[] = [
    { id: "account", type: "evidence", position: { x: 0, y: ((account.factors.length - 1) * 90) / 2 }, data: { title: account.name, kind: "Account", subtitle: account.id } },
    ...account.factors.map((factor, index) => ({
      id: factor,
      type: "evidence",
      position: { x: 280, y: index * 90 },
      data: { title: factor, kind: "Factor" as const, subtitle: `${account.factorScores[factor]} of 100 · weight ${factorWeight[factor]}%` },
      selected: factor === selectedFactor,
    })),
  ];

  const edges: Edge[] = account.factors.map(factor => {
    const active = factor === selectedFactor;
    return {
      id: `edge-${factor}`,
      source: "account",
      target: factor,
      style: { stroke: active ? "var(--color-primary)" : "var(--color-outline-active)", strokeWidth: active ? 2 : 1 },
    };
  });

  return (
    <div className="h-80 overflow-hidden rounded-md bg-neutral" aria-label="Factor graph. The factor list beside it is the text alternative.">
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
        onNodeClick={(_, node) => {
          const factor = account.factors.find(item => item === node.id);
          if (factor) onSelect(factor);
        }}
      >
        <Background color="var(--color-outline)" gap={20} size={1} />
      </ReactFlow>
    </div>
  );
}
