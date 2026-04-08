import { IDataClass } from "@/core/interfaces";

export type AdfActivityType =
  | "Copy"
  | "DataFlow"
  | "ExecutePipeline"
  | "Lookup"
  | "GetMetadata"
  | "IfCondition"
  | "ForEach"
  | "Wait"
  | "WebActivity"
  | "SetVariable"
  | string;

export class AdfActivity {
  constructor(
    public name: string,
    public type: AdfActivityType,
  ) {}
}

export class AdfPipeline {
  constructor(
    public name: string,
    public activities: AdfActivity[],
  ) {}
}

export class AdfFactory implements IDataClass {
  constructor(
    public factoryName: string,
    public pipelines: AdfPipeline[],
  ) {}
}
