import React from "react";
import MainCanvasRenderer from "@/components/MainCanvasRenderer";
import SnowflakeClientRenderer from "@/features/snowflake/components/SnowflakeClientRenderer";
import { fetchSnowflakeData } from "@/features/snowflake/services/snowflakeFetcher";

export default async function Home() {
  // 1. Fetch Snowflake metadata from Server safely (Credentials hidden on server)
  const dbDataClassInstance = await fetchSnowflakeData();
  
  // 2. We skip layout computation here and pass the raw data down to the Client.
  // Next.js restricts passing Class instances from Server to Client Components.
  // We strip the prototype by stringifying it into a plain object.
  const dbData = JSON.parse(JSON.stringify(dbDataClassInstance));

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
          Currently hosts Snowflake.
          Later, we can add <TerraformGroup x={snowflakeDrawing.width + 50} />
          to render them side-by-side inside this SVG.
        */}
        <MainCanvasRenderer width={1500} height={1000}>
           <SnowflakeClientRenderer dbData={dbData} />
        </MainCanvasRenderer>
      </main>
    </div>
  );
}
