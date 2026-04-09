"use server";

import { BlobServiceClient } from "@azure/storage-blob";
import { AzureBlob, AzureBlobContainer, AzureBlobStorage, AzureBlobDirectory, AzureManagementGroup, AzureSubscription, AzureResourceGroup } from "../data/AzureBlobData";
import { getMockAzureBlobData } from "../data/mockData";

export async function fetchAzureBlobData(): Promise<AzureManagementGroup> {
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
  
  // Dummy wrappers
  const resourceGroup = new AzureResourceGroup("rg-default", [storageAccount]);
  const subscription = new AzureSubscription("sub-default", [resourceGroup]);
  const managementGroup = new AzureManagementGroup("Tenant Root Group", [subscription]);

  return managementGroup;
}
