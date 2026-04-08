import { IDrawingClass, IDrawingEdge, IDrawingNode } from "@/core/interfaces";
import { RoleGraphPOJO, RolePOJO, RoleTier } from "../data/SnowflakeRoleData";

const TIER_ORDER: RoleTier[] = ["system", "functional", "access", "custom"];

export const TIER_LABEL: Record<RoleTier, string> = {
  system: "System",
  functional: "Functional",
  access: "Access",
  custom: "Custom",
};

const CONFIG = {
  bandLabelWidth: 90,
  bandLabelGap: 16,
  nodeMinWidth: 150,
  nodeHeight: 34,
  nodeHGap: 24,          // horizontal gap between sibling nodes / subtrees
  nodePaddingV: 22,      // vertical padding inside band (top & bottom)
  sysRowGap: 45,         // gap between tree rows within system tier
  tierGap: 72,           // gap between tier bands
  diagramPaddingTop: 20,
  diagramPaddingRight: 20,
  fallbackCharWidth: 8.5,
};

export class SnowflakeRoleDrawing implements IDrawingClass {
  public nodes: IDrawingNode[] = [];
  public edges: IDrawingEdge[] = [];
  public width = 0;
  public height = 0;

  constructor(
    private graph: RoleGraphPOJO,
    private measureTextWidth?: (text: string) => number
  ) {
    this.computeLayout();
  }

  private nodeWidth(text: string): number {
    const tw = this.measureTextWidth
      ? this.measureTextWidth(text)
      : text.length * CONFIG.fallbackCharWidth;
    return Math.max(CONFIG.nodeMinWidth, tw + 40);
  }

  private computeLayout() {
    const roles = this.graph.roles;

    // Build global parent → children map (all tiers)
    const childrenOf = new Map<string, RolePOJO[]>();
    for (const role of roles) {
      for (const pName of role.parentRoles) {
        if (!childrenOf.has(pName)) childrenOf.set(pName, []);
        childrenOf.get(pName)!.push(role);
      }
    }

    // Group by tier
    const byTier: Record<RoleTier, RolePOJO[]> = {
      system: [], functional: [], access: [], custom: [],
    };
    for (const r of roles) byTier[r.tier].push(r);

    const funcRoles = byTier.functional;
    const sysRoles  = byTier.system;
    const sysSet    = new Set(sysRoles.map(r => r.name));

    // ================================================================
    // === Phase 0: System tree layout pre-computation               ===
    // ================================================================

    // System-tier-only children map
    const sysChildren = new Map<string, RolePOJO[]>();
    for (const sr of sysRoles) sysChildren.set(sr.name, []);
    for (const sr of sysRoles) {
      for (const pName of sr.parentRoles) {
        if (sysSet.has(pName)) sysChildren.get(pName)!.push(sr);
      }
    }

    // System roots = system roles whose parents are all outside system tier
    const sysRoots = sysRoles.filter(r =>
      r.parentRoles.filter(p => sysSet.has(p)).length === 0
    );

    // BFS to assign depths within system tier
    const sysDepths = new Map<string, number>();
    const bfsQ: { name: string; depth: number }[] = sysRoots.map(r => ({ name: r.name, depth: 0 }));
    const visited = new Set<string>();
    while (bfsQ.length > 0) {
      const item = bfsQ.shift()!;
      if (visited.has(item.name)) continue;
      visited.add(item.name);
      sysDepths.set(item.name, item.depth);
      for (const child of sysChildren.get(item.name) ?? []) {
        if (!visited.has(child.name)) bfsQ.push({ name: child.name, depth: item.depth + 1 });
      }
    }
    for (const sr of sysRoles) {
      if (!sysDepths.has(sr.name)) sysDepths.set(sr.name, 0);
    }
    const maxSysDepth = Math.max(...Array.from(sysDepths.values()), 0);

    // --- Bottom-up subtree width calculation ---
    const subtreeW = new Map<string, number>();
    const calcSubtreeW = (name: string): number => {
      if (subtreeW.has(name)) return subtreeW.get(name)!;
      const kids = sysChildren.get(name) ?? [];
      let w: number;
      if (kids.length === 0) {
        w = this.nodeWidth(name);
      } else {
        const kidsTotal = kids.reduce((s, k) => s + calcSubtreeW(k.name), 0)
          + CONFIG.nodeHGap * (kids.length - 1);
        w = Math.max(this.nodeWidth(name), kidsTotal);
      }
      subtreeW.set(name, w);
      return w;
    };
    for (const sr of sysRoots) calcSubtreeW(sr.name);
    // Disconnected nodes (shouldn't normally occur)
    for (const sr of sysRoles) {
      if (!subtreeW.has(sr.name)) subtreeW.set(sr.name, this.nodeWidth(sr.name));
    }

    // Total system tree width across all roots
    const sysTreeTotalW = sysRoots.reduce((s, r) => s + subtreeW.get(r.name)!, 0)
      + CONFIG.nodeHGap * Math.max(0, sysRoots.length - 1);

    // ================================================================
    // === Phase 1: Functional column widths                         ===
    // ================================================================
    const funcColWidths: number[] = funcRoles.map((fr) => {
      const arKids = (childrenOf.get(fr.name) ?? []).filter(r => r.tier === "access");
      const frW = this.nodeWidth(fr.name);
      if (arKids.length === 0) return frW;
      const totalAr = arKids.reduce((sum, ar) => sum + this.nodeWidth(ar.name), 0)
        + CONFIG.nodeHGap * (arKids.length - 1);
      return Math.max(frW, totalAr);
    });

    const totalFuncW = funcColWidths.reduce((s, w) => s + w, 0)
      + CONFIG.nodeHGap * Math.max(0, funcColWidths.length - 1);

    const maxContentW   = Math.max(totalFuncW, sysTreeTotalW, 300);
    const contentStartX = CONFIG.bandLabelWidth + CONFIG.bandLabelGap;
    const totalW        = contentStartX + maxContentW + CONFIG.diagramPaddingRight;

    // Band heights
    const stdBandH = CONFIG.nodePaddingV * 2 + CONFIG.nodeHeight;
    const sysBandH = CONFIG.nodePaddingV
      + (maxSysDepth + 1) * (CONFIG.nodeHeight + CONFIG.sysRowGap)
      - CONFIG.sysRowGap
      + CONFIG.nodePaddingV;
    const tierBandH = (t: RoleTier) => t === "system" ? sysBandH : stdBandH;

    // ================================================================
    // === Phase 2: Assign Y to each present tier                    ===
    // ================================================================
    const presentTiers = TIER_ORDER.filter(t => byTier[t].length > 0);
    const tierY = new Map<RoleTier, number>();
    let curY = CONFIG.diagramPaddingTop;
    for (const t of presentTiers) {
      tierY.set(t, curY);
      curY += tierBandH(t) + CONFIG.tierGap;
    }

    // ================================================================
    // === Phase 3: Band background nodes                            ===
    // ================================================================
    for (const t of presentTiers) {
      this.nodes.push({
        id: `band-${t}`,
        x: 0,
        y: tierY.get(t)!,
        width: totalW,
        height: tierBandH(t),
        label: TIER_LABEL[t],
        type: `role-band-${t}` as string,
      });
    }

    // Helper to add a role node
    const nodeMap = new Map<string, IDrawingNode>();
    const pushNode = (node: IDrawingNode) => {
      nodeMap.set(node.id, node);
      this.nodes.push(node);
    };

    // ================================================================
    // === Phase 4: Functional + access nodes                        ===
    // ================================================================
    if (tierY.has("functional") || tierY.has("access")) {
      let colStartX = contentStartX;
      for (let fi = 0; fi < funcRoles.length; fi++) {
        const fr   = funcRoles[fi];
        const colW = funcColWidths[fi];
        const frW  = this.nodeWidth(fr.name);
        const frX  = colStartX + (colW - frW) / 2;
        const frId = `role-${fr.name}`;

        pushNode({
          id: frId,
          x: frX,
          y: tierY.get("functional")! + CONFIG.nodePaddingV,
          width: frW,
          height: CONFIG.nodeHeight,
          label: fr.name,
          type: "role-node-functional",
          data: fr,
        });

        const arKids = (childrenOf.get(fr.name) ?? []).filter(r => r.tier === "access");
        if (arKids.length > 0 && tierY.has("access")) {
          const totalAr = arKids.reduce((s, ar) => s + this.nodeWidth(ar.name), 0)
            + CONFIG.nodeHGap * (arKids.length - 1);
          let arX = colStartX + (colW - totalAr) / 2;
          for (const ar of arKids) {
            const arId = `role-${ar.name}__${fr.name}`;
            pushNode({
              id: arId,
              x: arX,
              y: tierY.get("access")! + CONFIG.nodePaddingV,
              width: this.nodeWidth(ar.name),
              height: CONFIG.nodeHeight,
              label: ar.name,
              type: "role-node-access",
              data: ar,
            });
            arX += this.nodeWidth(ar.name) + CONFIG.nodeHGap;
            this.edges.push({ id: `edge-${fr.name}__${ar.name}__${fi}`, fromNodeId: frId, toNodeId: arId });
          }
        }
        colStartX += colW + CONFIG.nodeHGap;
      }
    }

    // ================================================================
    // === Phase 5: System nodes — proper tree layout                ===
    // ================================================================
    if (tierY.has("system")) {
      // Top-down x-position assignment (each node centered over its subtree)
      const sysNodeLeftX = new Map<string, number>();

      const assignX = (name: string, subStartX: number): void => {
        const stW = subtreeW.get(name)!;
        const nW  = this.nodeWidth(name);
        sysNodeLeftX.set(name, subStartX + (stW - nW) / 2);

        const kids = sysChildren.get(name) ?? [];
        let kx = subStartX;
        for (const kid of kids) {
          assignX(kid.name, kx);
          kx += subtreeW.get(kid.name)! + CONFIG.nodeHGap;
        }
      };

      // Center the whole system tree within maxContentW
      const sysTreeOffsetX = contentStartX + (maxContentW - sysTreeTotalW) / 2;
      let rootStartX = sysTreeOffsetX;
      for (const sr of sysRoots) {
        assignX(sr.name, rootStartX);
        rootStartX += subtreeW.get(sr.name)! + CONFIG.nodeHGap;
      }

      // Create nodes and edges
      const sysTierTopY = tierY.get("system")!;
      for (const sr of sysRoles) {
        const depth  = sysDepths.get(sr.name)!;
        const leftX  = sysNodeLeftX.get(sr.name) ?? (contentStartX);
        const nodeY  = sysTierTopY + CONFIG.nodePaddingV + depth * (CONFIG.nodeHeight + CONFIG.sysRowGap);
        const sNodeId = `role-${sr.name}`;

        pushNode({
          id: sNodeId,
          x: leftX,
          y: nodeY,
          width: this.nodeWidth(sr.name),
          height: CONFIG.nodeHeight,
          label: sr.name,
          type: "role-node-system",
          data: sr,
        });

        // Edges to all children  (system→system and system→functional)
        for (const kid of childrenOf.get(sr.name) ?? []) {
          this.edges.push({
            id: `edge-${sr.name}__${kid.name}`,
            fromNodeId: sNodeId,
            toNodeId: `role-${kid.name}`,
          });
        }
      }
    }

    this.width  = totalW;
    this.height = curY - CONFIG.tierGap + 20;
  }
}
