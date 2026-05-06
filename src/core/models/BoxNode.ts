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

export abstract class BranchBoxNode extends BoxNode {
  get strokeWidth(): number {
    return 2;
  }
}

export abstract class LeafBoxNode extends BoxNode {
  get strokeWidth(): number {
    return 1.5;
  }
}
