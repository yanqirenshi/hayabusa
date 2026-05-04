import * as azdev from "azure-devops-node-api";
import { AzureDevOps, AzureRepo, AzurePipeline } from "../data/AzureBlobData";
import { parallelMap } from "@/core/parallel";

export async function fetchAzureDevOpsData(): Promise<AzureDevOps[]> {
  const orgUrl = process.env.AZURE_DEVOPS_ORG_URL;
  const token = process.env.AZURE_DEVOPS_PAT;

  if (!orgUrl || !token || orgUrl === "https://dev.azure.com/your-org") {
    console.warn("[DevOps] Org URL or PAT not set. Skipping real DevOps data.");
    return [];
  }

  const concurrency = Math.max(
    1,
    parseInt(process.env.AZURE_DEVOPS_MAX_PARALLEL || "8", 10) || 8
  );

  try {
    const authHandler = azdev.getPersonalAccessTokenHandler(token);
    const connection = new azdev.WebApi(orgUrl, authHandler);

    const coreApi = await connection.getCoreApi();
    const gitApi = await connection.getGitApi();
    const buildApi = await connection.getBuildApi();

    const projects = await coreApi.getProjects();
    const orgName = orgUrl.replace(/\/$/, "").split("/").pop() || "DevOps Org";

    // Fan out repo + build fetches across projects with bounded concurrency.
    // Within each project, repos and build definitions run in parallel.
    const perProject = await parallelMap(
      projects.filter((p) => p.id && p.name),
      concurrency,
      async (project) => {
        const projectId = project.id!;
        const projectName = project.name!;

        const [repos, builds] = await Promise.all([
          gitApi.getRepositories(projectId).catch((e) => {
            console.warn(`[DevOps] Failed to fetch repos for project ${projectName}:`, e);
            return [] as Awaited<ReturnType<typeof gitApi.getRepositories>>;
          }),
          buildApi.getDefinitions(projectId).catch((e) => {
            console.warn(`[DevOps] Failed to fetch pipelines for project ${projectName}:`, e);
            return [] as Awaited<ReturnType<typeof buildApi.getDefinitions>>;
          }),
        ]);

        const projectRepos: AzureRepo[] = [];
        for (const repo of repos) {
          if (repo.name && repo.id) {
            projectRepos.push(new AzureRepo(repo.name, repo.id, orgName, projectName));
          }
        }

        const projectPipelines: AzurePipeline[] = [];
        for (const build of builds) {
          if (build.name && build.id) {
            projectPipelines.push(
              new AzurePipeline(build.name, build.id.toString(), orgName, projectName)
            );
          }
        }

        return { repos: projectRepos, pipelines: projectPipelines };
      }
    );

    const allRepos: AzureRepo[] = perProject.flatMap((p) => p.repos);
    const allPipelines: AzurePipeline[] = perProject.flatMap((p) => p.pipelines);

    if (allRepos.length > 0 || allPipelines.length > 0) {
      return [new AzureDevOps(orgName, allRepos, allPipelines)];
    }
    return [];
  } catch (error) {
    console.error("[DevOps] Failed to fetch data:", error);
    return [];
  }
}
