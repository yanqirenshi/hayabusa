import { LeafBoxNode } from "@/core/models/BoxNode";
import { IDrawingNode } from "@/core/interfaces";

export class TerraformBlockNode extends LeafBoxNode {
  get icon() { return "📦"; }
  get subtitle() { return "Block"; }
}
