import { RootBoxNode, LeafBoxNode } from "@/core/models/BoxNode";
import { IDrawingNode } from "@/core/interfaces";

// === Entra ID Nodes ===

export class AzureEntraUser extends LeafBoxNode {
  get icon() { return "👤"; }
  get subtitle() { return "User"; }
}

export class AzureEntraGroup extends LeafBoxNode {
  get icon() { return "👥"; }
  get subtitle() { return "Group"; }
}

export class AzureEntraApp extends LeafBoxNode {
  get icon() { return "📱"; }
  get subtitle() { return "App Registration"; }
}

// === ARM Nodes ===

export class AzureBlobItemNode extends LeafBoxNode {
  get icon() { return "📄"; }
  get subtitle() { return "Blob Item"; }
}

// === DevOps Nodes ===

export class AzureDevOpsRepoNode extends LeafBoxNode {
  get icon() { return "🌿"; }
  get subtitle() { return "Repository"; }
}

export class AzureDevOpsPipelineNode extends LeafBoxNode {
  get icon() { return "⚡"; }
  get subtitle() { return "Pipeline"; }
}
