import { RootBoxNode, BranchBoxNode, LeafBoxNode } from "@/core/models/BoxNode";
import { IDrawingNode } from "@/core/interfaces";


export class SnowflakeSchemaNode extends BranchBoxNode {
  get icon() { return "📁"; }
  get subtitle() { return "Schema"; }
}

export class SnowflakeGroupNode extends BranchBoxNode {
  get icon() { return "🗂"; }
  get subtitle() { return "Group"; }
}

export class SnowflakeObjectNode extends LeafBoxNode {
  get icon() {
    // We can infer icon from label or type if needed, but for now just use a default or mapped
    if (this.label.includes("VIEW")) return "👁️";
    if (this.label.includes("PROCEDURE") || this.label.includes("FUNCTION")) return "⚙️";
    if (this.label.includes("STREAM") || this.label.includes("PIPE")) return "🌊";
    if (this.label.includes("STAGE")) return "📥";
    return "📊";
  }
  
  get subtitle() {
    // Default subtitle, or could be extracted from data
    if (this.data && this.data.type) return this.data.type;
    return "Object";
  }
}

export class SnowflakeRoleNode extends LeafBoxNode {
  get icon() { return "👤"; }
  get subtitle() { return "Role"; }
}
