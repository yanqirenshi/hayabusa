"use server";

import { BlobServiceClient } from "@azure/storage-blob";
import { AzureBlob, AzureBlobContainer, AzureBlobStorage, AzureBlobDirectory, AzureManagementGroup, AzureSubscription, AzureResourceGroup, AzureTenant, AzureContainerRegistry, AzureBatch, AzureDevOps, AzureRepo, AzurePipeline } from "../data/AzureBlobData";
import { getMockAzureBlobData } from "../data/mockData";
import { fetchEntraIdUsersAndGroups } from "./entraIdFetcher";
import { fetchAzureArmResources } from "./azureArmFetcher";
import { fetchAzureDevOpsData } from "./azureDevOpsFetcher";

export async function fetchAzureBlobData(): Promise<AzureTenant> {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const isMockMode = !connectionString || connectionString === "your_connection_string";

  // 1. Fetch Entra ID data
  const { users, groups, apps, tenantName } = await fetchEntraIdUsersAndGroups();
  let finalTenantName = tenantName || process.env.AZURE_TENANT_ID || "Default Directory";

  // 2. Fetch DevOps data
  const devOps = await fetchAzureDevOpsData();

  // 3. Fetch ARM Resources (Subs, RGs, ACR, Batch)
  let subscriptions = await fetchAzureArmResources();

  // 4. Fetch Blob Storage Data (if available)
  let storageAccount: AzureBlobStorage | null = null;
  if (!isMockMode && connectionString) {
    try {
      const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      const accountName = blobServiceClient.accountName;
      const containers: AzureBlobContainer[] = [];

      for await (const containerItem of blobServiceClient.listContainers()) {
        const containerClient = blobServiceClient.getContainerClient(containerItem.name);
        const blobs: AzureBlob[] = [];
        const directories: AzureBlobDirectory[] = [];

        for await (const item of containerClient.listBlobsByHierarchy("/")) {
          if (item.kind === "prefix") {
            directories.push(new AzureBlobDirectory(item.name.replace(/\/$/, "")));
          }
          // Note: Individual blobs (item.kind === "blob") are skipped per user request to stop at directory level.
        }
        containers.push(new AzureBlobContainer(containerItem.name, directories, blobs));
      }
      storageAccount = new AzureBlobStorage(
        accountName, 
        containers, 
        process.env.AZURE_SUBSCRIPTION_ID, 
        "rg-storage" // Default/Placeholder as it's hard to detect RG from connection string
      );
    } catch (e) {
      console.error("[AzureBlob] Failed to fetch real blob data:", e);
    }
  }

  // 5. Fallback or Merge Merge Blob into ARM structure
  if (subscriptions.length === 0) {
    // Fallback to mock if nothing from ARM (only if we don't have enough real data)
    if (isMockMode && devOps.length === 0 && users.length === 0) {
      return getMockAzureBlobData();
    }
    
    // If we have some real data but no ARM, create a dummy structure for the storage account
    if (storageAccount) {
      const rg = new AzureResourceGroup("rg-default", [storageAccount]);
      const sub = new AzureSubscription("sub-default", [rg]);
      subscriptions = [new AzureSubscription("Subscription", [sub])];
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
