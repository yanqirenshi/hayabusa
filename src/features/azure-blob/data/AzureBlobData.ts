import { IDataClass } from "@/core/interfaces";

export class AzureBlob {
  constructor(
    public name: string,
    public contentLength: number,
    public contentType: string,
    public lastModified: string,
  ) {}
}

export class AzureBlobDirectory {
  constructor(
    public name: string,
    public directories: AzureBlobDirectory[] = [],
    public blobs: AzureBlob[] = []
  ) {}
}

export class AzureBlobContainer {
  constructor(
    public name: string,
    public directories: AzureBlobDirectory[] = [],
    public blobs: AzureBlob[] = [],
  ) {}
}

export class AzureBlobStorage {
  public type = "storage" as const;
  constructor(
    public accountName: string,
    public containers: AzureBlobContainer[],
    public subscriptionId?: string,
    public resourceGroupName?: string,
  ) {}
}

export class AzureResourceGroup {
  constructor(
    public name: string,
    public resources: (AzureBlobStorage | AzureContainerRegistry | AzureBatch | AzureDataFactory)[] = [],
    public subscriptionId?: string,
  ) {}
}

export class AzureSubscription {
  constructor(
    public name: string,
    public resourceGroups: AzureResourceGroup[] = [],
    public subscriptionId?: string,
  ) {}
}

export class AzureEntraUser {
  constructor(
    public displayName: string,
    public userPrincipalName: string,
  ) {}
}

export class AzureEntraGroup {
  constructor(
    public displayName: string,
    public id: string,
  ) {}
}

export class AzureEntraApp {
  constructor(
    public displayName: string,
    public appId: string,
  ) {}
}

export class AzureRepo {
  constructor(
    public name: string,
    public id: string,
    public organizationName?: string,
    public projectName?: string,
  ) {}
}

export class AzurePipeline {
  constructor(
    public name: string,
    public id: string,
    public organizationName?: string,
    public projectName?: string,
  ) {}
}

export class AzureDevOps {
  constructor(
    public organizationName: string,
    public repos: AzureRepo[] = [],
    public pipelines: AzurePipeline[] = [],
  ) {}
}

export class AzureContainerRegistry {
  public type = "acr" as const;
  constructor(
    public name: string,
    public repositories: string[] = [],
    public subscriptionId?: string,
    public resourceGroupName?: string,
  ) {}
}

export class AzureBatch {
  public type = "batch" as const;
  constructor(
    public name: string,
    public subscriptionId?: string,
    public resourceGroupName?: string,
  ) {}
}

export class AzureDataFactoryPipeline {
  constructor(
    public name: string,
  ) {}
}

export class AzureDataFactory {
  public type = "adf" as const;
  constructor(
    public name: string,
    public pipelines: AzureDataFactoryPipeline[] = [],
    public subscriptionId?: string,
    public resourceGroupName?: string,
  ) {}
}

export class AzureManagementGroup {
  constructor(
    public name: string,
    public subscriptions: AzureSubscription[] = [],
  ) {}
}

export class AzureTenant implements IDataClass {
  constructor(
    public name: string,
    public managementGroups: AzureManagementGroup[] = [],
    public users: AzureEntraUser[] = [],
    public groups: AzureEntraGroup[] = [],
    public apps: AzureEntraApp[] = [],
    public devOps: AzureDevOps[] = [],
  ) {}
}
