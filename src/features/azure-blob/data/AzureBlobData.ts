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
  ) {}
}

export class AzureResourceGroup {
  constructor(
    public name: string,
    public resources: (AzureBlobStorage | AzureContainerRegistry | AzureBatch | AzureDataFactory)[] = [],
  ) {}
}

export class AzureSubscription {
  constructor(
    public name: string,
    public resourceGroups: AzureResourceGroup[] = [],
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
  ) {}
}

export class AzurePipeline {
  constructor(
    public name: string,
    public id: string,
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
  ) {}
}

export class AzureBatch {
  public type = "batch" as const;
  constructor(
    public name: string,
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
