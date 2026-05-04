"use server";

import { BlobServiceClient } from "@azure/storage-blob";
import { AzureBlob, AzureBlobContainer, AzureBlobStorage, AzureBlobDirectory, AzureManagementGroup, AzureSubscription, AzureResourceGroup, AzureTenant, AzureContainerRegistry, AzureBatch, AzureDevOps, AzureRepo, AzurePipeline } from "../data/AzureBlobData";
import { getMockAzureBlobData } from "../data/mockData";
import { fetchEntraIdUsersAndGroups } from "./entraIdFetcher";
import { fetchAzureArmResources } from "./azureArmFetcher";
import { fetchAzureDevOpsData } from "./azureDevOpsFetcher";
import { parallelMap } from "@/core/parallel";

async function fetchBlobStorageAccount(
  connectionString: string
): Promise<AzureBlobStorage | null> {
  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const accountName = blobServiceClient.accountName;

    // Collect container names first, then fan out per-container listing in parallel.
    const containerNames: string[] = [];
    for await (const containerItem of blobServiceClient.listContainers()) {
      containerNames.push(containerItem.name);
    }

    const concurrency = Math.max(
      1,
      parseInt(process.env.AZURE_BLOB_MAX_PARALLEL || "8", 10) || 8
    );

    const containers = await parallelMap(containerNames, concurrency, async (name) => {
      const containerClient = blobServiceClient.getContainerClient(name);
      const directories: AzureBlobDirectory[] = [];
      const blobs: AzureBlob[] = [];
      try {
        for await (const item of containerClient.listBlobsByHierarchy("/")) {
          if (item.kind === "prefix") {
            directories.push(new AzureBlobDirectory(item.name.replace(/\/$/, "")));
          }
          // Individual blobs are intentionally skipped (stop at directory level).
        }
      } catch (e) {
        console.warn(`[AzureBlob] Failed to list contents of container ${name}:`, e);
      }
      return new AzureBlobContainer(name, directories, blobs);
    });

    return new AzureBlobStorage(
      accountName,
      containers,
      process.env.AZURE_SUBSCRIPTION_ID,
      "rg-storage" // Placeholder; RG isn't derivable from connection string.
    );
  } catch (e) {
    console.error("[AzureBlob] Failed to fetch real blob data:", e);
    return null;
  }
}

export async function fetchAzureBlobData(): Promise<AzureTenant> {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const isMockMode = !connectionString || connectionString === "your_connection_string";

  // Fan out the 4 independent sources in parallel — they use different
  // SDKs / endpoints and don't share state until merge time.
  const [
    entra,
    devOps,
    armSubscriptions,
    storageAccountResult,
  ] = await Promise.all([
    fetchEntraIdUsersAndGroups(),
    fetchAzureDevOpsData(),
    fetchAzureArmResources(),
    !isMockMode && connectionString
      ? fetchBlobStorageAccount(connectionString)
      : Promise.resolve(null),
  ]);

  const { users, groups, apps, tenantName } = entra;
  const finalTenantName = tenantName || process.env.AZURE_TENANT_ID || "Default Directory";
  let subscriptions = armSubscriptions;
  const storageAccount = storageAccountResult;

  // 5. Fallback or Merge Merge Blob into ARM structure
  if (subscriptions.length === 0) {
    // Fallback to mock if nothing from ARM (only if we don't have enough real data)
    if (isMockMode && devOps.length === 0 && users.length === 0) {
      return getMockAzureBlobData();
    }
    
    // If we have some real data but no ARM, create a dummy structure for the storage account
    if (storageAccount) {
      const rg = new AzureResourceGroup("rg-default", [storageAccount]);
      subscriptions = [new AzureSubscription("sub-default", [rg])];
    } else {
      // Create a minimal empty structure to avoid drawing errors
      subscriptions = [new AzureSubscription("No Subscriptions Found", [])];
    }
  } else if (storageAccount) {
    // Attempt to merge storageAccount into the first Subscription/ResourceGroup for simplicity
    // Or we could search for the correct RG if we had the account's RG name.
    if (subscriptions[0]?.resourceGroups[0]) {
      subscriptions[0].resourceGroups[0].resources.push(storageAccount);
    }
  }

  // Management Group Wrapper
  const managementGroups = [new AzureManagementGroup("Tenant Root Group", subscriptions)];

  return new AzureTenant(finalTenantName, managementGroups, users, groups, apps, devOps);
}
