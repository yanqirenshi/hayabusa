import React from "react";
import { IDrawingNode } from "@/core/interfaces";

export default function TerraformGroup({ node, rootX, rootY, depth = 0, onNodeClick }: { node: IDrawingNode; rootX: number; rootY: number, depth?: number, onNodeClick?: (node: IDrawingNode) => void }) {
  // === Terraform Directory Node ===
  if (node.type === "terraform-dir") {
    return (
      <g transform={`translate(${rootX}, ${rootY})`}>
        <rect width={node.width} height={node.height} fill="#ffffff" stroke="#9ca3af" strokeWidth={depth === 0 ? 3 : 1} rx={4} ry={4} />
        {depth === 0 ? (
          <g>
            <path 
              d="M0 0l2.2 1.3v5.2L0 5.2V0zm2.6 1.6l2.2 1.3v5.2l-2.2-1.3V1.6zM0 6.6l2.2 1.3v5.2L0 11.8V6.6zm2.6 1.6l2.2 1.3v5.2l-2.2-1.3V8.2z" 
              fill="#844FBA" 
              transform="translate(10, 7) scale(1.6)"
            />
            <text x={35} y={20} fill="#374151" fontSize="14" fontWeight="bold" fontFamily="Inter, Arial, sans-serif">
              Terraform
            </text>
          </g>
        ) : (
          <text x={10} y={20} fill="#374151" fontSize="13" fontWeight="bold" fontFamily="Arial, sans-serif">
            {node.label}/
          </text>
        )}
        {node.children && node.children.map((childNode, index) => (
          <TerraformGroup key={`${childNode.id}-${index}`} node={childNode} rootX={childNode.x} rootY={childNode.y} depth={depth + 1} onNodeClick={onNodeClick} />
        ))}
      </g>
    );
  }

  // === Terraform Column (Input / Process / Output) ===
  if (node.type === "tf-column") {
    return (
      <g transform={`translate(${rootX}, ${rootY})`}>
        {/* No wrapping border for columns, just label */}
        <text x={0} y={15} fill="#4b5563" fontSize="13" fontWeight="bold" fontFamily="Arial, sans-serif">
          {node.label}
        </text>
        {node.children && node.children.map((childNode, index) => (
          <TerraformGroup key={`${childNode.id}-${index}`} node={childNode} rootX={childNode.x} rootY={childNode.y} depth={depth + 1} onNodeClick={onNodeClick} />
        ))}
      </g>
    );
  }

  // === Terraform File (variables.tf, main.tf, etc.) ===
  if (node.type === "tf-file") {
    return (
      <g transform={`translate(${rootX}, ${rootY})`}>
        {/* File Container Border */}
        <rect width={node.width} height={node.height} fill="#ffffff" stroke="#cbd5e1" strokeWidth={1} />
        {/* File Name Label */}
        <text x={10} y={20} fill="#1f2937" fontSize="12" fontWeight="bold" fontFamily="Arial, sans-serif">
          {node.label}
        </text>
        {node.children && node.children.map((childNode, index) => (
          <TerraformGroup key={`${childNode.id}-${index}`} node={childNode} rootX={childNode.x} rootY={childNode.y} depth={depth + 1} onNodeClick={onNodeClick} />
        ))}
      </g>
    );
  }

  // === Terraform Unified Block List Box ===
  if (node.type === "tf-block-list") {
    // The label is passed as "tag__type__name__typeWidth"
    const parts = node.label.split("__");
    const activeTag = parts[0] || "UNK";
    const rscType = parts[1] || "";
    const rscName = parts[2] || "";
    const typeWidth = parts[3] ? parseFloat(parts[3]) : 150;
    
    const tagWidth = 45;

    return (
      <g 
        transform={`translate(${rootX}, ${rootY})`} 
        onClick={() => onNodeClick && onNodeClick(node)}
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

  return null;
}
