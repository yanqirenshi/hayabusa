"use client";

import React, { useState, useEffect } from "react";
import { RoleGraphPOJO } from "../data/SnowflakeRoleData";
import { SnowflakeRoleDrawing } from "../drawing/SnowflakeRoleDrawing";
import { IDrawingEdge, IDrawingNode } from "@/core/interfaces";

// ---- Tier visual styles (nodes only) ----
const TIER_STYLES: Record<
  string,
  { nodeBg: string; nodeBorder: string; nodeText: string }
> = {
  "role-band-system":     { nodeBg: "#f1f5f9", nodeBorder: "#94a3b8", nodeText: "#1e293b" },
  "role-band-functional": { nodeBg: "#dbeafe", nodeBorder: "#60a5fa", nodeText: "#1e40af" },
  "role-band-access":     { nodeBg: "#dcfce7", nodeBorder: "#4ade80", nodeText: "#166534" },
  "role-band-custom":     { nodeBg: "#f3e8ff", nodeBorder: "#c084fc", nodeText: "#7e22ce" },
};

const EDGE_COLOR = "#94a3b8";
const EDGE_WIDTH = 1.5;

// ---- RoleNode ----
function RoleNode({ node }: { node: IDrawingNode }) {
  const bandType = node.type.replace("role-node-", "role-band-");
  const style = TIER_STYLES[bandType] ?? TIER_STYLES["role-band-custom"];
  return (
    <g>
      <rect
        x={node.x}
        y={node.y}
        width={node.width}
        height={node.height}
        rx={6}
        ry={6}
        fill={style.nodeBg}
        stroke={style.nodeBorder}
        strokeWidth={1.5}
      />
      <text
        x={node.x + node.width / 2}
        y={node.y + node.height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={style.nodeText}
        fontSize={11}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="500"
      >
        {node.label}
      </text>
    </g>
  );
}

// ---- EdgeGroup: draws a forked bracket from one parent to N children ----
// Pattern:
//   1. Vertical stem: parent center bottom → midY
//   2. Horizontal bracket: min(parentCenterX ∪ childCenterXs) → max(...)  at midY
//   3. Vertical stub: each child center at midY → child top
function EdgeGroup({
  fromId,
  edges,
  nodeMap,
}: {
  fromId: string;
  edges: IDrawingEdge[];
  nodeMap: Map<string, IDrawingNode>;
}) {
  const from = nodeMap.get(fromId);
  if (!from) return null;

  const tos = edges
    .map(e => nodeMap.get(e.toNodeId))
    .filter((n): n is IDrawingNode => !!n);
  if (tos.length === 0) return null;

  const x1  = from.x + from.width / 2;       // parent center X
  const y1  = from.y + from.height;           // parent bottom Y
  const y2  = Math.min(...tos.map(t => t.y)); // topmost child Y
  const midY = (y1 + y2) / 2;

  const childXs = tos.map(t => t.x + t.width / 2);

  // Bracket spans from min to max including the parent stem attachment point
  const allXs = [x1, ...childXs];
  const minX  = Math.min(...allXs);
  const maxX  = Math.max(...allXs);

  return (
    <g stroke={EDGE_COLOR} strokeWidth={EDGE_WIDTH} fill="none" strokeLinecap="round">
      {/* 1. Vertical stem: parent center → midY */}
      <line x1={x1} y1={y1} x2={x1} y2={midY} />

      {/* 2. Horizontal bracket at midY (only if bracket has width) */}
      {maxX > minX && <line x1={minX} y1={midY} x2={maxX} y2={midY} />}

      {/* 3. Vertical stub: each child center midY → child top */}
      {tos.map((to, i) => {
        const cx = to.x + to.width / 2;
        return <line key={i} x1={cx} y1={midY} x2={cx} y2={to.y} />;
      })}
    </g>
  );
}

// ---- Main Renderer ----

export default function SnowflakeRoleRenderer({
  roleData,
  rootX = 0,
  rootY = 0,
}: {
  roleData: RoleGraphPOJO;
  rootX?: number;
  rootY?: number;
}) {
  const [drawing, setDrawing] = useState<SnowflakeRoleDrawing | null>(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.font = "500 11px Inter, Arial, sans-serif";

    const measure = (text: string) =>
      ctx ? ctx.measureText(text).width : text.length * 8.5;

    setDrawing(new SnowflakeRoleDrawing(roleData, measure));
  }, [roleData]);

  if (!drawing) return null;

  const roleNodes = drawing.nodes.filter(n => n.type.startsWith("role-node-"));

  // Build a lookup map for edge rendering
  const nodeMap = new Map<string, IDrawingNode>(
    drawing.nodes.map(n => [n.id, n])
  );

  // Group edges by fromNodeId → render as forked bracket per parent
  const edgeGroups = new Map<string, IDrawingEdge[]>();
  for (const edge of drawing.edges ?? []) {
    if (!edgeGroups.has(edge.fromNodeId)) edgeGroups.set(edge.fromNodeId, []);
    edgeGroups.get(edge.fromNodeId)!.push(edge);
  }

  return (
    <g transform={`translate(${rootX}, ${rootY})`}>
      {/* 1. Edge groups (behind nodes) */}
      {Array.from(edgeGroups.entries()).map(([fromId, edges]) => (
        <EdgeGroup key={fromId} fromId={fromId} edges={edges} nodeMap={nodeMap} />
      ))}

      {/* 2. Role nodes */}
      {roleNodes.map(n => <RoleNode key={n.id} node={n} />)}
    </g>
  );
}
