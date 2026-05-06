import { BoxNode } from "./BoxNodeBase";

export abstract class LeafBoxNode extends BoxNode {
  get strokeWidth(): number {
    return 1.5;
  }
}
