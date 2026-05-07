import React from "react";
import { IDrawingNode } from "@/core/interfaces";
import BaseBoxNode from "@/components/BaseBoxNode";

export default function TerraformGroup({ node, rootX, rootY, depth = 0, onNodeClick }: { node: IDrawingNode; rootX: number; rootY: number, depth?: number, onNodeClick?: (node: IDrawingNode) => void }) {
  
  const icon = (node as any).icon || "";
  const subtitle = (node as any).subtitle || "";
  const strokeWidth = (node as any).strokeWidth || 1.5;
  const label = node.label;

  // === Terraform Unified Block List Box (Restored Original Rendering) ===
  if (node.type === "tf-block-list") {
    const parts = node.label.split("__");
    const activeTag = parts[0] || "UNK";
    const rscType = parts[1] || "";
    const rscName = parts[2] || "";
    // Note: The typeWidth might be passed in the label, or we default it.
    // In TerraformDrawing it passes maxTypeWidth as parts[3]
    const typeWidth = parts[3] ? parseFloat(parts[3]) : 150;
    const tagWidth = 45;

    return (
      <g 
        key={node.id}
        transform={`translate(${rootX}, ${rootY})`} 
        onClick={(e) => {
          e.stopPropagation();
          onNodeClick && onNodeClick(node);
        }}
        style={{ cursor: "pointer" }}
      >
        {/* Outer box */}
        <rect width={node.width} height={node.height} fill="#ffffff" stroke="#94a3b8" strokeWidth={1} />
        
        {/* Tag Background */}
        <rect width={tagWidth} height={node.height} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={1} />
        <text x={8} y={18} fill="#475569" fontSize="12" fontFamily="Arial, sans-serif">
          {activeTag}
        </text>

        {rscType ? (
          <>
            {/* Type Cell (Middle) */}
            <rect x={tagWidth} y={0} width={typeWidth} height={node.height} fill="#ffffff" stroke="#94a3b8" strokeWidth={1} />
            <text x={tagWidth + 10} y={18} fill="#334155" fontSize="12" fontFamily="Arial, sans-serif">
              {rscType}
            </text>

            {/* Name Cell (Right) */}
            <text x={tagWidth + typeWidth + 10} y={18} fill="#334155" fontSize="12" fontFamily="Arial, sans-serif">
              {rscName}
            </text>
          </>
        ) : (
          <>
            {/* Name Cell only (No Middle Type cell) */}
            <text x={tagWidth + 10} y={18} fill="#334155" fontSize="12" fontFamily="Arial, sans-serif">
              {rscName}
            </text>
          </>
        )}
      </g>
    );
  }

  // BaseBoxNode properties for other types

  return (
    <BaseBoxNode 
      key={node.id} 
      node={{ ...node, label }} 
      icon={icon} 
      subtitle={subtitle} 
      onNodeClick={onNodeClick}
      strokeWidth={strokeWidth}
    >
      {node.children && node.children.map((childNode, index) => (
        <TerraformGroup 
          key={`${childNode.id}-${index}`} 
          node={childNode} 
          rootX={childNode.x} 
          rootY={childNode.y} 
          depth={depth + 1} 
          onNodeClick={onNodeClick} 
        />
      ))}
    </BaseBoxNode>
  );
}
