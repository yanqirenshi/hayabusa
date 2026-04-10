"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AzureTenant } from "../data/AzureBlobData";
import { AzureBlobDrawing } from "../drawing/AzureBlobDrawing";
import AzureBlobGroup from "./AzureBlobGroup";
import { IDrawingNode } from "@/core/interfaces";

export default function AzureBlobClientRenderer({ dbData, rootX = 0, rootY = 0 }: { dbData: AzureTenant, rootX?: number, rootY?: number }) {
  const [nodes, setNodes] = useState<IDrawingNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<IDrawingNode | null>(null);

  // Inspector mutual exclusion
  useEffect(() => {
    const handleInspectorEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== 'azure-blob') {
        setSelectedNode(null);
      }
    };
    window.addEventListener('inspectorOpened', handleInspectorEvent);
    return () => window.removeEventListener('inspectorOpened', handleInspectorEvent);
  }, []);

  const handleNodeSelect = (node: IDrawingNode | null) => {
    setSelectedNode(node);
    if (node) {
      window.dispatchEvent(new CustomEvent('inspectorOpened', { detail: 'azure-blob' }));
    }
  };

  useEffect(() => {
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

    const drawing = new AzureBlobDrawing(dbData, measureTextWidth);
    setNodes(drawing.nodes);
  }, [dbData]);

  if (nodes.length === 0) return null;

  const renderInspector = () => {
    if (!selectedNode || typeof document === 'undefined') return null;
    
    const objData = selectedNode.data;
    const headerTitle = objData?.name || selectedNode.label || "Inspector";
    
    let blockType = "Azure Object";
    if (selectedNode.type) {
      blockType = selectedNode.type.replace("azure-blob-", "").toUpperCase();
    }

    const contentString = JSON.stringify({ type: blockType, name: headerTitle, ...objData }, null, 2);

    return createPortal(
      <div style={{
        position: "fixed", top: 0, right: 0, width: "450px", height: "100vh",
        backgroundColor: "#ffffff", borderLeft: "1px solid #e2e8f0", boxShadow: "-4px 0 25px rgba(0,0,0,0.1)",
        zIndex: 50, display: "flex", flexDirection: "column", fontFamily: "sans-serif"
      }}>
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex",
          justifyContent: "space-between", alignItems: "center", backgroundColor: "#f8fafc"
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
        <div style={{ padding: "20px", overflowY: "auto", flex: 1, backgroundColor: "#0f172a" }}>
          <pre style={{ margin: 0, fontSize: "13px", fontFamily: "Consolas, Monaco, 'Courier New', monospace", color: "#e2e8f0", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {contentString}
          </pre>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <g transform={`translate(${rootX}, ${rootY})`}>
        <AzureBlobGroup nodes={nodes} onNodeClick={handleNodeSelect} />
      </g>
      {renderInspector()}
    </>
  );
}
