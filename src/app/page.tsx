import React from "react";
import MainCanvasRenderer from "@/components/MainCanvasRenderer";
import SnowflakeContainerRenderer from "@/features/snowflake/components/SnowflakeContainerRenderer";
import TerraformClientRenderer from "@/features/terraform/components/TerraformClientRenderer";
import AzureBlobClientRenderer from "@/features/azure-blob/components/AzureBlobClientRenderer";
import { fetchSnowflakeData, fetchSnowflakeRoles } from "@/features/snowflake/services/snowflakeFetcher";
import { fetchTerraformStructure } from "@/features/terraform/services/terraformScanner";
import { fetchAzureBlobData } from "@/features/azure-blob/services/azureBlobFetcher";
import { fetchAdfData } from "@/features/azure-datafactory/services/adfFetcher";
import LogViewer from "@/components/LogViewer";
import { Logger } from "@/core/Logger";

export default async function Home() {
  // 1. Fetch Snowflake metadata from Server safely (Credentials hidden on server)
  // We skip layout computation here and pass the raw data down to the Client.
  // Next.js restricts passing Class instances from Server to Client Components,
  // so we strip the prototype by stringifying it into a plain object.
  const globalStartTime = Date.now();
  Logger.info("システム全体の構成情報（Architecture Canvas）のデータ取得を開始します...");
  let start = Date.now();

  let dbData: any = null;
  let dbError: string | null = null;
  try {
    start = Date.now();
    Logger.info("[Snowflake] データベース・メタデータの取得を開始します...");
    const dbDataClassInstance = await fetchSnowflakeData();
    dbData = JSON.parse(JSON.stringify(dbDataClassInstance));
    const count = dbData?.schemas?.length || 0;
    Logger.info(`[Snowflake] データベース・メタデータの取得を完了しました（スキーマ: ${count}件, 処理時間: ${Date.now() - start}ms）`);
  } catch (error: any) {
    dbError = error.message || "Snowflake データベースのメタデータ取得に失敗しました";
    Logger.error("[Snowflake] データベース・メタデータの取得に失敗しました:", error);
  }

  // 3. Fetch Terraform directory structure
  let terraformData = null;
  try {
    start = Date.now();
    Logger.info("[Terraform] ディレクトリ構成の走査を開始します...");
    const rawTerraformData = await fetchTerraformStructure();
    if (rawTerraformData) {
      terraformData = JSON.parse(JSON.stringify(rawTerraformData));
    }
    const dirCount = terraformData?.childDirectories?.length || 0;
    const fileCount = terraformData?.parsedFiles?.length || 0;
    Logger.info(`[Terraform] ディレクトリ構成の走査を完了しました（直下のディレクトリ: ${dirCount}件, 直下ファイル: ${fileCount}件, 処理時間: ${Date.now() - start}ms）`);
  } catch (error) {
    Logger.error("[Terraform] ディレクトリ構成の走査に失敗しました:", error);
  }

  // 4. Fetch Snowflake role hierarchy
  let roleData = null;
  let roleError: string | null = null;
  try {
    start = Date.now();
    Logger.info("[Snowflake] ロール階層データの取得を開始します...");
    const rawRoleData = await fetchSnowflakeRoles();
    roleData = JSON.parse(JSON.stringify(rawRoleData));
    const roleCount = roleData?.nodes?.length || 0;
    Logger.info(`[Snowflake] ロール階層データの取得を完了しました（ロール: ${roleCount}件, 処理時間: ${Date.now() - start}ms）`);
  } catch (error: any) {
    roleError = error.message || "Snowflake ロール階層の取得に失敗しました";
    Logger.error("[Snowflake] ロール階層データの取得に失敗しました:", error);
  }

  // 5. Fetch Azure Blob Storage metadata
  let azureBlobData = null;
  try {
    start = Date.now();
    Logger.info("[Azure] クラウドリソース・メタデータの取得を開始します...");
    const rawAzureBlobData = await fetchAzureBlobData();
    azureBlobData = JSON.parse(JSON.stringify(rawAzureBlobData));
    const userCount = azureBlobData?.users?.length || 0;
    const devOpsCount = azureBlobData?.devOps?.length || 0;
    Logger.info(`[Azure] クラウドリソース・メタデータの取得を完了しました（Entraユーザー: ${userCount}件, DevOps組織: ${devOpsCount}件, 処理時間: ${Date.now() - start}ms）`);
  } catch (error) {
    Logger.error("[Azure] クラウドリソース・メタデータの取得に失敗しました:", error);
  }

  // 6. Fetch Azure Data Factory metadata
  let adfData = null;
  try {
    start = Date.now();
    Logger.info("[ADF] Data Factory メタデータの取得を開始します...");
    const rawAdfData = await fetchAdfData();
    adfData = JSON.parse(JSON.stringify(rawAdfData));
    const pipelineCount = adfData?.pipelines?.length || 0;
    Logger.info(`[ADF] Data Factory メタデータの取得を完了しました（パイプライン: ${pipelineCount}件, 処理時間: ${Date.now() - start}ms）`);
  } catch (error) {
    Logger.error("[ADF] Data Factory メタデータの取得に失敗しました:", error);
  }

  Logger.info(`システム全体のデータ取得がすべて完了しました（総処理時間: ${Date.now() - globalStartTime}ms）`);

  return (
    <div style={{ padding: 0, margin: 0, height: "100vh", overflow: "hidden", fontFamily: "sans-serif" }}>
      <main style={{ height: "100%", width: "100%" }}>
        {/*
          Global Canvas.
          Currently hosts Snowflake and Terraform structures side-by-side.
        */}
        <MainCanvasRenderer width={5000} height={2000}>
           {/* Snowflake: DB + Role diagram inside a single container box */}
           {(dbData || dbError) && (
             <SnowflakeContainerRenderer
               dbData={dbData}
               roleData={roleData}
               dbError={dbError}
               roleError={roleError}
               rootX={0}
               rootY={0}
             />
           )}

           {/* Terraform: right column (x=1500) */}
           {terraformData && (
             <TerraformClientRenderer dirData={terraformData} rootX={1500} rootY={0} />
           )}

           {/* Azure Blob: further right column (x=3000) */}
           {azureBlobData && (
             <AzureBlobClientRenderer dbData={azureBlobData} rootX={3000} rootY={0} />
           )}
        </MainCanvasRenderer>
        <LogViewer />
      </main>
    </div>
  );
}
