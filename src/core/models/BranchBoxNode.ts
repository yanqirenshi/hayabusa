import { BoxNode } from "./BoxNodeBase";

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
