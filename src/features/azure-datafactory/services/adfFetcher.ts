"use server";

import { ClientSecretCredential } from "@azure/identity";
import { DataFactoryManagementClient } from "@azure/arm-datafactory";
import { AdfActivity, AdfPipeline, AdfFactory } from "../data/AdfData";
import { getMockAdfData } from "../data/mockData";

export async function fetchAdfData(): Promise<AdfFactory> {
  const clientId       = process.env.AZURE_CLIENT_ID;
  const clientSecret   = process.env.AZURE_CLIENT_SECRET;
  const tenantId       = process.env.AZURE_TENANT_ID;
  const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
  const resourceGroup  = process.env.AZURE_RESOURCE_GROUP;
  const factoryName    = process.env.AZURE_DATA_FACTORY_NAME;

  if (
    !clientId ||
    !clientSecret ||
    !tenantId ||
    !subscriptionId ||
    !resourceGroup ||
    !factoryName
  ) {
    console.warn(
      "[ADF] Azure Data Factory credentials are not fully set. Using mock data.",
    );
    return getMockAdfData();
  }

  try {
    const credential = new ClientSecretCredential(
      tenantId,
      clientId,
      clientSecret,
    );
    const client = new DataFactoryManagementClient(
      credential,
      subscriptionId,
    );

    const pipelines: AdfPipeline[] = [];

    // List all pipelines in the factory
    for await (const pipelineResource of client.pipelines.listByFactory(
      resourceGroup,
      factoryName,
    )) {
      const pipelineName = pipelineResource.name ?? "unknown";

      // Get pipeline details to retrieve activities
      const pipelineDetail = await client.pipelines.get(
        resourceGroup,
        factoryName,
        pipelineName,
      );

      const activities: AdfActivity[] = (
        pipelineDetail.activities ?? []
      ).map(
        (a) => new AdfActivity(a.name ?? "unknown", a.type ?? "Unknown"),
      );

      pipelines.push(new AdfPipeline(pipelineName, activities));
    }

    return new AdfFactory(factoryName, pipelines);
  } catch (error) {
    console.error("[ADF] Failed to fetch Data Factory data:", error);
    console.warn("[ADF] Falling back to mock data.");
    return getMockAdfData();
  }
}
