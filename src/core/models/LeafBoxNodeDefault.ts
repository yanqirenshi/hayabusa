import { LeafBoxNode } from "./LeafBoxNode";

/**
 * LeafBoxNodeDefault
 * 汎用の末端アイテム。type に応じてアイコン・サブタイトルを返す。
 */
export class LeafBoxNodeDefault extends LeafBoxNode {
  get icon(): string {
    switch (this.type) {
      case "azure-entra-user": return "👤";
      case "azure-entra-group": return "👥";
      case "azure-entra-app": return "📱";
      case "azure-blob-directory":
      case "azure-blob-item":
      case "azure-container-repository": return "📄";
      case "azure-devops-repo": return "🌿";
      case "azure-devops-pipeline":
      case "azure-adf-pipeline": return "⚡";
      case "item": {
        // Snowflake object: label-based icon
        if (this.label.includes("VIEW")) return "👁️";
        if (this.label.includes("PROCEDURE") || this.label.includes("FUNCTION")) return "⚙️";
        if (this.label.includes("STREAM") || this.label.includes("PIPE")) return "🌊";
        if (this.label.includes("STAGE")) return "📥";
        return "📊";
      }
      default: return "📄";
    }
  }

  get subtitle(): string {
    switch (this.type) {
      case "azure-entra-user": return "User";
      case "azure-entra-group": return "Group";
      case "azure-entra-app": return "App Registration";
      case "azure-blob-directory":
      case "azure-blob-item":
      case "azure-container-repository": return "Blob Item";
      case "azure-devops-repo": return "Repository";
      case "azure-devops-pipeline":
      case "azure-adf-pipeline": return "Pipeline";
      case "item": {
        if (this.data && this.data.type) return this.data.type;
        return "Object";
      }
      default: return "";
    }
  }
}
