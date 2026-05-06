import { RootBoxNode, BranchBoxNode, LeafBoxNode } from "@/core/models/BoxNode";
import { IDrawingNode } from "@/core/interfaces";

// === Entra ID Nodes ===

export class AzureEntraContainer extends BranchBoxNode {
  get icon() { return "🗂"; }
  get subtitle() { return "Container"; }
}

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


export class AzureManagementGroupNode extends BranchBoxNode {
  get icon() { return "🏢"; }
  get subtitle() { return "Management Group"; }
}

export class AzureSubscriptionNode extends BranchBoxNode {
  get icon() { return "🔑"; }
  get subtitle() { return "Subscription"; }
}

export class AzureResourceGroupNode extends BranchBoxNode {
  get icon() { return "📦"; }
  get subtitle() { return "Resource Group"; }
}

export class AzureStorageAccountNode extends BranchBoxNode {
  get icon() { return "🗄️"; }
  get subtitle() { return "Storage Account"; }
}

export class AzureBlobContainerNode extends BranchBoxNode {
  get icon() { return "📁"; }
  get subtitle() { return "Blob Container"; }
}

export class AzureBlobItemNode extends LeafBoxNode {
  get icon() { return "📄"; }
  get subtitle() { return "Blob Item"; }
}

export class AzureBatchNode extends BranchBoxNode {
  get icon() { return "⚙️"; }
  get subtitle() { return "Batch Account"; }
}

export class AzureContainerRegistryNode extends BranchBoxNode {
  get icon() { return "📦"; }
  get subtitle() { return "Container Registry"; }
}

export class AzureDataFactoryNode extends BranchBoxNode {
  get icon() { return "🏭"; }
  get subtitle() { return "Data Factory"; }
}

// === DevOps Nodes ===


export class AzureDevOpsOrganizationNode extends BranchBoxNode {
  get icon() { return "🏢"; }
  get subtitle() { return "Organization"; }
}

export class AzureDevOpsRepoNode extends LeafBoxNode {
  get icon() { return "🌿"; }
  get subtitle() { return "Repository"; }
}

export class AzureDevOpsPipelineNode extends LeafBoxNode {
  get icon() { return "⚡"; }
  get subtitle() { return "Pipeline"; }
}
