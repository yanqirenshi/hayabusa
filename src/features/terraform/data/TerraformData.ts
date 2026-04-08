import { IDataClass } from "@/core/interfaces";

// Unified component for parsed Terraform blocks
export interface TfItem {
  blockType: "resource" | "data" | "output" | "variable" | "locals" | "module" | "provider";
  index: number;
  type?: string; 
  name: string;
  content: string;
}

export class TerraformFile {
  constructor(
    public name: string,
    public variables: TfItem[] = [],
    public resources: TfItem[] = [],
    public outputs: TfItem[] = []
  ) {}
}

// Recursive class for deeply nested directories
export class TerraformDirectory implements IDataClass {
  constructor(
    public name: string,
    public path: string,
    public children: TerraformDirectory[],
    public files: TerraformFile[] = []
  ) {}
}
