import { IDataClass } from "@/core/interfaces";

export type RoleTier = "system" | "functional" | "access" | "custom";

const SYSTEM_ROLE_NAMES = new Set([
  "ACCOUNTADMIN", "SECURITYADMIN", "SYSADMIN", "USERADMIN", "PUBLIC", "ORGADMIN",
]);

// デフォルトパターン: サフィックス (_FR / _AR) とプレフィックス (MRG_F_ / FR_ / MRG_A_)
const DEFAULT_FUNCTIONAL_PATTERN = "_FR$|_F_|^FR_";
const DEFAULT_ACCESS_PATTERN = "_AR$|_A_";

let functionalRegex: RegExp | null = null;
let accessRegex: RegExp | null = null;

function buildTierRegex(): void {
  if (functionalRegex !== null) return; // already built
  const funcPattern = (typeof process !== "undefined" && process.env?.SNOWFLAKE_ROLE_TIER_FUNCTIONAL)
    || DEFAULT_FUNCTIONAL_PATTERN;
  const accPattern = (typeof process !== "undefined" && process.env?.SNOWFLAKE_ROLE_TIER_ACCESS)
    || DEFAULT_ACCESS_PATTERN;
  try {
    functionalRegex = new RegExp(funcPattern, "i");
  } catch {
    functionalRegex = new RegExp(DEFAULT_FUNCTIONAL_PATTERN, "i");
  }
  try {
    accessRegex = new RegExp(accPattern, "i");
  } catch {
    accessRegex = new RegExp(DEFAULT_ACCESS_PATTERN, "i");
  }
}

export function detectRoleTier(name: string): RoleTier {
  const upper = name.toUpperCase();
  if (SYSTEM_ROLE_NAMES.has(upper)) return "system";
  buildTierRegex();
  if (functionalRegex!.test(upper)) return "functional";
  if (accessRegex!.test(upper)) return "access";
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
  organization?: string;
  account?: string;
}
