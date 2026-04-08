import { IDataClass } from "@/core/interfaces";

export type RoleTier = "system" | "functional" | "access" | "custom";

const SYSTEM_ROLE_NAMES = new Set([
  "ACCOUNTADMIN", "SECURITYADMIN", "SYSADMIN", "USERADMIN", "PUBLIC", "ORGADMIN",
]);

export function detectRoleTier(name: string): RoleTier {
  const upper = name.toUpperCase();
  if (SYSTEM_ROLE_NAMES.has(upper)) return "system";
  if (upper.endsWith("_FR")) return "functional";
  if (upper.endsWith("_AR")) return "access";
  return "custom";
}

export class SnowflakeRole {
  public tier: RoleTier;
  constructor(
    public name: string,
    public parentRoles: string[] = [],
    public properties?: any
  ) {
    this.tier = detectRoleTier(name);
  }
}

export class SnowflakeRoleGraph implements IDataClass {
  constructor(public roles: SnowflakeRole[]) {}
}

// Server → Client serialization shape (JSON.parse(JSON.stringify(...)))
export interface RolePOJO {
  name: string;
  tier: RoleTier;
  parentRoles: string[];
  properties?: any;
}

export interface RoleGraphPOJO {
  roles: RolePOJO[];
}
