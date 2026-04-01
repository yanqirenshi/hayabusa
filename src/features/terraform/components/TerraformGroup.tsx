import React from "react";
import { IDrawingNode } from "@/core/interfaces";

export default function TerraformGroup({ node, rootX, rootY, depth = 0 }: { node: IDrawingNode; rootX: number; rootY: number, depth?: number }) {
  // === Terraform Directory Node ===
  if (node.type === "terraform-dir") {
    return (
      <g transform={`translate(${rootX}, ${rootY})`}>
        <rect width={node.width} height={node.height} fill="#ffffff" stroke="#9ca3af" strokeWidth={depth === 0 ? 3 : 1} rx={4} ry={4} />
        <text x={10} y={20} fill="#374151" fontSize="13" fontWeight="bold" fontFamily="Arial, sans-serif">
          {node.label}/
        </text>
        {node.children && node.children.map((childNode, index) => (
          <TerraformGroup key={`${childNode.id}-${index}`} node={childNode} rootX={childNode.x} rootY={childNode.y} depth={depth + 1} />
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
          <TerraformGroup key={`${childNode.id}-${index}`} node={childNode} rootX={childNode.x} rootY={childNode.y} depth={depth + 1} />
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
          <TerraformGroup key={`${childNode.id}-${index}`} node={childNode} rootX={childNode.x} rootY={childNode.y} depth={depth + 1} />
        ))}
      </g>
    );
  }

  // === Terraform Variable / Output Box ===
  if (node.type === "tf-var" || node.type === "tf-out") {
    return (
      <g transform={`translate(${rootX}, ${rootY})`}>
        <rect width={node.width} height={node.height} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={1} />
        <text x={10} y={18} fill="#334155" fontSize="12" fontFamily="Arial, sans-serif">
          {node.label}
        </text>
      </g>
    );
  }

  // === Terraform Resource Box (3 cells: RSC | type | name) ===
  if (node.type === "tf-rsc") {
    // The label is passed as "type__name__typeWidth" from TerraformDrawing
    const parts = node.label.split("__");
    const rscType = parts[0] || "";
    const rscName = parts[1] || "";
    const typeWidth = parts[2] ? parseFloat(parts[2]) : 150;
    
    const tagWidth = 45;

    return (
      <g transform={`translate(${rootX}, ${rootY})`}>
        {/* Outer box */}
        <rect width={node.width} height={node.height} fill="#ffffff" stroke="#94a3b8" strokeWidth={1} />
        
        {/* RSC Tag Background (Optional slight shading) */}
        <rect width={tagWidth} height={node.height} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={1} />
        <text x={8} y={18} fill="#475569" fontSize="12" fontFamily="Arial, sans-serif">
          RSC
        </text>

        {/* Type Cell */}
        <rect x={tagWidth} y={0} width={typeWidth} height={node.height} fill="#ffffff" stroke="#94a3b8" strokeWidth={1} />
        <text x={tagWidth + 10} y={18} fill="#334155" fontSize="12" fontFamily="Arial, sans-serif">
          {rscType}
        </text>

        {/* Name Cell */}
        <text x={tagWidth + typeWidth + 10} y={18} fill="#334155" fontSize="12" fontFamily="Arial, sans-serif">
          {rscName}
        </text>
      </g>
    );
  }

  return null;
}
