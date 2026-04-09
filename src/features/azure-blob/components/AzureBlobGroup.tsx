import React from "react";
import { IDrawingNode } from "@/core/interfaces";

const renderNode = (node: IDrawingNode, onNodeClick?: (node: IDrawingNode | null) => void) => {
  let textX = 10;
  let textY = 20;
  let fontSize = "12px";
  let textAnchor: "start" | "middle" | "end" = "start";
  
  // Custom headers based on type
  if (node.type === "azure-management-group") {
    textX = 45;
    textY = 30;
    fontSize = "18px";
  } else if (node.type === "azure-subscription") {
    textX = 45;
    textY = 30;
    fontSize = "16px";
  } else if (node.type === "azure-resource-group") {
    textX = 45;
    textY = 30;
    fontSize = "14px";
  } else if (node.type === "azure-blob-account") {
    textX = node.width / 2;
    textY = 25;
    fontSize = "16px";
    textAnchor = "middle";
  } else if (node.type === "azure-blob-container") {
    textX = node.width / 2;
    textY = 20;
    fontSize = "14px";
    textAnchor = "middle";
  } else if (node.type === "azure-blob-directory" || node.type === "azure-blob-item") {
    textX = 25; // Shift right for the icon
    textY = 22;
    fontSize = "13px";
    textAnchor = "start";
  }

  // Icon handling for folder/file
  const isDir = node.type === "azure-blob-directory";
  const isBlob = node.type === "azure-blob-item";

  // Box styles based on type
  let fill = "transparent";
  let stroke = "#dddddd";
  let strokeWidth = 1.5;
  let rx = 0;
  let dasharray = "none";

  if (node.type === "azure-management-group") {
    fill = "#f8fafc";
    stroke = "#94a3b8"; // Slate 400
    strokeWidth = 2;
    rx = 8;
  } else if (node.type === "azure-subscription") {
    fill = "#f1f5f9"; // Slate 100
    stroke = "#fbbf24"; // Amber 400 (Subscription key icon color approximation)
    strokeWidth = 2;
    rx = 6;
  } else if (node.type === "azure-resource-group") {
    fill = "#ffffff";
    stroke = "#3b82f6"; // Blue 500
    strokeWidth = 2;
    dasharray = "4,4";
    rx = 4;
  } else if (node.type === "azure-blob-account") {
    fill = "#ffffff";
    stroke = "#cbd5e1"; // Slate 300
    strokeWidth = 2;
    rx = 2;
  } else if (node.type === "azure-blob-container") {
    fill = "#ffffff";
    stroke = "#e2e8f0"; // Slate 200
  } else if (isDir || isBlob) {
    rx = 4;
    stroke = "#cccccc";
  }

  const isClickableBox = node.type !== "azure-blob-container" && node.type !== "azure-blob-account";

  return (
    <g 
      key={node.id} 
      transform={`translate(${node.x}, ${node.y})`}
    >
      <rect
        width={node.width}
        height={node.height}
        rx={rx}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={dasharray}
        onClick={(e) => {
          if (isClickableBox && onNodeClick) {
            e.stopPropagation();
            onNodeClick(node);
          }
        }}
        style={{ cursor: isClickableBox ? "pointer" : "default" }}
      />

      {/* Type Specific Icons */}
      {isDir && <text x={8} y={22} fontSize="14px" fill="#FBBF24" style={{ pointerEvents: "none" }}>📁</text>}
      {isBlob && <text x={8} y={22} fontSize="14px" fill="#9CA3AF" style={{ pointerEvents: "none" }}>📄</text>}
      {node.type === "azure-management-group" && <text x={15} y={30} fontSize="18px" fill="#475569" style={{ pointerEvents: "none" }}>🏢</text>}
      {node.type === "azure-subscription" && <text x={15} y={30} fontSize="18px" fill="#D97706" style={{ pointerEvents: "none" }}>🔑</text>}
      {node.type === "azure-resource-group" && <text x={15} y={30} fontSize="18px" fill="#2563EB" style={{ pointerEvents: "none" }}>📦</text>}

      <text
        x={textX}
        y={textY}
        fontFamily="Inter, Arial, sans-serif"
        fontSize={fontSize}
        fill="#333"
        fontWeight={node.type.startsWith("azure-blob-") && !isDir && !isBlob ? "normal" : "bold"}
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

      {/* Azure Header Logo for Account */}
      {node.type === "azure-blob-account" && (
        <g>
          <rect x={0} y={0} width={40} height={40} fill="#0072C6" />
          <text x={20} y={25} textAnchor="middle" fill="white" fontSize="20px">☁</text>
        </g>
      )}

      {node.children && node.children.map((child) => renderNode(child, onNodeClick))}
    </g>
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
