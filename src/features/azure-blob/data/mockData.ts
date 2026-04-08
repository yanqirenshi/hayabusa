import { AzureBlob, AzureBlobContainer, AzureBlobStorage } from "./AzureBlobData";

export function getMockAzureBlobData(): AzureBlobStorage {
  return new AzureBlobStorage("ukiyostorageaccount", [
    new AzureBlobContainer("raw-data", [
      new AzureBlob("transactions.csv",   1048576, "text/csv", "2026-03-15T10:30:00Z"),
      new AzureBlob("accounts.csv",        524288, "text/csv", "2026-03-15T10:30:00Z"),
      new AzureBlob("customers.csv",       262144, "text/csv", "2026-03-20T08:00:00Z"),
      new AzureBlob("products.csv",        131072, "text/csv", "2026-03-22T14:15:00Z"),
    ]),
    new AzureBlobContainer("processed-data", [
      new AzureBlob("stg_transactions.csv", 819200, "text/csv", "2026-03-16T02:00:00Z"),
      new AzureBlob("stg_accounts.csv",     409600, "text/csv", "2026-03-16T02:00:00Z"),
    ]),
    new AzureBlobContainer("archive", [
      new AzureBlob("transactions_2025.csv", 5242880, "text/csv", "2026-01-01T00:00:00Z"),
    ]),
  ]);
}
