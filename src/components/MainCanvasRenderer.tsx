"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { addClientLogAction } from "@/app/actions/logActions";

interface MainCanvasRendererProps {
  children?: React.ReactNode;
  width?: number;
  height?: number;
}

export default function MainCanvasRenderer({
  children,
  width = 1200,
  height = 800,
}: MainCanvasRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Set up D3 zoom behavior
    const svg = d3.select(svgRef.current);
    const zoomGroup = svg.select("g.zoom-container");

    const LOCAL_STORAGE_KEY = "hayabusa_canvas_transform";

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        zoomGroup.attr("transform", event.transform);
      })
      .on("end", (event) => {
        const { x, y, k } = event.transform;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ x, y, k }));
        addClientLogAction("INFO", `[ユーザー操作] キャンバスの表示位置を保存しました（x: ${Math.round(x)}, y: ${Math.round(y)}, 倍率: ${k.toFixed(2)}）`).catch((e) => console.error("Failed to log client action", e));
      });

    svg.call(zoom);

    // Load initial zoom state
    let initialTransform = d3.zoomIdentity.translate(20, 20).scale(1);
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number" && typeof parsed.k === "number") {
          initialTransform = d3.zoomIdentity.translate(parsed.x, parsed.y).scale(parsed.k);
        }
      }
    } catch (e) {
      console.warn("Failed to parse saved canvas transform", e);
    }

    svg.call(zoom.transform, initialTransform);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        margin: 0,
        border: "none",
        backgroundColor: "#fcfcfc",
        overflow: "hidden", // Let D3 handle panning instead of scrollbars
        position: "relative"
      }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        style={{ cursor: "grab" }}
      >
        {/* All diagrams will be rendered inside this zoomable group */}
        <g className="zoom-container">
          {children}
        </g>
      </svg>
    </div>
  );
}
