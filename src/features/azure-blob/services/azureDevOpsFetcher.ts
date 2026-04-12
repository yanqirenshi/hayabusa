import * as azdev from "azure-devops-node-api";
import { AzureDevOps, AzureRepo, AzurePipeline } from "../data/AzureBlobData";

export async function fetchAzureDevOpsData(): Promise<AzureDevOps[]> {
  const orgUrl = process.env.AZURE_DEVOPS_ORG_URL;
  const token = process.env.AZURE_DEVOPS_PAT;

  if (!orgUrl || !token || orgUrl === "https://dev.azure.com/your-org") {
    console.warn("[DevOps] Org URL or PAT not set. Skipping real DevOps data.");
    return [];
  }

  try {
    const authHandler = azdev.getPersonalAccessTokenHandler(token);
    const connection = new azdev.WebApi(orgUrl, authHandler);
    
    const coreApi = await connection.getCoreApi();
    const gitApi = await connection.getGitApi();
    const buildApi = await connection.getBuildApi();

    const projects = await coreApi.getProjects();
    const azureDevOpsList: AzureDevOps[] = [];

    // Get Organization name from URL
    const orgName = orgUrl.replace(/\/$/, "").split("/").pop() || "DevOps Org";
    const allRepos: AzureRepo[] = [];
    const allPipelines: AzurePipeline[] = [];

    for (const project of projects) {
      if (!project.id || !project.name) continue;

      // Fetch Repos
      try {
        const repos = await gitApi.getRepositories(project.id);
        for (const repo of repos) {
          if (repo.name && repo.id) {
            allRepos.push(new AzureRepo(repo.name, repo.id));
          }
        }
      } catch (e) {
        console.warn(`[DevOps] Failed to fetch repos for project ${project.name}:`, e);
      }

      // Fetch Build Definitions (Pipelines)
      try {
        const builds = await buildApi.getDefinitions(project.id);
        for (const build of builds) {
          if (build.name && build.id) {
            allPipelines.push(new AzurePipeline(build.name, build.id.toString()));
          }
        }
      } catch (e) {
        console.warn(`[DevOps] Failed to fetch pipelines for project ${project.name}:`, e);
      }
    }

    if (allRepos.length > 0 || allPipelines.length > 0) {
      azureDevOpsList.push(new AzureDevOps(orgName, allRepos, allPipelines));
    }

    return azureDevOpsList;
  } catch (error) {
    console.error("[DevOps] Failed to fetch data:", error);
    return [];
  }
}
