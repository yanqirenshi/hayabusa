"use server";

import snowflake from "snowflake-sdk";
import { SnowflakeDatabase, SnowflakeSchema, SnowflakeObjectGroup, SnowflakeObject } from "../data/SnowflakeData";
import { getMockSnowflakeData } from "../data/mockData";
import { SnowflakeRole, SnowflakeRoleGraph } from "../data/SnowflakeRoleData";
import { getMockRoleData } from "../data/mockRoleData";

/**
 * Sorts schemas according to the SNOWFLAKE_SCHEMA_ORDER environment variable or alphabetically.
 */
function sortSchemas(schemas: SnowflakeSchema[]): SnowflakeSchema[] {
  const orderEnv = process.env.SNOWFLAKE_SCHEMA_ORDER;
  if (orderEnv) {
    const orderList = orderEnv.split(',').map((s) => s.trim().toUpperCase());
    return schemas.sort((a, b) => {
      const idxA = orderList.indexOf(a.name.toUpperCase());
      const idxB = orderList.indexOf(b.name.toUpperCase());

      // If both are in the requested order list, sort by their position
      if (idxA >= 0 && idxB >= 0) return idxA - idxB;
      // If only a is in the list, it comes first
      if (idxA >= 0) return -1;
      // If only b is in the list, it comes first
      if (idxB >= 0) return 1;
      
      // Fallback: alphabetical sort
      return a.name.localeCompare(b.name);
    });
  } else {
    // Default: alphabetical sort
    return schemas.sort((a, b) => a.name.localeCompare(b.name));
  }
}

/**
 * Executes a snowflake query and returns the results
 */
function executeQuery(connection: snowflake.Connection, sqlText: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText,
      complete: (err, stmt, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      },
    });
  });
}

/**
 * Fetches the database architecture from Snowflake.
 * Note: Falls back to mock data if no Snowflake credentials are set in .env.local
 */
export async function fetchSnowflakeData(): Promise<SnowflakeDatabase> {
  const org = process.env.SNOWFLAKE_ORGANIZATION;
  const targetAccount = process.env.SNOWFLAKE_ACCOUNT;
  const username = process.env.SNOWFLAKE_USERNAME;
  const password = process.env.SNOWFLAKE_PASSWORD;
  const targetDatabase = process.env.SNOWFLAKE_TARGET_DATABASE;

  // ORG と ACCOUNT が両方存在すれば "org-account" の形式で結合する
  // (もし単体に "org-acc" と全て書いていた場合などを考慮したフォールバック)
  const account = (org && targetAccount) ? `${org}-${targetAccount}` : targetAccount;

  if (!account || !username || !password || !targetDatabase) {
    console.warn("⚠️ Snowflake credentials not fully configured in .env.local. Falling back to mock data.");
    const mockDbData = getMockSnowflakeData();
    mockDbData.schemas = sortSchemas(mockDbData.schemas);
    return mockDbData;
  }

  // Define Snowflake connection
  const connection = snowflake.createConnection({
    account,
    username,
    password,
    role: process.env.SNOWFLAKE_ROLE,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE,
    database: targetDatabase,
  });

  try {
    // 1. Establish connection
    await new Promise<void>((resolve, reject) => {
      connection.connect((err, conn) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // 2. Fetch Schemas
    const schemasData = await executeQuery(connection, `SHOW SCHEMAS IN DATABASE "${targetDatabase}"`);
    const schemaNames = schemasData
      .map((row: any) => row.name || row.NAME)
      .filter((name) => name && name !== "INFORMATION_SCHEMA");

    // 3. For each schema, fetch its objects concurrently
    const schemas: SnowflakeSchema[] = [];

    // Snowflake でサポートされている主要なスキーマレベルオブジェクトのリスト
    const targetObjectTypes = [
      { type: "TABLES", label: "Table" },
      { type: "VIEWS", label: "View" },
      { type: "MATERIALIZED VIEWS", label: "Materialized View" },
      { type: "STAGES", label: "Stage" },
      { type: "FILE FORMATS", label: "ファイル形式" },
      { type: "PIPES", label: "Pipe" },
      { type: "STREAMS", label: "Stream" },
      { type: "TASKS", label: "Task" },
      { type: "SEQUENCES", label: "Sequence" },
      { type: "PROCEDURES", label: "Procedure" },
      { type: "FUNCTIONS", label: "Function" }
    ];

    for (const schemaName of schemaNames) {
      // 全種類のオブジェクトを並列でフェッチ（権限エラー等で落ちないように catch で空配列を返す）
      const queries = targetObjectTypes.map((ot) =>
        executeQuery(connection, `SHOW ${ot.type} IN SCHEMA "${targetDatabase}"."${schemaName}"`).catch((e) => {
          console.warn(`⚠️ Could not fetch ${ot.type} in ${schemaName}:`, e.message);
          return [];
        })
      );

      const results = await Promise.all(queries);

      const objectGroups: SnowflakeObjectGroup[] = [];

      results.forEach((data, index) => {
        if (data && data.length > 0) {
          // 自動生成されるデフォルト・システムオブジェクト（SYSTEM$... やビルトイン関数）を除外する
          const filteredData = data.filter((item: any) => {
            const itemName = item.name || item.NAME || "";
            const isBuiltin = item.is_builtin || item.IS_BUILTIN || "N";
            return !itemName.toUpperCase().startsWith("SYSTEM$") && isBuiltin !== "Y";
          });

          if (filteredData.length > 0) {
            objectGroups.push(
              new SnowflakeObjectGroup(
                targetObjectTypes[index].label,
                filteredData.map((item: any) => new SnowflakeObject(item.name || item.NAME, targetObjectTypes[index].label, item, targetDatabase, schemaName))
              )
            );
          }
        }
      });

      schemas.push(new SnowflakeSchema(schemaName, objectGroups));
    }

    return new SnowflakeDatabase(targetDatabase, sortSchemas(schemas), org, targetAccount);
  } catch (error: any) {
    console.error("Snowflake fetch error:", error);
    throw new Error(`Failed to fetch Snowflake data: ${error.message || JSON.stringify(error)}`);
  } finally {
    // Ensure connection is closed
    if (connection.isUp()) {
      connection.destroy((err, conn) => {
         if(err) console.error("Error closing Snowflake connection", err);
      });
    }
  }
}

/**
 * Fetches the role hierarchy from Snowflake.
 * Falls back to mock data if credentials are not configured.
 */
export async function fetchSnowflakeRoles(): Promise<SnowflakeRoleGraph> {
  const org = process.env.SNOWFLAKE_ORGANIZATION;
  const targetAccount = process.env.SNOWFLAKE_ACCOUNT;
  const username = process.env.SNOWFLAKE_USERNAME;
  const password = process.env.SNOWFLAKE_PASSWORD;
  const account = (org && targetAccount) ? `${org}-${targetAccount}` : targetAccount;

  if (!account || !username || !password) {
    console.warn("⚠️ Snowflake credentials not configured. Using mock role data.");
    return getMockRoleData();
  }

  const connection = snowflake.createConnection({ account, username, password });

  try {
    await new Promise<void>((resolve, reject) => {
      connection.connect((err) => (err ? reject(err) : resolve()));
    });

    // 1. Fetch all roles
    const rolesData = await executeQuery(connection, "SHOW ROLES");
    const rolePropsMap = new Map<string, any>();
    const roleNames: string[] = rolesData.map((r: any) => {
      const name = (r.name || r.NAME) as string;
      rolePropsMap.set(name, r);
      return name;
    });

    // 2. For each role, fetch what roles it's been granted TO (= its parent roles)
    const roleMap = new Map<string, string[]>(); // roleName -> parentRoleNames
    for (const roleName of roleNames) {
      roleMap.set(roleName, []);
    }

    await Promise.all(
      roleNames.map(async (roleName) => {
        try {
          const grants = await executeQuery(
            connection,
            `SHOW GRANTS OF ROLE "${roleName}"`
          );
          const parentRoles = grants
            .filter((g: any) => {
              const grantedTo = (g.granted_to || g.GRANTED_TO || "").toUpperCase();
              return grantedTo === "ROLE";
            })
            .map((g: any) => (g.grantee_name || g.GRANTEE_NAME) as string);
          roleMap.set(roleName, parentRoles);
        } catch {
          // Ignore permission errors
        }
      })
    );

    return {
      roles: Array.from(roleMap.entries()).map(
        ([name, parents]) => new SnowflakeRole(name, parents, rolePropsMap.get(name))
      ),
      organization: org,
      account: targetAccount
    };
  } catch (error: any) {
    console.error("Snowflake role fetch error:", error);
    throw new Error(`Failed to fetch Snowflake roles: ${error.message}`);
  } finally {
    if (connection.isUp()) {
      connection.destroy((err) => {
        if (err) console.error("Error closing Snowflake connection", err);
      });
    }
  }
}

/**
 * Fetches the DDL (CREATE statement) for a specific Snowflake object
 */
export async function fetchSnowflakeDDL(objectType: string, databaseName: string, schemaName: string, objectName: string): Promise<string> {
  const org = process.env.SNOWFLAKE_ORGANIZATION;
  const targetAccount = process.env.SNOWFLAKE_ACCOUNT;
  const username = process.env.SNOWFLAKE_USERNAME;
  const password = process.env.SNOWFLAKE_PASSWORD;
  const account = (org && targetAccount) ? `${org}-${targetAccount}` : targetAccount;

  if (!account || !username || !password) {
    throw new Error("Snowflake credentials not configured.");
  }

  const connection = snowflake.createConnection({
    account,
    username,
    password,
    role: process.env.SNOWFLAKE_ROLE,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE,
    database: databaseName,
  });

  try {
    await new Promise<void>((resolve, reject) => {
      connection.connect((err) => (err ? reject(err) : resolve()));
    });

    let ddlType = objectType.toUpperCase();
    if (ddlType === "MATERIALIZED VIEW") ddlType = "VIEW";

    const fullPath = `"${databaseName}"."${schemaName}"."${objectName}"`;
    const sqlText = `SELECT GET_DDL('${ddlType}', '${fullPath}') AS DDL`;

    const results = await executeQuery(connection, sqlText);
    if (results && results.length > 0) {
      return results[0].DDL || results[0].ddl || "";
    }
    return "";
  } catch (error: any) {
    console.error(`Snowflake GET_DDL fetch error for ${objectName}:`, error);
    throw new Error(`Failed to fetch DDL: ${error.message}`);
  } finally {
    if (connection.isUp()) {
      connection.destroy((err) => {
        if (err) console.error("Error closing Snowflake connection", err);
      });
    }
  }
}
