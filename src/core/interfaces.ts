export interface IDataClass {
  // Base interface for all raw data structures
}

export interface IDrawingNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  type: string;
  children?: IDrawingNode[];
  data?: any;
}

export interface IDrawingEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
}

export interface IDrawingClass {
  // Base interface for drawing structures that D3 will consume
  nodes: IDrawingNode[];
  edges?: IDrawingEdge[];
  links?: any[];
}
