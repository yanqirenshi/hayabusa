import { IDataClass } from "@/core/interfaces";

// Individual components parsed from `.tf` files
export interface TfVariable {
  name: string;
}

export interface TfOutput {
  name: string;
}

export interface TfResource {
  type: string;
  name: string;
}

export class TerraformFile {
  constructor(
    public name: string,
    public variables: TfVariable[] = [],
    public resources: TfResource[] = [],
    public outputs: TfOutput[] = []
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
