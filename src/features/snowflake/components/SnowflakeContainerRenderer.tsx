"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { SnowflakeDatabase } from "../data/SnowflakeData";
import { fetchSnowflakeDDL } from "../services/snowflakeFetcher";
import { RoleGraphPOJO, RoleTier } from "../data/SnowflakeRoleData";
import { SnowflakeDrawing } from "../drawing/SnowflakeDrawing";
import { SnowflakeRoleDrawing } from "../drawing/SnowflakeRoleDrawing";
import SnowflakeGroup from "./SnowflakeGroup";
import { IDrawingEdge, IDrawingNode } from "@/core/interfaces";

// ---- Layout constants ----
const PADDING      = 20;   // outer padding around all content
const SECTION_GAP  = 40;   // vertical gap between DB diagram and role diagram

// ---- Role tier styles ----
const TIER_STYLES: Record<string, { nodeBg: string; nodeBorder: string; nodeText: string }> = {
  "role-band-system":     { nodeBg: "#f1f5f9", nodeBorder: "#94a3b8", nodeText: "#1e293b" },
  "role-band-functional": { nodeBg: "#dbeafe", nodeBorder: "#60a5fa", nodeText: "#1e40af" },
  "role-band-access":     { nodeBg: "#dcfce7", nodeBorder: "#4ade80", nodeText: "#166534" },
  "role-band-custom":     { nodeBg: "#f3e8ff", nodeBorder: "#c084fc", nodeText: "#7e22ce" },
};

// ---- Sub-components (role diagram) ----

function RoleNode({ node, onNodeClick }: { node: IDrawingNode, onNodeClick: (node: IDrawingNode) => void }) {
  const bandType = node.type.replace("role-node-", "role-band-");
  const style = TIER_STYLES[bandType] ?? TIER_STYLES["role-band-custom"];
  return (
    <g onClick={() => onNodeClick(node)} style={{ cursor: "pointer" }}>
      <rect x={node.x} y={node.y} width={node.width} height={node.height}
        rx={6} ry={6} fill={style.nodeBg} stroke={style.nodeBorder} strokeWidth={1.5} />
      <text x={node.x + node.width / 2} y={node.y + node.height / 2}
        textAnchor="middle" dominantBaseline="middle"
        fill={style.nodeText} fontSize={11} fontFamily="Inter, Arial, sans-serif" fontWeight="500">
        {node.label}
      </text>
    </g>
  );
}

function EdgeGroup({
  fromId, edges, nodeMap,
}: {
  fromId: string;
  edges: IDrawingEdge[];
  nodeMap: Map<string, IDrawingNode>;
}) {
  const from = nodeMap.get(fromId);
  if (!from) return null;
  const tos = edges.map(e => nodeMap.get(e.toNodeId)).filter((n): n is IDrawingNode => !!n);
  if (tos.length === 0) return null;

  const x1   = from.x + from.width / 2;
  const y1   = from.y + from.height;
  const y2   = Math.min(...tos.map(t => t.y));
  const midY = (y1 + y2) / 2;
  const childXs = tos.map(t => t.x + t.width / 2);
  const allXs   = [x1, ...childXs];
  const minX    = Math.min(...allXs);
  const maxX    = Math.max(...allXs);

  return (
    <g stroke="#94a3b8" strokeWidth={1.5} fill="none" strokeLinecap="round">
      <line x1={x1} y1={y1} x2={x1} y2={midY} />
      {maxX > minX && <line x1={minX} y1={midY} x2={maxX} y2={midY} />}
      {tos.map((to, i) => {
        const cx = to.x + to.width / 2;
        return <line key={i} x1={cx} y1={midY} x2={cx} y2={to.y} />;
      })}
    </g>
  );
}

// ---- State type ----
interface LayoutState {
  dbNodes:    IDrawingNode[];
  dbWidth:    number;
  dbHeight:   number;
  roleNodes:  IDrawingNode[];
  roleEdges:  IDrawingEdge[];
  roleWidth:  number;
  roleHeight: number;
}

// ---- Main component ----

export default function SnowflakeContainerRenderer({
  dbData,
  roleData,
  rootX = 0,
  rootY = 0,
}: {
  dbData:    SnowflakeDatabase;
  roleData:  RoleGraphPOJO | null;
  rootX?:    number;
  rootY?:    number;
}) {
  const [layout, setLayout] = useState<LayoutState | null>(null);
  const [selectedNode, setSelectedNode] = useState<IDrawingNode | null>(null);
  const [asyncDdl, setAsyncDdl] = useState<string | null>(null);
  const [isLoadingDdl, setIsLoadingDdl] = useState(false);
  const [ddlError, setDdlError] = useState<string | null>(null);

  // Inspector mutual exclusion
  useEffect(() => {
    const handleInspectorEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== 'snowflake') {
        setSelectedNode(null);
      }
    };
    window.addEventListener('inspectorOpened', handleInspectorEvent);
    return () => window.removeEventListener('inspectorOpened', handleInspectorEvent);
  }, []);

  const handleNodeSelect = (node: IDrawingNode | null) => {
    setSelectedNode(node);
    if (node) {
      window.dispatchEvent(new CustomEvent('inspectorOpened', { detail: 'snowflake' }));
    }
  };

  useEffect(() => {
    if (!selectedNode) {
      setAsyncDdl(null);
      setDdlError(null);
      return;
    }

    const objData = selectedNode.data;
    if (!objData) return;

    const { name, type, databaseName, schemaName } = objData;
    const fetchableTypes = ['Table', 'View', 'Materialized View', 'Stage', 'FileFormat', 'Pipe', 'Stream', 'Task', 'Sequence', 'Procedure', 'Function'];

    // Only fetch if required identities are present
    if (databaseName && schemaName && fetchableTypes.includes(type)) {
      setIsLoadingDdl(true);
      setDdlError(null);
      
      fetchSnowflakeDDL(type, databaseName, schemaName, name)
        .then((ddlStr) => {
           setAsyncDdl(ddlStr);
        })
        .catch((err) => {
           setDdlError(err.message || "Failed to fetch DDL");
        })
        .finally(() => {
           setIsLoadingDdl(false);
        });
    } else {
      setAsyncDdl(null);
      setDdlError(null);
    }
  }, [selectedNode]);

  useEffect(() => {
    // ---- DB diagram (13px Arial) ----
    const dbCanvas = document.createElement("canvas");
    const dbCtx    = dbCanvas.getContext("2d");
    if (dbCtx) dbCtx.font = "13px Arial, sans-serif";
    const dbMeasure = (t: string) => dbCtx ? dbCtx.measureText(t).width : t.length * 9.5;

    const dbDrawing = new SnowflakeDrawing(dbData, dbMeasure);

    // ---- Role diagram (11px Inter) ----
    let roleNodes:  IDrawingNode[] = [];
    let roleEdges:  IDrawingEdge[] = [];
    let roleWidth   = 0;
    let roleHeight  = 0;

    if (roleData) {
      const roleCanvas = document.createElement("canvas");
      const roleCtx    = roleCanvas.getContext("2d");
      if (roleCtx) roleCtx.font = "500 11px Inter, Arial, sans-serif";
      const roleMeasure = (t: string) => roleCtx ? roleCtx.measureText(t).width : t.length * 8.5;

      const roleDrawing = new SnowflakeRoleDrawing(roleData, roleMeasure);
      roleNodes  = roleDrawing.nodes;
      roleEdges  = roleDrawing.edges;
      roleWidth  = roleDrawing.width;
      roleHeight = roleDrawing.height;
    }

    setLayout({
      dbNodes:   dbDrawing.nodes,
      dbWidth:   dbDrawing.width,
      dbHeight:  dbDrawing.height,
      roleNodes,
      roleEdges,
      roleWidth,
      roleHeight,
    });
  }, [dbData, roleData]);

  if (!layout) return null;

  const { dbNodes, dbWidth, dbHeight, roleNodes, roleEdges, roleWidth, roleHeight } = layout;

  // ---- Container dimensions ----
  const CONTENT_Y      = 50;   // Top offset for the main Snowflake diagram to clear the logo
  const hasRole       = roleNodes.length > 0;
  const innerWidth    = Math.max(dbWidth, roleWidth);
  const roleOffsetY   = CONTENT_Y + dbHeight + (hasRole ? SECTION_GAP : 0);
  const containerW    = innerWidth + PADDING * 2;
  const containerH    = roleOffsetY + (hasRole ? roleHeight : 0) + PADDING;

  // ---- Role edge grouping ----
  const nodeMap = new Map<string, IDrawingNode>(roleNodes.map(n => [n.id, n]));
  const edgeGroups = new Map<string, IDrawingEdge[]>();
  for (const edge of roleEdges) {
    if (!edgeGroups.has(edge.fromNodeId)) edgeGroups.set(edge.fromNodeId, []);
    edgeGroups.get(edge.fromNodeId)!.push(edge);
  }
  const visibleRoleNodes = roleNodes.filter(n => n.type.startsWith("role-node-"));

  // ---- Inspector rendering ----
  // (renderInspector logic...)
  const renderInspector = () => {
    if (!selectedNode || typeof document === 'undefined') return null;
    
    const objData = selectedNode.data;
    const headerTitle = objData?.name || selectedNode.label || "Inspector";
    const isRole = selectedNode.type && selectedNode.type.startsWith("role-node-");
    
    let blockType = "Object";
    if (isRole) blockType = "ROLE";
    else if (objData?.type) blockType = objData.type;
    else if (selectedNode.type) blockType = selectedNode.type.toUpperCase();
    
    let contentString = "";
    if (objData && objData.properties) {
      // Create a clean readable representation of the properties
      const props = { ...objData.properties };
      // Sometimes 'text' or 'TEXT' might hold the raw SQL query depending on the Snowflake object type
      const mainSqlText = props['text'] || props['TEXT'];
      
      // Remove it from props so we don't display it twice if we want it top level
      if (mainSqlText) {
        delete props['text'];
        delete props['TEXT'];
      }
      
      let lines = [];
      if (isLoadingDdl) {
        lines.push(`/* Source Code (DDL) */\nLoading DDL from Snowflake...\n`);
      } else if (ddlError) {
        lines.push(`/* Source Code (DDL) */\n-- Error: ${ddlError}\n`);
      } else if (asyncDdl) {
        lines.push(`/* Source Code (DDL) */\n${asyncDdl}\n`);
      } else if (mainSqlText) {
        lines.push(`/* Source Code */\n${mainSqlText}\n`);
      }
      
      lines.push(`/* Metadata */\n${JSON.stringify({ ...props, type: blockType, name: headerTitle }, null, 2)}`);
      contentString = lines.join('\n');
    } else {
      contentString = JSON.stringify({ type: blockType, name: headerTitle }, null, 2);
    }

    return createPortal(
      <div style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: "500px",
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
          backgroundColor: "#f0f9ff" // Light blue subtle accent for Snowflake
        }}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: "bold", color: "#0284c7", textTransform: "uppercase", letterSpacing: "0.5px" }}>{blockType}</span>
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
        {/* Outer container box */}
        <rect
          x={0} y={0}
          width={containerW} height={containerH}
          fill="white"
          stroke="#d1d5db"
          strokeWidth={1.5}
          rx={8} ry={8}
        />

        {/* Snowflake Logo Badge at container top-left */}
        <g>
          <rect x={0} y={0} width={40} height={40} fill="#29B5E8" rx={8} />  {/* Align rx with container corner */}
          <rect x={10} y={0} width={30} height={40} fill="#29B5E8" />      {/* Mask the right corner rx for integrated look */}
          <rect x={0} y={10} width={40} height={30} fill="#29B5E8" />      {/* Mask the bottom corner rx */}
          <text x={20} y={27} textAnchor="middle" fill="white" fontSize="24px">❄</text>
        </g>

        {/* DB diagram */}
        <SnowflakeGroup nodes={dbNodes} x={PADDING} y={CONTENT_Y} onNodeClick={handleNodeSelect} />

        {/* Role hierarchy diagram */}
        {hasRole && (
          <g transform={`translate(${PADDING}, ${roleOffsetY})`}>
            {/* Edges (behind nodes) */}
            {Array.from(edgeGroups.entries()).map(([fromId, edges]) => (
              <EdgeGroup key={fromId} fromId={fromId} edges={edges} nodeMap={nodeMap} />
            ))}
            {/* Role nodes */}
            {visibleRoleNodes.map(n => <RoleNode key={n.id} node={n} onNodeClick={handleNodeSelect} />)}
          </g>
        )}
      </g>
      {renderInspector()}
    </>
  );
}
