import React from "react";
import { IDrawingNode } from "@/core/interfaces";

export interface BaseBoxNodeProps {
  node: IDrawingNode;
  strokeColor?: string;
  strokeWidth?: number;
  icon?: string;
  subtitle?: string;
  onNodeClick?: (node: IDrawingNode) => void;
  children?: React.ReactNode;
}

export default function BaseBoxNode({ 
  node, 
  strokeColor = "#94a3b8", 
  strokeWidth = 1.5, 
  icon,
  subtitle,
  onNodeClick,
  children
}: BaseBoxNodeProps) {
  const iconWidth = 40;
  
  const displayIcon = icon || node.icon;
  const displaySubtitle = subtitle || node.subtitle;
  
  return (
    <g 
      transform={`translate(${node.x}, ${node.y})`}
      onClick={(e) => {
        if (onNodeClick) {
          e.stopPropagation();
          onNodeClick(node);
        }
      }}
      style={{ cursor: onNodeClick ? "pointer" : "default" }}
    >
      {/* Background and Border */}
      <rect
        width={node.width}
        height={node.height}
        fill="#ffffff"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      
      {/* Left Icon Block */}
      <rect
        width={iconWidth}
        height={iconWidth}
        fill="#efefef"
      />
      
      {/* Icon Text */}
      {displayIcon && (
        <text 
          x={iconWidth / 2} 
          y={iconWidth / 2} 
          fill="#475569" 
          fontSize="18px" 
          textAnchor="middle" 
          dominantBaseline="central"
          style={{ pointerEvents: "none" }}
        >
          {displayIcon}
        </text>
      )}

      {/* Subtitle */}
      {displaySubtitle && (
        <text 
          x={iconWidth + 10} 
          y={18} 
          fill="#64748b" 
          fontSize="11px" 
          fontFamily="Inter, Arial, sans-serif"
          style={{ pointerEvents: "none" }}
        >
          {displaySubtitle}
        </text>
      )}

      {/* Title */}
      <text 
        x={iconWidth + 10} 
        y={displaySubtitle ? 35 : 26} 
        fill="#1e293b" 
        fontSize="14px" 
        fontWeight="bold"
        fontFamily="Inter, Arial, sans-serif"
        style={{ pointerEvents: "none" }}
      >
        {node.label}
      </text>

      {/* Render children inside the box */}
      {children}
    </g>
  );
}
