"use client";

import React, { useState, useEffect } from "react";
import { SnowflakeDatabase } from "../data/SnowflakeData";
import { SnowflakeDrawing } from "../drawing/SnowflakeDrawing";
import SnowflakeGroup from "./SnowflakeGroup";
import { IDrawingNode } from "@/core/interfaces";

export default function SnowflakeClientRenderer({ dbData }: { dbData: SnowflakeDatabase }) {
  const [nodes, setNodes] = useState<IDrawingNode[]>([]);

  useEffect(() => {
    // Create a temporary canvas to measure text pixel properties precisely
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (context) {
      // **IMPORTANT**: This font must exactly match the font configuration in SnowflakeGroup.tsx
      context.font = "13px Arial, sans-serif";
    }

    const measureTextWidth = (text: string) => {
      if (!context) {
        // Fallback if context creation fails
        return text.length * 9.5;
      }
      return context.measureText(text).width;
    };

    // Calculate layout using the browser's real font rendering engine
    const drawing = new SnowflakeDrawing(dbData, measureTextWidth);
    setNodes(drawing.nodes);
  }, [dbData]);

  if (nodes.length === 0) {
    // Initial mount on server side or while computing layout: render nothing visually
    // Layout computation is extremely fast, so no spinner is necessary
    return null; 
  }

  return <SnowflakeGroup nodes={nodes} x={0} y={0} />;
}
