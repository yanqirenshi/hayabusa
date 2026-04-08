import { IDataClass } from "@/core/interfaces";

export class AzureBlob {
  constructor(
    public name: string,
    public contentLength: number,
    public contentType: string,
    public lastModified: string,
  ) {}
}

export class AzureBlobContainer {
  constructor(
    public name: string,
    public blobs: AzureBlob[],
  ) {}
}

export class AzureBlobStorage implements IDataClass {
  constructor(
    public accountName: string,
    public containers: AzureBlobContainer[],
  ) {}
}
