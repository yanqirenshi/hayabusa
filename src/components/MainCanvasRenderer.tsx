"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

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

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        zoomGroup.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Initial zoom state
    svg.call(zoom.transform, d3.zoomIdentity.translate(20, 20).scale(1));
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        maxWidth: "100%",
        height: "85vh",
        margin: "0 auto",
        border: "1px solid #ddd",
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
