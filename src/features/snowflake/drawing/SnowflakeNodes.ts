import { LeafBoxNode } from "@/core/models/BoxNode";
import { IDrawingNode } from "@/core/interfaces";

export class SnowflakeObjectNode extends LeafBoxNode {
  get icon() {
    if (this.label.includes("VIEW")) return "👁️";
    if (this.label.includes("PROCEDURE") || this.label.includes("FUNCTION")) return "⚙️";
    if (this.label.includes("STREAM") || this.label.includes("PIPE")) return "🌊";
    if (this.label.includes("STAGE")) return "📥";
    return "📊";
  }
  
  get subtitle() {
    if (this.data && this.data.type) return this.data.type;
    return "Object";
  }
}

export class SnowflakeRoleNode extends LeafBoxNode {
  get icon() { return "👤"; }
  get subtitle() { return "Role"; }
}
