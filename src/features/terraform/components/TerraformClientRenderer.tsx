"use client";

import React, { useState, useEffect } from "react";
import { TerraformDirectory } from "../data/TerraformData";
import { TerraformDrawing } from "../drawing/TerraformDrawing";
import TerraformGroup from "./TerraformGroup";
import { IDrawingNode } from "@/core/interfaces";

export default function TerraformClientRenderer({ dirData, rootX = 0, rootY = 0 }: { dirData: TerraformDirectory, rootX?: number, rootY?: number }) {
  const [nodes, setNodes] = useState<IDrawingNode[]>([]);

  useEffect(() => {
    // Exact text measurement algorithm via Canvas 2D API
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (context) {
      context.font = "bold 13px Arial, sans-serif";
    }

    const measureTextWidth = (text: string) => {
      if (!context) {
        return text.length * 9.5;
      }
      return context.measureText(text).width;
    };

    const drawing = new TerraformDrawing(dirData, measureTextWidth);
    setNodes(drawing.nodes);
  }, [dirData]);

  if (nodes.length === 0) return null;

  return (
    <g transform={`translate(${rootX}, ${rootY})`}>
      {nodes.map((node, index) => (
        <TerraformGroup key={node.id} node={node} rootX={node.x} rootY={node.y} depth={0} />
      ))}
    </g>
  );
}
