import { RootBoxNode, BranchBoxNode, LeafBoxNode } from "@/core/models/BoxNode";
import { IDrawingNode } from "@/core/interfaces";


export class TerraformDirNode extends BranchBoxNode {
  get icon() { return "📁"; }
  get subtitle() { return "Directory"; }
}

export class TerraformColumnNode extends BranchBoxNode {
  get icon() { return "🗂"; }
  get subtitle() { return "Column"; }
}

export class TerraformFileNode extends BranchBoxNode {
  get icon() { return "📄"; }
  get subtitle() { return "Terraform File"; }
}

export class TerraformBlockNode extends LeafBoxNode {
  get icon() { return "📦"; } // Actually not used by original tf-block-list renderer, but added for completeness
  get subtitle() { return "Block"; }
}
