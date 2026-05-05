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
  let dbData: any = null;
  try {
    const dbDataClassInstance = await fetchSnowflakeData();
    dbData = JSON.parse(JSON.stringify(dbDataClassInstance));
  } catch (error) {
    Logger.error("Snowflake DB fetch error:", error);
  }

  // 3. Fetch Terraform directory structure
  let terraformData = null;
  try {
    const rawTerraformData = await fetchTerraformStructure();
    if (rawTerraformData) {
      terraformData = JSON.parse(JSON.stringify(rawTerraformData));
    }
  } catch (error) {
    Logger.error("Terraform scan error:", error);
  }

  // 4. Fetch Snowflake role hierarchy
  let roleData = null;
  try {
    const rawRoleData = await fetchSnowflakeRoles();
    roleData = JSON.parse(JSON.stringify(rawRoleData));
  } catch (error) {
    Logger.error("Snowflake role fetch error:", error);
  }

  // 5. Fetch Azure Blob Storage metadata
  let azureBlobData = null;
  try {
    const rawAzureBlobData = await fetchAzureBlobData();
    azureBlobData = JSON.parse(JSON.stringify(rawAzureBlobData));
  } catch (error) {
    Logger.error("Azure Blob fetch error:", error);
  }

  // 6. Fetch Azure Data Factory metadata
  let adfData = null;
  try {
    const rawAdfData = await fetchAdfData();
    adfData = JSON.parse(JSON.stringify(rawAdfData));
  } catch (error) {
    Logger.error("Azure Data Factory fetch error:", error);
  }

  return (
    <div style={{ padding: 0, margin: 0, height: "100vh", overflow: "hidden", fontFamily: "sans-serif" }}>
      <main style={{ height: "100%", width: "100%" }}>
        {/*
          Global Canvas.
          Currently hosts Snowflake and Terraform structures side-by-side.
        */}
        <MainCanvasRenderer width={5000} height={2000}>
           {/* Snowflake: DB + Role diagram inside a single container box */}
           {dbData && (
             <SnowflakeContainerRenderer
               dbData={dbData}
               roleData={roleData}
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
