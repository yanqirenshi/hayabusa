import React from "react";
import { IDrawingNode } from "@/core/interfaces";
import BaseBoxNode from "@/components/BaseBoxNode";

// Recursive renderer for Snowflake nodes
const renderNode = (node: IDrawingNode, onNodeClick?: (node: IDrawingNode) => void) => {
  const icon = (node as any).icon || "";
  const subtitle = (node as any).subtitle || "";
  const strokeWidth = (node as any).strokeWidth || 1.5;

  const isClickable = node.type === "item";

  return (
    <BaseBoxNode 
      key={node.id} 
      node={node} 
      icon={icon} 
      subtitle={subtitle} 
      onNodeClick={isClickable ? onNodeClick : undefined}
      strokeWidth={strokeWidth}
    >
      {node.children && node.children.map((child) => renderNode(child, onNodeClick))}
    </BaseBoxNode>
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
