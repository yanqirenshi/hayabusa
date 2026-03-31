"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function SystemArchitectureRenderer() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = 800;
    const height = 600;

    // Clear previous SVG to support React strict mode
    d3.select(containerRef.current).select("svg").remove();

    const svg = d3
      .select(containerRef.current)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("border", "1px solid #ddd")
      .style("border-radius", "8px")
      .style("background-color", "#fcfcfc");

    // Add a simple animated circle as a proof of concept
    svg
      .append("circle")
      .attr("cx", width / 2)
      .attr("cy", height / 2 - 20)
      .attr("r", 50)
      .attr("fill", "#0070f3")
      .attr("opacity", 0)
      .transition()
      .duration(1000)
      .attr("opacity", 1);

    // Add a text label
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height / 2 + 60)
      .attr("text-anchor", "middle")
      .attr("font-family", "Arial, sans-serif")
      .attr("font-weight", "bold")
      .attr("font-size", "1.2rem")
      .attr("fill", "#333")
      .text("System Architecture (D3.js Environment Ready)");

  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        maxWidth: "800px",
        height: "600px",
        margin: "0 auto",
      }}
    />
  );
}
