import { IDrawingNode } from "@/core/interfaces";

export abstract class BoxNode implements IDrawingNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  label: string;
  children?: IDrawingNode[];
  data?: any;

  constructor(params: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    type: string;
    label: string;
    children?: IDrawingNode[];
    data?: any;
  }) {
    this.id = params.id;
    this.x = params.x;
    this.y = params.y;
    this.width = params.width;
    this.height = params.height;
    this.type = params.type;
    this.label = params.label;
    this.children = params.children;
    this.data = params.data;
  }

  // Abstract properties that specific nodes will implement
  abstract get icon(): string;
  abstract get subtitle(): string;
  abstract get strokeWidth(): number;
}

export class RootBoxNode extends BoxNode {
  get strokeWidth(): number {
    return 3;
  }

  get icon(): string {
    switch (this.type) {
      case "azure-entra-root": return "/microsoft_entra.svg";
      case "azure-arm-root": return "/azure_portal.svg";
      case "azure-devops-root": return "/azure_devops.svg";
      case "snowflake-database": return "/database.svg";
      case "terraform-root": return "/terraform.svg";
      default: return "";
    }
  }

  get subtitle(): string {
    switch (this.type) {
      case "azure-entra-root": return "Microsoft Entra ID";
      case "azure-arm-root": return "Azure Resource Manager";
      case "azure-devops-root": return "Azure DevOps";
      case "snowflake-database": return "Database";
      case "terraform-root": return "Terraform Root";
      default: return "";
    }
  }
}

export class BranchBoxNode extends BoxNode {
  get strokeWidth(): number {
    return 2;
  }

  get icon(): string {
    switch (this.type) {
      // Azure Entra
      case "azure-entra-users-container":
      case "azure-entra-groups-container":
      case "azure-entra-apps-container": return "🗂";
      // Azure ARM
      case "azure-management-group": return "🏢";
      case "azure-subscription": return "🔑";
      case "azure-resource-group": return "📦";
      case "azure-blob-account": return "🗄️";
      case "azure-blob-container": return "📁";
      case "azure-batch": return "⚙️";
      case "azure-acr": return "📦";
      case "azure-adf": return "🏭";
      // Azure DevOps
      case "azure-devops-container": return "🏢";
      // Snowflake
      case "snowflake-schema": return "📁";
      case "snowflake-group": return "🗂";
      // Terraform
      case "terraform-dir": return "📁";
      case "terraform-column": return "🗂";
      case "tf-file": return "📄";
      default: return "";
    }
  }

  get subtitle(): string {
    switch (this.type) {
      case "azure-entra-users-container": return "Container";
      case "azure-entra-groups-container": return "Container";
      case "azure-entra-apps-container": return "Container";
      case "azure-management-group": return "Management Group";
      case "azure-subscription": return "Subscription";
      case "azure-resource-group": return "Resource Group";
      case "azure-blob-account": return "Storage Account";
      case "azure-blob-container": return "Blob Container";
      case "azure-batch": return "Batch Account";
      case "azure-acr": return "Container Registry";
      case "azure-adf": return "Data Factory";
      case "azure-devops-container": return "Organization";
      case "snowflake-schema": return "Schema";
      case "snowflake-group": return "Group";
      case "terraform-dir": return "Directory";
      case "terraform-column": return "Column";
      case "tf-file": return "Terraform File";
      default: return "";
    }
  }
}

export abstract class LeafBoxNode extends BoxNode {
  get strokeWidth(): number {
    return 1.5;
  }
}

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

/**
 * LeafBoxNodeRoleItem
 * ロール表示専用。Snowflake ロールなど。
 */
export class LeafBoxNodeRoleItem extends LeafBoxNode {
  get icon(): string { return "👤"; }
  get subtitle(): string { return "Role"; }
}

/**
 * LeafBoxNodeTerraformItem
 * Terraform ブロックアイテム専用。
 */
export class LeafBoxNodeTerraformItem extends LeafBoxNode {
  get icon(): string { return "📦"; }
  get subtitle(): string { return "Block"; }
}
