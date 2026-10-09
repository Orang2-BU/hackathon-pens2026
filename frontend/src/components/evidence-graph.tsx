"use client";
import { useMemo, useState } from "react";
import { Background, Controls, Position, ReactFlow, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Graph } from "@/lib/workspace";

export function EvidenceGraph({ graph, onExplore }: { graph: Graph; onExplore?: (key: string) => void }) {
  const [selected, setSelected] = useState(graph.rootId);
  const [limit, setLimit] = useState(12);
  const visible = graph.nodes.slice(0, limit);
  const { nodes, edges } = useMemo(() => {
    const ids = new Set(visible.map(n => n.id));
    const levels = new Map([[graph.rootId, 0]]);
    for (let pass = 0; pass < 4; pass++) for (const edge of graph.edges) {
      if (levels.has(edge.source) && !levels.has(edge.target)) levels.set(edge.target, (levels.get(edge.source) ?? 0) + 1);
      if (levels.has(edge.target) && !levels.has(edge.source)) levels.set(edge.source, (levels.get(edge.target) ?? 0) + 1);
    }
    const rows = new Map<number, number>();
    const nodes: Node[] = visible.map(node => {
      const level = levels.get(node.id) ?? 4, row = rows.get(level) ?? 0; rows.set(level, row + 1);
      return { id: node.id, sourcePosition: Position.Right, targetPosition: Position.Left, position: { x: level * 300, y: row * 110 }, data: { label: `${node.type.toUpperCase()} · ${node.key}\n${node.label}` }, selected: node.id === selected,
        style: { background: "var(--color-surface-elevated)", color: "var(--color-on-surface)", border: `1px solid var(--color-${node.id === selected ? "primary" : "outline-active"})`, borderRadius: "var(--radius-md)", width: 220, whiteSpace: "pre-wrap" } };
    });
    const edges: Edge[] = graph.edges.filter(e => ids.has(e.source) && ids.has(e.target)).map(edge => ({ id: edge.id, source: edge.source, target: edge.target, label: edge.type.replaceAll("_", " "), style: { stroke: edge.relationKind === "hard" ? "var(--color-primary)" : "var(--color-warning)", strokeDasharray: edge.relationKind === "derived" ? "5 5" : undefined }, labelStyle: { fill: "var(--color-on-surface)" }, labelBgStyle: { fill: "var(--color-surface)" } }));
    return { nodes, edges };
  }, [visible, graph, selected]);
  const node = graph.nodes.find(n => n.id === selected);
  const relations = graph.edges.filter(e => e.source === selected || e.target === selected);
  const sourceIds = new Set(relations.flatMap(e => e.sourceRecordIds));
  return <div className="flex min-w-0 flex-col gap-md">
    <p className="text-label-sm text-on-surface-muted">Solid: explicit source link. Dashed: derived candidate. Snapshot {graph.businessAsOf}; recorded {graph.recordedAsOf.slice(0, 10)}.</p>
    <div className="h-96 overflow-hidden rounded-md bg-neutral"><ReactFlow nodes={nodes} edges={edges} onNodeClick={(_, n) => setSelected(n.id)} onEdgeClick={(_, e) => setSelected(e.source)} nodesDraggable={false} nodesConnectable={false} fitView minZoom={0.2}><Background color="var(--color-outline)" /><Controls showInteractive={false} /></ReactFlow></div>
    {limit < graph.nodes.length && <button className="btn btn-secondary self-start" onClick={() => setLimit(n => n + 12)}>Show more connections ({graph.nodes.length - limit})</button>}
    {graph.truncated && <p className="text-label-sm text-warning">This view is bounded. Open a specific node to continue investigating.</p>}
    <details className="rounded-md bg-neutral p-sm"><summary className="cursor-pointer text-label-md">Accessible node list</summary><ul className="mt-sm grid gap-xs md:grid-cols-2">{graph.nodes.map(n => <li key={n.id}><button className="min-h-11 w-full text-left text-body-sm hover:text-primary" aria-pressed={selected === n.id} onClick={() => setSelected(n.id)}>{n.type} · {n.key} · {n.label}</button></li>)}</ul></details>
    {node && <section className="rounded-md bg-surface-elevated p-md"><h3 className="card-title">{node.label}</h3><p className="mt-xs text-label-sm text-on-surface-muted">{node.type} · {node.key}</p><dl className="mt-sm grid gap-xs">{Object.entries(node.details).map(([k,v]) => <div key={k} className="text-body-sm"><dt className="inline text-on-surface-muted">{k}: </dt><dd className="inline">{v}</dd></div>)}</dl>{onExplore && <button className="btn btn-secondary mt-sm" onClick={() => onExplore(node.key)}>Explore from this node</button>}
      <ul className="mt-md flex flex-col gap-sm">{relations.map(e => <li key={e.id} className="border-t border-outline pt-sm text-body-sm"><p>{graph.nodes.find(n => n.id === e.source)?.key} → {e.type.replaceAll("_", " ")} → {graph.nodes.find(n => n.id === e.target)?.key}</p><p className="mt-xs text-label-sm text-on-surface-muted">{e.relationKind} · {e.status} · {e.validFrom ?? "Snapshot only"}{e.validTo && ` – ${e.validTo}`}</p>{e.reason && <p className="mt-xs text-label-sm text-warning">{e.reason}</p>}</li>)}</ul>
    </section>}
    <section><h3 className="card-title">Source evidence</h3><ul className="mt-sm flex flex-col gap-sm">{graph.citations.filter(c => sourceIds.has(c.id)).map(c => <li key={c.id} className="rounded-md bg-neutral p-md"><p className="break-all text-label-sm">{c.group} · {c.file} · {c.recordId}</p><p className="mt-xs text-label-sm text-on-surface-muted">Event: {c.occurredAt?.slice(0,10) ?? "Unknown / snapshot only"} · Recorded: {c.recordedAt.slice(0,10)}</p>{c.quote ? <blockquote className="mt-sm whitespace-pre-wrap text-body-sm">{c.quote}</blockquote> : <p className="mt-xs text-label-sm text-on-surface-muted">Structured source record; no verbatim text field is available.</p>}<details className="mt-sm text-label-sm text-on-surface-muted"><summary>Provenance</summary><p className="break-all">{c.recordHash} · {c.field ?? "Structured fields"}{c.span && ` · UTF-16 [${c.span.start}, ${c.span.end})`}</p></details></li>)}</ul></section>
  </div>;
}
