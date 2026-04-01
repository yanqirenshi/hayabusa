import { IDataClass } from "@/core/interfaces";

export class SnowflakeObject {
  constructor(
    public name: string,
    public type: "Table" | "View" | "Stage" | "FileFormat" | string
  ) {}
}

// Group objects by type (like "Table" or "View")
export class SnowflakeObjectGroup {
  constructor(
    public type: string,
    public objects: SnowflakeObject[]
  ) {}
}

export class SnowflakeSchema {
  constructor(
    public name: string,
    public objectGroups: SnowflakeObjectGroup[]
  ) {}
}

export class SnowflakeDatabase implements IDataClass {
  constructor(
    public name: string,
    public schemas: SnowflakeSchema[]
  ) {}
}
