"use server";

import * as fs from "fs";
import * as crypto from "crypto";
import snowflake from "snowflake-sdk";
import { SnowflakeDatabase, SnowflakeSchema, SnowflakeObjectGroup, SnowflakeObject } from "../data/SnowflakeData";
import { getMockSnowflakeData } from "../data/mockData";
import { SnowflakeRole, SnowflakeRoleGraph } from "../data/SnowflakeRoleData";
import { getMockRoleData } from "../data/mockRoleData";

/**
 * Builds connection options for snowflake-sdk based on environment variables.
 *
 * Authentication modes (selected via SNOWFLAKE_AUTHENTICATOR):
 *   SNOWFLAKE_JWT (recommended for server-side):
 *     - SNOWFLAKE_PRIVATE_KEY_PATH = /path/to/rsa_key.p8
 *     - SNOWFLAKE_PRIVATE_KEY_PASSPHRASE = optional passphrase
 *     Snowflake now mandates MFA for password auth, so key-pair auth is the
 *     standard for headless usage.
 *   USERNAME_PASSWORD_MFA:
 *     - Standard password + MFA cache. Requires interactive first login;
 *       generally unsuitable for server processes.
 *   SNOWFLAKE (default if unset):
 *     - Plain password auth. Will fail on accounts with MFA enforced.
 *
 * Common parameters (all modes):
 *   SNOWFLAKE_ORGANIZATION, SNOWFLAKE_ACCOUNT, SNOWFLAKE_USERNAME
 *   SNOWFLAKE_ROLE, SNOWFLAKE_WAREHOUSE
 */
function buildConnectionOptions(extra?: { database?: string }): snowflake.ConnectionOptions | null {
  const org = process.env.SNOWFLAKE_ORGANIZATION;
  const targetAccount = process.env.SNOWFLAKE_ACCOUNT;
  const username = process.env.SNOWFLAKE_USERNAME;
  const account = (org && targetAccount) ? `${org}-${targetAccount}` : targetAccount;

  if (!account || !username) return null;

  const authenticator = (process.env.SNOWFLAKE_AUTHENTICATOR || "SNOWFLAKE").toUpperCase();

  const base: any = {
    account,
    username,
    authenticator,
    role: process.env.SNOWFLAKE_ROLE,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE,
    ...(extra?.database ? { database: extra.database } : {}),
  };

  if (authenticator === "SNOWFLAKE_JWT") {
    const keyPath = process.env.SNOWFLAKE_PRIVATE_KEY_PATH;
    if (!keyPath) {
      console.warn(
        "[Snowflake] SNOWFLAKE_AUTHENTICATOR=SNOWFLAKE_JWT requires SNOWFLAKE_PRIVATE_KEY_PATH."
      );
      return null;
    }

    // Verify the file is readable before handing the path off to the SDK,
    // so we get a clear "not found / permission denied" error rather than a
    // generic auth failure.
    try {
      fs.accessSync(keyPath, fs.constants.R_OK);
    } catch (e: any) {
      console.warn(`[Snowflake] Cannot read private key at ${keyPath}:`, e?.message || e);
      return null;
    }

    // Hand the key path (and optional passphrase) directly to snowflake-sdk.
    // The SDK calls crypto.createPrivateKey + export internally and skips the
    // strict isPrivateKey validator that runs when `privateKey` is set as a
    // string — that validator rejects valid PEMs whose trailing-whitespace
    // shape does not match its regex (e.g. when Node emits two trailing
    // newlines on certain platforms). Going via privateKeyPath is the
    // documented and most robust path.
    base.privateKeyPath = keyPath;

    // Trim the passphrase: .env values on Windows often pick up trailing CR
    // or whitespace from editors, which OpenSSL treats as a wrong passphrase
    // and reports as "interrupted or cancelled".
    const passphrase = process.env.SNOWFLAKE_PRIVATE_KEY_PASSPHRASE?.trim();
    if (passphrase) {
      base.privateKeyPass = passphrase;

      // Pre-flight: verify the key actually decrypts with this passphrase
      // before we hand it to the SDK. The SDK swallows this into a generic
      // libcrypto error; doing it here gives a clear actionable message.
      try {
        crypto.createPrivateKey({
          key: fs.readFileSync(keyPath),
          format: "pem",
          passphrase,
        });
      } catch (e: any) {
        console.warn(
          `[Snowflake] Failed to decrypt private key at ${keyPath} ` +
          `(passphrase length=${passphrase.length}). Check ` +
          `SNOWFLAKE_PRIVATE_KEY_PASSPHRASE in .env.local — common pitfalls: ` +
          `wrapping quotes, escaped characters, trailing CR/LF on Windows, ` +
          `or the key being unencrypted (then leave the passphrase blank). ` +
          `Original error:`,
          e?.message || e
        );
        return null;
      }
    }
  } else {
    // SNOWFLAKE / USERNAME_PASSWORD_MFA / etc — password required
    const password = process.env.SNOWFLAKE_PASSWORD;
    if (!password) return null;
    base.password = password;
  }

  return base as snowflake.ConnectionOptions;
}

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
  const targetDatabase = process.env.SNOWFLAKE_TARGET_DATABASE;

  const connOptions = buildConnectionOptions({ database: targetDatabase });
  if (!connOptions || !targetDatabase) {
    console.warn("⚠️ Snowflake credentials not fully configured in .env.local. Falling back to mock data.");
    const mockDbData = getMockSnowflakeData();
    mockDbData.schemas = sortSchemas(mockDbData.schemas);
    return mockDbData;
  }

  // Define Snowflake connection
  const connection = snowflake.createConnection(connOptions);

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

    return new SnowflakeDatabase(targetDatabase, sortSchemas(schemas), org, targetAccount || undefined);
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

type RoleFilterMode = "by-objects" | "all" | "system-only";

const SYSTEM_ROLE_NAMES = new Set([
  "ACCOUNTADMIN", "SECURITYADMIN", "SYSADMIN", "USERADMIN", "PUBLIC", "ORGADMIN",
]);

/**
 * Collects role names that are granted ANY privilege on the given object types.
 * Uses SHOW GRANTS ON DATABASE / SCHEMA / WAREHOUSE.
 * Errors (e.g., insufficient privilege on a particular object) are logged and skipped.
 */
async function fetchSeedRolesByObjects(
  connection: snowflake.Connection,
  targetDatabase: string,
  warehouses: string[]
): Promise<Set<string>> {
  const seed = new Set<string>();

  const collectGrantees = (rows: any[]) => {
    for (const r of rows) {
      const grantedTo = (r.granted_to || r.GRANTED_TO || "").toUpperCase();
      if (grantedTo !== "ROLE") continue;
      const grantee = (r.grantee_name || r.GRANTEE_NAME) as string | undefined;
      if (grantee) seed.add(grantee);
    }
  };

  // 1. Database-level grants
  try {
    const rows = await executeQuery(connection, `SHOW GRANTS ON DATABASE "${targetDatabase}"`);
    collectGrantees(rows);
  } catch (e: any) {
    console.warn(`[Roles] SHOW GRANTS ON DATABASE "${targetDatabase}" failed:`, e?.message || e);
  }

  // 2. Schema-level grants — discover schemas first
  let schemaNames: string[] = [];
  try {
    const rows = await executeQuery(connection, `SHOW SCHEMAS IN DATABASE "${targetDatabase}"`);
    schemaNames = rows
      .map((r: any) => (r.name || r.NAME) as string)
      .filter((n) => n && n !== "INFORMATION_SCHEMA");
  } catch (e: any) {
    console.warn(`[Roles] SHOW SCHEMAS IN DATABASE "${targetDatabase}" failed:`, e?.message || e);
  }

  await Promise.all(
    schemaNames.map(async (schemaName) => {
      try {
        const rows = await executeQuery(
          connection,
          `SHOW GRANTS ON SCHEMA "${targetDatabase}"."${schemaName}"`
        );
        collectGrantees(rows);
      } catch (e: any) {
        console.warn(`[Roles] SHOW GRANTS ON SCHEMA "${schemaName}" failed:`, e?.message || e);
      }
    })
  );

  // 3. Warehouse-level grants
  await Promise.all(
    warehouses.map(async (wh) => {
      try {
        const rows = await executeQuery(connection, `SHOW GRANTS ON WAREHOUSE "${wh}"`);
        collectGrantees(rows);
      } catch (e: any) {
        console.warn(`[Roles] SHOW GRANTS ON WAREHOUSE "${wh}" failed:`, e?.message || e);
      }
    })
  );

  return seed;
}

/**
 * Walks parent links upward via SHOW GRANTS OF ROLE, expanding the seed set
 * to include all ancestor roles. Returns a parent-map for every reachable role.
 *
 * Processes roles in waves with bounded parallelism (default 8) to avoid
 * overwhelming the Snowflake connection / warehouse.
 */
async function expandToAncestors(
  connection: snowflake.Connection,
  seed: Set<string>,
  concurrency = 8
): Promise<Map<string, string[]>> {
  const parentMap = new Map<string, string[]>();
  const visited = new Set<string>();
  let queue: string[] = Array.from(seed);

  const fetchParents = async (roleName: string): Promise<string[]> => {
    try {
      const grants = await executeQuery(
        connection,
        `SHOW GRANTS OF ROLE "${roleName}"`
      );
      return grants
        .filter((g: any) => (g.granted_to || g.GRANTED_TO || "").toUpperCase() === "ROLE")
        .map((g: any) => (g.grantee_name || g.GRANTEE_NAME) as string);
    } catch {
      // Ignore permission errors
      return [];
    }
  };

  while (queue.length > 0) {
    const nextWave: string[] = [];
    // Process current queue in chunks of `concurrency`
    for (let i = 0; i < queue.length; i += concurrency) {
      const chunk = queue.slice(i, i + concurrency).filter((r) => !visited.has(r));
      chunk.forEach((r) => visited.add(r));
      const results = await Promise.all(
        chunk.map(async (roleName) => ({ roleName, parents: await fetchParents(roleName) }))
      );
      for (const { roleName, parents } of results) {
        parentMap.set(roleName, parents);
        for (const p of parents) {
          if (!visited.has(p)) {
            seed.add(p);
            nextWave.push(p);
          }
        }
      }
    }
    queue = nextWave;
  }

  return parentMap;
}

/**
 * Fetches the role hierarchy from Snowflake, optionally filtered to roles
 * that touch the target database / its schemas / specific warehouses.
 *
 * Filter mode is controlled by SNOWFLAKE_ROLE_FILTER_MODE:
 *   "by-objects" (default): roles with grants on target DB / schemas / warehouses + ancestors
 *   "all":                  every role in the account (legacy behavior)
 *   "system-only":          only the 6 built-in system roles
 *
 * Falls back to mock data if credentials are not configured.
 */
export async function fetchSnowflakeRoles(): Promise<SnowflakeRoleGraph> {
  const org = process.env.SNOWFLAKE_ORGANIZATION;
  const targetAccount = process.env.SNOWFLAKE_ACCOUNT;
  const targetDatabase = process.env.SNOWFLAKE_TARGET_DATABASE;

  const connOptions = buildConnectionOptions({ database: targetDatabase });
  if (!connOptions) {
    console.warn("⚠️ Snowflake credentials not configured. Using mock role data.");
    return getMockRoleData();
  }

  const mode: RoleFilterMode =
    (process.env.SNOWFLAKE_ROLE_FILTER_MODE as RoleFilterMode) || "by-objects";

  const connection = snowflake.createConnection(connOptions);

  try {
    await new Promise<void>((resolve, reject) => {
      connection.connect((err) => (err ? reject(err) : resolve()));
    });

    // Always fetch SHOW ROLES for tier detection / properties lookup
    const rolesData = await executeQuery(connection, "SHOW ROLES");
    const rolePropsMap = new Map<string, any>();
    const allRoleNames: string[] = rolesData.map((r: any) => {
      const name = (r.name || r.NAME) as string;
      rolePropsMap.set(name, r);
      return name;
    });

    // Determine the seed set of roles based on filter mode
    let seed = new Set<string>();

    if (mode === "all") {
      allRoleNames.forEach((n) => seed.add(n));
    } else if (mode === "system-only") {
      for (const n of allRoleNames) {
        if (SYSTEM_ROLE_NAMES.has(n.toUpperCase())) seed.add(n);
      }
    } else {
      // by-objects (default)
      if (!targetDatabase) {
        console.warn(
          "[Roles] SNOWFLAKE_TARGET_DATABASE is not set. " +
          "by-objects mode requires it; falling back to system-only."
        );
        for (const n of allRoleNames) {
          if (SYSTEM_ROLE_NAMES.has(n.toUpperCase())) seed.add(n);
        }
      } else {
        // Resolve target warehouses: prefer SNOWFLAKE_TARGET_WAREHOUSES (CSV),
        // fallback to SNOWFLAKE_WAREHOUSE (single value).
        const whEnv = process.env.SNOWFLAKE_TARGET_WAREHOUSES;
        const warehouses = whEnv
          ? whEnv.split(",").map((s) => s.trim()).filter(Boolean)
          : (process.env.SNOWFLAKE_WAREHOUSE ? [process.env.SNOWFLAKE_WAREHOUSE] : []);

        seed = await fetchSeedRolesByObjects(connection, targetDatabase, warehouses);
        console.info(
          `[Roles] by-objects seed size = ${seed.size} ` +
          `(db="${targetDatabase}", warehouses=${JSON.stringify(warehouses)})`
        );
      }
    }

    // Expand seed to include all ancestor roles, building parent map along the way.
    // Bounded parallelism keeps this safe even when seed contains many roles.
    const parentMap = await expandToAncestors(connection, seed, 8);

    console.info(
      `[Roles] mode="${mode}" final role count = ${seed.size} ` +
      `(of ${allRoleNames.length} total in account)`
    );

    return {
      roles: Array.from(seed).map(
        (name) => new SnowflakeRole(name, parentMap.get(name) ?? [], rolePropsMap.get(name))
      ),
      organization: org,
      account: targetAccount,
    } as unknown as SnowflakeRoleGraph;
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
  const connOptions = buildConnectionOptions({ database: databaseName });
  if (!connOptions) {
    throw new Error("Snowflake credentials not configured.");
  }

  const connection = snowflake.createConnection(connOptions);

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
