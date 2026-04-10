"use server";

import { BlobServiceClient } from "@azure/storage-blob";
import { AzureBlob, AzureBlobContainer, AzureBlobStorage, AzureBlobDirectory, AzureManagementGroup, AzureSubscription, AzureResourceGroup, AzureTenant, AzureContainerRegistry, AzureBatch, AzureDevOps, AzureRepo, AzurePipeline } from "../data/AzureBlobData";
import { getMockAzureBlobData } from "../data/mockData";
import { fetchEntraIdUsersAndGroups } from "./entraIdFetcher";

export async function fetchAzureBlobData(): Promise<AzureTenant> {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

  if (!connectionString || connectionString === "your_connection_string") {
    console.warn(
      "[AzureBlob] AZURE_STORAGE_CONNECTION_STRING is not set or invalid. Using mock data.",
    );
    return getMockAzureBlobData();
  }

  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);

  // Extract account name from the client
  const accountName = blobServiceClient.accountName;

  const containers: AzureBlobContainer[] = [];

  try {
    // List all containers
    for await (const containerItem of blobServiceClient.listContainers()) {
      const containerClient = blobServiceClient.getContainerClient(
        containerItem.name,
      );

      const blobs: AzureBlob[] = [];
      const directories: AzureBlobDirectory[] = [];

      // List blobs and directories at the root of the container
      for await (const item of containerClient.listBlobsByHierarchy("/")) {
        if (item.kind === "prefix") {
          // It's a virtual directory
          const dirName = item.name.replace(/\/$/, "");
          directories.push(new AzureBlobDirectory(dirName));
        } else if (item.kind === "blob") {
          blobs.push(
            new AzureBlob(
              item.name,
              item.properties.contentLength ?? 0,
              item.properties.contentType ?? "application/octet-stream",
              item.properties.lastModified?.toISOString() ?? "",
            ),
          );
        }
      }

      containers.push(new AzureBlobContainer(containerItem.name, directories, blobs));
    }
  } catch (error) {
    console.error("[AzureBlob] Failed to fetch blob data:", error);
    console.warn("[AzureBlob] Falling back to mock data.");
    return getMockAzureBlobData();
  }

  const storageAccount = new AzureBlobStorage(accountName, containers);
  const acr = new AzureContainerRegistry("crhayabusa");
  const batch = new AzureBatch("batchhayabusa");
  
  // Dummy wrappers for Resource Group, Subscription, Management Group
  const resourceGroup = new AzureResourceGroup("rg-default", [storageAccount, acr, batch]);
  const subscription = new AzureSubscription("sub-default", [resourceGroup]);
  const managementGroup = new AzureManagementGroup("Tenant Root Group", [subscription]);

  // Fetch real or mocked users & groups based on identity settings
  const { users, groups, apps, tenantName } = await fetchEntraIdUsersAndGroups();

  let finalTenantDomain = "Default Directory (Entra ID)";
  if (tenantName) {
    finalTenantDomain = tenantName;
  } else if (process.env.AZURE_TENANT_ID && process.env.AZURE_TENANT_ID !== 'your_tenant_id') {
    finalTenantDomain = process.env.AZURE_TENANT_ID;
  }

  const devOps = [
    new AzureDevOps("HayabusaOrg", [
      new AzureRepo("hayabusa-core", "repo-01"),
      new AzureRepo("hayabusa-ui", "repo-02")
    ], [
      new AzurePipeline("CI-CD-Pipeline", "pipe-01")
    ])
  ];

  const tenant = new AzureTenant(finalTenantDomain, [managementGroup], users, groups, apps, devOps);

  return tenant;
}
