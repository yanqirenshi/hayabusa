import { LeafBoxNode } from "./LeafBoxNode";

/**
 * LeafBoxNodeTerraformItem
 * Terraform ブロックアイテム専用。
 */
export class LeafBoxNodeTerraformItem extends LeafBoxNode {
  get icon(): string { return "📦"; }
  get subtitle(): string { return "Block"; }
}
