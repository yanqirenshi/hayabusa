// Barrel file: re-exports all BoxNode classes for backward-compatible imports
// e.g. import { RootBoxNode, BranchBoxNode } from "@/core/models/BoxNode"
export { BoxNode } from "./BoxNodeBase";
export { RootBoxNode } from "./RootBoxNode";
export { BranchBoxNode } from "./BranchBoxNode";
export { LeafBoxNode } from "./LeafBoxNode";
export { LeafBoxNodeDefault } from "./LeafBoxNodeDefault";
export { LeafBoxNodeRoleItem } from "./LeafBoxNodeRoleItem";
export { LeafBoxNodeTerraformItem } from "./LeafBoxNodeTerraformItem";
