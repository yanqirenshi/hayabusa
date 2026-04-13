import { DefaultAzureCredential } from "@azure/identity";
import { SubscriptionClient } from "@azure/arm-resources-subscriptions";
import { ResourceManagementClient } from "@azure/arm-resources";
import { ContainerRegistryManagementClient } from "@azure/arm-containerregistry";
import { ContainerRegistryClient } from "@azure/container-registry";
import { BatchManagementClient } from "@azure/arm-batch";
import { DataFactoryManagementClient } from "@azure/arm-datafactory";
import { AzureSubscription, AzureResourceGroup, AzureBlobStorage, AzureContainerRegistry, AzureBatch, AzureDataFactory, AzureDataFactoryPipeline } from "../data/AzureBlobData";

export async function fetchAzureArmResources(): Promise<AzureSubscription[]> {
  const credential = new DefaultAzureCredential();
  const subClient = new SubscriptionClient(credential);
  
  const azureSubscriptions: AzureSubscription[] = [];

  try {
    for await (const sub of subClient.subscriptions.list()) {
      if (!sub.subscriptionId || sub.state !== "Enabled") continue;

      const subId = sub.subscriptionId;
      const subName = sub.displayName || subId;
      const resourceGroups: AzureResourceGroup[] = [];

      const rgClient = new ResourceManagementClient(credential, subId);
      const acrClient = new ContainerRegistryManagementClient(credential, subId);
      const batchClient = new BatchManagementClient(credential, subId);

      // List Resource Groups
      for await (const rg of rgClient.resourceGroups.list()) {
        if (!rg.name) continue;
        const rgName = rg.name;
        const resources: (AzureBlobStorage | AzureContainerRegistry | AzureBatch)[] = [];

        // Note: Blob Storage accounts are usually listed via ResourceManagementClient or StorageManagementClient.
        // For simplicity, we are already fetching Blob data separately.
        // However, we should place the real Storage Accounts in the correct RGs if we want a perfect map.
        // For now, let's focus on ACR and Batch in this fetcher.

        // List ACRs in this RG
        try {
          for await (const acr of acrClient.registries.listByResourceGroup(rgName)) {
            if (acr.name && acr.loginServer) {
              const repositories: string[] = [];
              try {
                const repositoryClient = new ContainerRegistryClient(`https://${acr.loginServer}`, credential);
                for await (const repoName of repositoryClient.listRepositoryNames()) {
                  repositories.push(repoName);
                }
              } catch (repoError) {
                console.warn(`[ARM] Failed to list repositories for ACR ${acr.name}:`, repoError);
              }
              resources.push(new AzureContainerRegistry(acr.name, repositories, subId, rgName));
            }
          }
        } catch (e) {
          console.warn(`[ARM] Failed to list ACRs in ${rgName}:`, e);
        }

        // List Batch accounts in this RG
        try {
          for await (const batch of batchClient.batchAccount.listByResourceGroup(rgName)) {
            if (batch.name) {
              resources.push(new AzureBatch(batch.name, subId, rgName));
            }
          }
        } catch (e) {
          console.warn(`[ARM] Failed to list Batch accounts in ${rgName}:`, e);
        }

        // List Data Factories in this RG
        try {
          const adfClient = new DataFactoryManagementClient(credential, subId);
          for await (const factory of adfClient.factories.listByResourceGroup(rgName)) {
            if (factory.name) {
              const pipelines: AzureDataFactoryPipeline[] = [];
              try {
                for await (const pipeline of adfClient.pipelines.listByFactory(rgName, factory.name)) {
                  if (pipeline.name) {
                    pipelines.push(new AzureDataFactoryPipeline(pipeline.name));
                  }
                }
              } catch (pipeError) {
                console.warn(`[ARM] Failed to list pipelines for ADF ${factory.name}:`, pipeError);
              }
              resources.push(new AzureDataFactory(factory.name, pipelines, subId, rgName));
            }
          }
        } catch (e) {
          console.warn(`[ARM] Failed to list Data Factories in ${rgName}:`, e);
        }

        if (resources.length > 0) {
          resourceGroups.push(new AzureResourceGroup(rgName, resources, subId));
        }
      }

      if (resourceGroups.length > 0) {
        azureSubscriptions.push(new AzureSubscription(subName, resourceGroups, subId));
      }
    }
  } catch (error) {
    console.error("[ARM] Failed to fetch subscriptions or resources:", error);
  }

  return azureSubscriptions;
}
