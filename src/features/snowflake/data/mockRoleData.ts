import { SnowflakeRole, SnowflakeRoleGraph } from "./SnowflakeRoleData";

/**
 * Mock role hierarchy matching the diagram provided by the user.
 *
 * Hierarchy:
 *   System:     ACCOUNTADMIN → SECURITYADMIN → USERADMIN
 *                            → SYSADMIN
 *   Functional: SYSADMIN → UKIYO_DEVELOPER_FR, UKIYO_PIPELINE_FR, UKIYO_VIEWER_FR
 *   Access:     DEVELOPER_FR / PIPELINE_FR → RAW_RW_AR, DWH_RW_AR, MART_RW_AR
 *               VIEWER_FR → MART_RO_AR
 */
export function getMockRoleData(): SnowflakeRoleGraph {
  return new SnowflakeRoleGraph([
    // System
    new SnowflakeRole("ACCOUNTADMIN",    []),
    new SnowflakeRole("SECURITYADMIN",   ["ACCOUNTADMIN"]),
    new SnowflakeRole("SYSADMIN",        ["ACCOUNTADMIN"]),
    new SnowflakeRole("USERADMIN",       ["SECURITYADMIN"]),
    // Functional
    new SnowflakeRole("UKIYO_DEVELOPER_FR", ["SYSADMIN"]),
    new SnowflakeRole("UKIYO_PIPELINE_FR",  ["SYSADMIN"]),
    new SnowflakeRole("UKIYO_VIEWER_FR",    ["SYSADMIN"]),
    // Access
    new SnowflakeRole("UKIYO_RAW_RW_AR",  ["UKIYO_DEVELOPER_FR", "UKIYO_PIPELINE_FR"]),
    new SnowflakeRole("UKIYO_DWH_RW_AR",  ["UKIYO_DEVELOPER_FR", "UKIYO_PIPELINE_FR"]),
    new SnowflakeRole("UKIYO_MART_RW_AR", ["UKIYO_DEVELOPER_FR", "UKIYO_PIPELINE_FR"]),
    new SnowflakeRole("UKIYO_MART_RO_AR", ["UKIYO_VIEWER_FR"]),
  ]);
}
