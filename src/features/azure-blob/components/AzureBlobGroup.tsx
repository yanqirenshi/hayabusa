import React from "react";
import { IDrawingNode } from "@/core/interfaces";

const renderNode = (node: IDrawingNode, onNodeClick?: (node: IDrawingNode | null) => void) => {
  let textX = 10;
  let textY = 20;
  let fontSize = "12px";
  let textAnchor: "start" | "middle" | "end" = "start";
  
  // Custom headers based on type
  if (node.type === "azure-tenant") {
    textX = 45;
    textY = 32;
    fontSize = "20px";
  } else if (node.type === "azure-entra-users-container" || node.type === "azure-entra-groups-container" || node.type === "azure-entra-apps-container" || node.type === "azure-devops-container") {
    textX = node.width / 2;
    textY = 20;
    fontSize = "14px";
    textAnchor = "middle";
  } else if (node.type === "azure-management-group") {
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
  } else if (node.type === "azure-blob-account" || node.type === "azure-acr" || node.type === "azure-batch") {
    textX = node.width / 2;
    textY = 25;
    fontSize = "16px";
    textAnchor = "middle";
  } else if (node.type === "azure-blob-container") {
    textX = node.width / 2;
    textY = 20;
    fontSize = "14px";
    textAnchor = "middle";
  } else if (node.type === "azure-blob-directory" || node.type === "azure-blob-item" || node.type === "azure-entra-user" || node.type === "azure-entra-group" || node.type === "azure-entra-app" || node.type === "azure-devops-repo" || node.type === "azure-devops-pipeline") {
    textX = 30; // Shift right for the icon
    textY = 22;
    fontSize = "13px";
    textAnchor = "start";
  }

  // Icon handling
  const isDir = node.type === "azure-blob-directory";
  const isBlob = node.type === "azure-blob-item";
  const isUser = node.type === "azure-entra-user";
  const isGroup = node.type === "azure-entra-group";
  const isApp = node.type === "azure-entra-app";
  const isRepo = node.type === "azure-devops-repo" || node.type === "azure-container-repository";
  const isPipe = node.type === "azure-devops-pipeline" || node.type === "azure-adf-pipeline";
  const isItemLike = isDir || isBlob || isUser || isGroup || isApp || isRepo || isPipe;

  // Box styles based on type
  let fill = "transparent";
  let stroke = "#dddddd";
  let strokeWidth = 1.5;
  let rx = 0;
  let dasharray = "none";

  if (node.type === "azure-tenant") {
    fill = "#ffffff";
    stroke = "#0078D4"; // Azure Blue
    strokeWidth = 3;
    rx = 12;
  } else if (node.type === "azure-entra-users-container" || node.type === "azure-entra-groups-container" || node.type === "azure-entra-apps-container" || node.type === "azure-devops-container") {
    fill = "#f8fafc";
    stroke = "#cbd5e1";
    strokeWidth = 1.5;
    dasharray = "4,4";
    rx = 4;
  } else if (node.type === "azure-management-group") {
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
  } else if (node.type === "azure-blob-account" || node.type === "azure-acr" || node.type === "azure-batch") {
    fill = "#ffffff";
    stroke = "#cbd5e1"; // Slate 300
    strokeWidth = 2;
    rx = 2;
  } else if (node.type === "azure-blob-container") {
    fill = "#ffffff";
    stroke = "#e2e8f0"; // Slate 200
  } else if (isItemLike) {
    rx = 4;
    stroke = "#cccccc";
    fill = "#ffffff";
  }

  const isClickableBox = node.type !== "azure-blob-container" && node.type !== "azure-blob-account" && node.type !== "azure-entra-users-container" && node.type !== "azure-entra-groups-container" && node.type !== "azure-entra-apps-container" && node.type !== "azure-devops-container";

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
      {isUser && <text x={8} y={22} fontSize="14px" fill="#64748B" style={{ pointerEvents: "none" }}>👤</text>}
      {isGroup && <text x={8} y={22} fontSize="14px" fill="#64748B" style={{ pointerEvents: "none" }}>👥</text>}
      {isApp && <text x={8} y={22} fontSize="14px" fill="#64748B" style={{ pointerEvents: "none" }}>📦</text>}
      {isRepo && <text x={8} y={22} fontSize="14px" fill="#64748B" style={{ pointerEvents: "none" }}>🌿</text>}
      {isPipe && <text x={8} y={22} fontSize="14px" fill="#64748B" style={{ pointerEvents: "none" }}>🚀</text>}
      {node.type === "azure-tenant" && <text x={15} y={32} fontSize="20px" fill="#0078D4" style={{ pointerEvents: "none" }}>🆔</text>}
      {node.type === "azure-management-group" && <text x={15} y={30} fontSize="18px" fill="#475569" style={{ pointerEvents: "none" }}>🏢</text>}
      {node.type === "azure-subscription" && <text x={15} y={30} fontSize="18px" fill="#D97706" style={{ pointerEvents: "none" }}>🔑</text>}
      {node.type === "azure-resource-group" && <text x={15} y={30} fontSize="18px" fill="#2563EB" style={{ pointerEvents: "none" }}>🚧</text>}

      <text
        x={textX}
        y={textY}
        fontFamily="Inter, Arial, sans-serif"
        fontSize={fontSize}
        fill="#333"
        fontWeight={node.type.startsWith("azure-blob-") && !isItemLike ? "normal" : "bold"}
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

      {/* Azure Header Logos */}
      {node.type === "azure-blob-account" && (
        <g>
          <rect x={0} y={0} width={40} height={40} fill="#0072C6" />
          <text x={20} y={25} textAnchor="middle" fill="white" fontSize="20px">☁</text>
          <text x={45} y={15} fontSize="10px" fill="#64748B" fontWeight="normal">Storage Account</text>
        </g>
      )}
      {node.type === "azure-acr" && (
        <g>
          <rect x={0} y={0} width={40} height={40} fill="#0078D4" />
          <text x={20} y={25} textAnchor="middle" fill="white" fontSize="20px">📦</text>
          <text x={45} y={15} fontSize="10px" fill="#64748B" fontWeight="normal">Container Registry</text>
        </g>
      )}
      {node.type === "azure-batch" && (
        <g>
          <rect x={0} y={0} width={40} height={40} fill="#0078D4" />
          <text x={20} y={25} textAnchor="middle" fill="white" fontSize="20px">🧮</text>
          <text x={45} y={15} fontSize="10px" fill="#64748B" fontWeight="normal">Batch Account</text>
        </g>
      )}
      {node.type === "azure-adf" && (
        <g>
          <rect x={0} y={0} width={40} height={40} fill="#F2AB27" />
          <text x={20} y={25} textAnchor="middle" fill="white" fontSize="20px">🏭</text>
          <text x={45} y={15} fontSize="10px" fill="#64748B" fontWeight="normal">Data Factory</text>
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
