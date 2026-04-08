"use server";

import { BlobServiceClient } from "@azure/storage-blob";
import { AzureBlob, AzureBlobContainer, AzureBlobStorage } from "../data/AzureBlobData";
import { getMockAzureBlobData } from "../data/mockData";

export async function fetchAzureBlobData(): Promise<AzureBlobStorage> {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

  if (!connectionString) {
    console.warn(
      "[AzureBlob] AZURE_STORAGE_CONNECTION_STRING is not set. Using mock data.",
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

      // List all blobs in the container
      for await (const blobItem of containerClient.listBlobsFlat({
        includeMetadata: true,
      })) {
        blobs.push(
          new AzureBlob(
            blobItem.name,
            blobItem.properties.contentLength ?? 0,
            blobItem.properties.contentType ?? "application/octet-stream",
            blobItem.properties.lastModified?.toISOString() ?? "",
          ),
        );
      }

      containers.push(new AzureBlobContainer(containerItem.name, blobs));
    }
  } catch (error) {
    console.error("[AzureBlob] Failed to fetch blob data:", error);
    console.warn("[AzureBlob] Falling back to mock data.");
    return getMockAzureBlobData();
  }

  return new AzureBlobStorage(accountName, containers);
}
