"use server";

import snowflake from "snowflake-sdk";
import { SnowflakeDatabase, SnowflakeSchema, SnowflakeObjectGroup, SnowflakeObject } from "../data/SnowflakeData";
import { getMockSnowflakeData } from "../data/mockData";

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
    return getMockSnowflakeData();
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
          objectGroups.push(
            new SnowflakeObjectGroup(
              targetObjectTypes[index].label,
              data.map((item: any) => new SnowflakeObject(item.name || item.NAME, targetObjectTypes[index].label))
            )
          );
        }
      });

      schemas.push(new SnowflakeSchema(schemaName, objectGroups));
    }

    return new SnowflakeDatabase(targetDatabase, schemas);
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
