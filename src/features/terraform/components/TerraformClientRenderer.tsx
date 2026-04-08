"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { TerraformDirectory } from "../data/TerraformData";
import { TerraformDrawing } from "../drawing/TerraformDrawing";
import TerraformGroup from "./TerraformGroup";
import { IDrawingNode } from "@/core/interfaces";

export default function TerraformClientRenderer({ dirData, rootX = 0, rootY = 0 }: { dirData: TerraformDirectory, rootX?: number, rootY?: number }) {
  const [nodes, setNodes] = useState<IDrawingNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<IDrawingNode | null>(null);

  // Inspector mutual exclusion
  useEffect(() => {
    const handleInspectorEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== 'terraform') {
        setSelectedNode(null);
      }
    };
    window.addEventListener('inspectorOpened', handleInspectorEvent);
    return () => window.removeEventListener('inspectorOpened', handleInspectorEvent);
  }, []);

  const handleNodeSelect = (node: IDrawingNode | null) => {
    setSelectedNode(node);
    if (node) {
      window.dispatchEvent(new CustomEvent('inspectorOpened', { detail: 'terraform' }));
    }
  };

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

  const renderInspector = () => {
    if (!selectedNode || typeof document === 'undefined') return null;
    
    // Extract data
    const content = selectedNode.data?.content || "No content available";
    const headerTitle = selectedNode.data?.name || "Inspector";
    const blockType = selectedNode.data?.blockType || "";

    return createPortal(
      <div style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: "450px",
        height: "100vh",
        backgroundColor: "#ffffff",
        borderLeft: "1px solid #e2e8f0",
        boxShadow: "-4px 0 25px rgba(0,0,0,0.1)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        fontFamily: "sans-serif"
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#f8fafc"
        }}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: "bold", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>{blockType}</span>
            <h2 style={{ fontSize: "16px", fontWeight: "bold", margin: "4px 0 0 0", color: "#0f172a" }}>{headerTitle}</h2>
          </div>
          <button 
            onClick={() => handleNodeSelect(null)} 
            style={{ border: "none", background: "none", fontSize: "20px", cursor: "pointer", color: "#64748b", padding: "4px" }}
          >
            ✕
          </button>
        </div>
        
        {/* Content Area */}
        <div style={{ padding: "20px", overflowY: "auto", flex: 1, backgroundColor: "#0f172a" }}>
          <pre style={{ margin: 0, fontSize: "13px", fontFamily: "Consolas, Monaco, 'Courier New', monospace", color: "#e2e8f0", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {content}
          </pre>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <g transform={`translate(${rootX}, ${rootY})`}>
        {nodes.map((node, index) => (
          <TerraformGroup key={node.id} node={node} rootX={node.x} rootY={node.y} depth={0} onNodeClick={handleNodeSelect} />
        ))}
      </g>
      {renderInspector()}
    </>
  );
}
