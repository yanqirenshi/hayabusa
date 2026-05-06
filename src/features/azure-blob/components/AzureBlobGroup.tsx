import React from "react";
import { IDrawingNode } from "@/core/interfaces";
import BaseBoxNode from "@/components/BaseBoxNode";

const renderNode = (node: IDrawingNode, onNodeClick?: (node: IDrawingNode | null) => void) => {
  const icon = (node as any).icon || "";
  const subtitle = (node as any).subtitle || "";
  const strokeWidth = (node as any).strokeWidth || 1.5;

  const isClickableBox = node.type !== "azure-blob-container" && node.type !== "azure-blob-account" && node.type !== "azure-entra-users-container" && node.type !== "azure-entra-groups-container" && node.type !== "azure-entra-apps-container" && node.type !== "azure-devops-container";

  return (
    <BaseBoxNode 
      key={node.id} 
      node={node} 
      icon={icon} 
      subtitle={subtitle} 
      strokeWidth={strokeWidth}
      onNodeClick={isClickableBox ? onNodeClick as any : undefined}
    >
      {node.children && node.children.map((child) => renderNode(child, onNodeClick))}
    </BaseBoxNode>
  );
};

interface AzureBlobGroupProps {
  nodes: IDrawingNode[];
  x?: number;
  y?: number;
  onNodeClick?: (node: IDrawingNode | null) => void;
}

export default function AzureBlobGroup({ nodes, x = 0, y = 0, onNodeClick }: AzureBlobGroupProps) {
  if (nodes.length === 0) return null;
  return (
    <g transform={`translate(${x}, ${y})`}>
      {nodes.map((node) => renderNode(node, onNodeClick))}
    </g>
  );
}
