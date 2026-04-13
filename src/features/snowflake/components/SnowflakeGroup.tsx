import React from "react";
import { IDrawingNode } from "@/core/interfaces";

// Recursive renderer for Snowflake nodes
const renderNode = (node: IDrawingNode, onNodeClick?: (node: IDrawingNode) => void) => {
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

  const isClickable = node.type === "item";

  return (
    <g 
      key={node.id} 
      transform={`translate(${node.x}, ${node.y})`}
      onClick={(e) => {
        if (isClickable && onNodeClick) {
          e.stopPropagation();
          onNodeClick(node);
        }
      }}
      style={{ cursor: isClickable ? "pointer" : "default" }}
    >
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
        onClick={(e) => {
          if (onNodeClick) {
            e.stopPropagation();
            onNodeClick(node);
          }
        }}
        style={{ cursor: "pointer", userSelect: "none" }}
      >
        {node.label}
      </text>

      {node.children && node.children.map((child) => renderNode(child, onNodeClick))}
    </g>
  );
};

interface SnowflakeGroupProps {
  nodes: IDrawingNode[];
  x?: number;
  y?: number;
  onNodeClick?: (node: IDrawingNode) => void;
}

/**
 * SnowflakeGroup
 * Receives the top level drawing nodes (database root) and recursively renders them
 */
export default function SnowflakeGroup({ nodes, x = 0, y = 0, onNodeClick }: SnowflakeGroupProps) {
  if (nodes.length === 0) return null;
  return (
    <g transform={`translate(${x}, ${y})`}>
      {nodes.map((node) => renderNode(node, onNodeClick))}
    </g>
  );
}
