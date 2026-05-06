import { LeafBoxNode } from "./LeafBoxNode";

/**
 * LeafBoxNodeRoleItem
 * ロール表示専用。Snowflake ロールなど。
 */
export class LeafBoxNodeRoleItem extends LeafBoxNode {
  get icon(): string { return "👤"; }
  get subtitle(): string { return "Role"; }
}
