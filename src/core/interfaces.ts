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
}

export interface IDrawingClass {
  // Base interface for drawing structures that D3 will consume
  nodes: IDrawingNode[];
  // links can be added later if relationships (like ER connections) are needed
  links?: any[];
}
