import { DefaultAzureCredential, TokenCredential } from "@azure/identity";
import { SubscriptionClient } from "@azure/arm-resources-subscriptions";
import { ResourceManagementClient } from "@azure/arm-resources";
import { ContainerRegistryManagementClient } from "@azure/arm-containerregistry";
import { ContainerRegistryClient } from "@azure/container-registry";
import { BatchManagementClient } from "@azure/arm-batch";
import { DataFactoryManagementClient } from "@azure/arm-datafactory";
import {
  AzureSubscription,
  AzureResourceGroup,
  AzureBlobStorage,
  AzureContainerRegistry,
  AzureBatch,
  AzureDataFactory,
  AzureDataFactoryPipeline,
} from "../data/AzureBlobData";
import { parallelMap } from "@/core/parallel";

type RgResource = AzureBlobStorage | AzureContainerRegistry | AzureBatch | AzureDataFactory;

async function listAcrsInRg(
  acrClient: ContainerRegistryManagementClient,
  subId: string,
  rgName: string,
  credential: TokenCredential
): Promise<AzureContainerRegistry[]> {
  const acrs: AzureContainerRegistry[] = [];
  try {
    for await (const acr of acrClient.registries.listByResourceGroup(rgName)) {
      if (!acr.name || !acr.loginServer) continue;
      const repositories: string[] = [];
      try {
        const repositoryClient = new ContainerRegistryClient(`https://${acr.loginServer}`, credential);
        for await (const repoName of repositoryClient.listRepositoryNames()) {
          repositories.push(repoName);
        }
      } catch (repoError) {
        console.warn(`[ARM] Failed to list repositories for ACR ${acr.name}:`, repoError);
      }
      acrs.push(new AzureContainerRegistry(acr.name, repositories, subId, rgName));
    }
  } catch (e) {
    console.warn(`[ARM] Failed to list ACRs in ${rgName}:`, e);
  }
  return acrs;
}

async function listBatchesInRg(
  batchClient: BatchManagementClient,
  subId: string,
  rgName: string
): Promise<AzureBatch[]> {
  const batches: AzureBatch[] = [];
  try {
    for await (const batch of batchClient.batchAccount.listByResourceGroup(rgName)) {
      if (batch.name) {
        batches.push(new AzureBatch(batch.name, subId, rgName));
      }
    }
  } catch (e) {
    console.warn(`[ARM] Failed to list Batch accounts in ${rgName}:`, e);
  }
  return batches;
}

async function listAdfsInRg(
  adfClient: DataFactoryManagementClient,
  subId: string,
  rgName: string
): Promise<AzureDataFactory[]> {
  const adfs: AzureDataFactory[] = [];
  try {
    const factories: { name: string }[] = [];
    for await (const factory of adfClient.factories.listByResourceGroup(rgName)) {
      if (factory.name) factories.push({ name: factory.name });
    }
    // Pipeline listing per factory in parallel (small fan-out)
    const factoriesWithPipelines = await Promise.all(
      factories.map(async (f) => {
        const pipelines: AzureDataFactoryPipeline[] = [];
        try {
          for await (const pipeline of adfClient.pipelines.listByFactory(rgName, f.name)) {
            if (pipeline.name) pipelines.push(new AzureDataFactoryPipeline(pipeline.name));
          }
        } catch (pipeError) {
          console.warn(`[ARM] Failed to list pipelines for ADF ${f.name}:`, pipeError);
        }
        return new AzureDataFactory(f.name, pipelines, subId, rgName);
      })
    );
    adfs.push(...factoriesWithPipelines);
  } catch (e) {
    console.warn(`[ARM] Failed to list Data Factories in ${rgName}:`, e);
  }
  return adfs;
}

export async function fetchAzureArmResources(): Promise<AzureSubscription[]> {
  const credential = new DefaultAzureCredential();
  const subClient = new SubscriptionClient(credential);

  // Bounded parallelism — applied at both the subscription and RG levels.
  const concurrency = Math.max(
    1,
    parseInt(process.env.AZURE_ARM_MAX_PARALLEL || "8", 10) || 8
  );

  // 1. Collect all enabled subscriptions
  const enabledSubs: { id: string; name: string }[] = [];
  try {
    for await (const sub of subClient.subscriptions.list()) {
      if (!sub.subscriptionId || sub.state !== "Enabled") continue;
      enabledSubs.push({ id: sub.subscriptionId, name: sub.displayName || sub.subscriptionId });
    }
  } catch (error) {
    console.error("[ARM] Failed to list subscriptions:", error);
    return [];
  }

  // 2. For each subscription in parallel: list RGs, then list resources per RG in parallel
  const subResults = await parallelMap(enabledSubs, concurrency, async (sub) => {
    const rgClient = new ResourceManagementClient(credential, sub.id);
    const acrClient = new ContainerRegistryManagementClient(credential, sub.id);
    const batchClient = new BatchManagementClient(credential, sub.id);
    const adfClient = new DataFactoryManagementClient(credential, sub.id);

    const rgNames: string[] = [];
    try {
      for await (const rg of rgClient.resourceGroups.list()) {
        if (rg.name) rgNames.push(rg.name);
      }
    } catch (e) {
      console.warn(`[ARM] Failed to list resource groups in subscription ${sub.name}:`, e);
      return null;
    }

    const rgResults = await parallelMap(rgNames, concurrency, async (rgName) => {
      const [acrs, batches, adfs] = await Promise.all([
        listAcrsInRg(acrClient, sub.id, rgName, credential),
        listBatchesInRg(batchClient, sub.id, rgName),
        listAdfsInRg(adfClient, sub.id, rgName),
      ]);
      const resources: RgResource[] = [...acrs, ...batches, ...adfs];
      return { name: rgName, resources };
    });

    const resourceGroups = rgResults
      .filter((rg) => rg.resources.length > 0)
      .map((rg) => new AzureResourceGroup(rg.name, rg.resources, sub.id));

    if (resourceGroups.length === 0) return null;
    return new AzureSubscription(sub.name, resourceGroups, sub.id);
  });

  return subResults.filter((s): s is AzureSubscription => s !== null);
}
