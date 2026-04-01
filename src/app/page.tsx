import React from "react";
import MainCanvasRenderer from "@/components/MainCanvasRenderer";
import SnowflakeClientRenderer from "@/features/snowflake/components/SnowflakeClientRenderer";
import TerraformClientRenderer from "@/features/terraform/components/TerraformClientRenderer";
import { fetchSnowflakeData } from "@/features/snowflake/services/snowflakeFetcher";
import { fetchTerraformStructure } from "@/features/terraform/services/terraformScanner";

export default async function Home() {
  // 1. Fetch Snowflake metadata from Server safely (Credentials hidden on server)
  const dbDataClassInstance = await fetchSnowflakeData();
  
  // 2. We skip layout computation here and pass the raw data down to the Client.
  // Next.js restricts passing Class instances from Server to Client Components.
  // We strip the prototype by stringifying it into a plain object.
  const dbData = JSON.parse(JSON.stringify(dbDataClassInstance));

  // 3. Fetch Terraform directory structure
  let terraformData = null;
  try {
    const rawTerraformData = await fetchTerraformStructure();
    if (rawTerraformData) {
      terraformData = JSON.parse(JSON.stringify(rawTerraformData));
    }
  } catch (error) {
    console.error("Terraform scan error:", error);
  }

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontWeight: 600, fontSize: "2rem", marginBottom: "0.5rem" }}>
        Hayabusa System Architecture (Unified Canvas)
      </h1>
      <p style={{ marginBottom: "2rem", color: "#666" }}>
        Data Pipeline, Data Model, and Infrastructure Visualization
      </p>

      <main>
        {/*
          Global Canvas.
          Currently hosts Snowflake and Terraform structures side-by-side.
        */}
        <MainCanvasRenderer width={3000} height={2000}>
           {/* Snowflake goes on the left (x=0) */}
           <SnowflakeClientRenderer dbData={dbData} />

           {/* Terraform goes on the right (x=1500) if available */}
           {terraformData && (
             <TerraformClientRenderer dirData={terraformData} rootX={1500} rootY={0} />
           )}
        </MainCanvasRenderer>
      </main>
    </div>
  );
}
