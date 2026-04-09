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
  constructor(
    public accountName: string,
    public containers: AzureBlobContainer[],
  ) {}
}

export class AzureResourceGroup {
  constructor(
    public name: string,
    public storages: AzureBlobStorage[] = [],
  ) {}
}

export class AzureSubscription {
  constructor(
    public name: string,
    public resourceGroups: AzureResourceGroup[] = [],
  ) {}
}

export class AzureManagementGroup implements IDataClass {
  constructor(
    public name: string,
    public subscriptions: AzureSubscription[] = [],
  ) {}
}
