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

export abstract class RootBoxNode extends BoxNode {
  get strokeWidth(): number {
    return 3;
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
