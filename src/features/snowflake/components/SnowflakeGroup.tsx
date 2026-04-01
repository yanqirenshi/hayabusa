import React from "react";
import { IDrawingNode } from "@/core/interfaces";

// Recursive renderer for Snowflake nodes
const renderNode = (node: IDrawingNode) => {
  let textX = 10;
  let textY = 20;
  let fontSize = "12px";
  let textAnchor: "start" | "middle" | "end" = "start";
  
  if (node.type === "database") {
    textX = node.width / 2;
    textY = 25;
    fontSize = "16px";
    textAnchor = "middle";
  } else if (node.type === "schema") {
    textX = node.width / 2;
    textY = 20;
    fontSize = "14px";
    textAnchor = "middle";
  } else if (node.type === "group" || node.type === "item") {
    textX = 10;
    textY = node.type === "group" ? 20 : 22;
    fontSize = "13px";
    textAnchor = "start";
  }

  return (
    <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
      <rect
        width={node.width}
        height={node.height}
        rx={node.type === "item" ? 0 : 0}
        fill={node.type === "database" || node.type === "schema" ? "#fff" : "transparent"}
        stroke={node.type === "item" ? "#cccccc" : "#dddddd"}
        strokeWidth={node.type === "database" ? 2 : 1.5}
      />
      <text
        x={textX}
        y={textY}
        fontFamily="Arial, sans-serif"
        fontSize={fontSize}
        fill="#333"
        textAnchor={textAnchor}
      >
        {node.label}
      </text>

      {/* Snowflake Logo on Database root */}
      {node.type === "database" && (
        <>
          <rect x={0} y={0} width={40} height={40} fill="#29B5E8" />
          <text x={20} y={25} textAnchor="middle" fill="white" fontSize="20px">❄</text>
        </>
      )}

      {node.children && node.children.map((child) => renderNode(child))}
    </g>
  );
};

interface SnowflakeGroupProps {
  nodes: IDrawingNode[];
  x?: number;
  y?: number;
}

/**
 * SnowflakeGroup
 * Receives the top level drawing nodes (database root) and recursively renders them
 */
export default function SnowflakeGroup({ nodes, x = 0, y = 0 }: SnowflakeGroupProps) {
  if (nodes.length === 0) return null;
  return (
    <g transform={`translate(${x}, ${y})`}>
      {nodes.map((node) => renderNode(node))}
    </g>
  );
}
