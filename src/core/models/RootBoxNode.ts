import { BoxNode } from "./BoxNodeBase";

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
