import { AzureBlob, AzureBlobContainer, AzureBlobStorage, AzureBlobDirectory, AzureResourceGroup, AzureSubscription, AzureManagementGroup, AzureTenant, AzureEntraUser, AzureEntraGroup } from "./AzureBlobData";

export function getMockAzureBlobData(): AzureTenant {
  const storageAccount = new AzureBlobStorage("ukiyostorageaccount", [
    new AzureBlobContainer("raw-data", [
      new AzureBlobDirectory("transactions", [], [
        new AzureBlob("transactions_202603.csv", 1048576, "text/csv", "2026-03-15T10:30:00Z"),
      ]),
      new AzureBlobDirectory("accounts"),
      new AzureBlobDirectory("customers"),
    ], [
      new AzureBlob("readme.txt", 1024, "text/plain", "2026-01-01T00:00:00Z"),
    ]),
    new AzureBlobContainer("processed-data", [
      new AzureBlobDirectory("stg_transactions"),
      new AzureBlobDirectory("stg_accounts"),
    ], []),
    new AzureBlobContainer("archive", [
      new AzureBlobDirectory("2024"),
      new AzureBlobDirectory("2025"),
    ], []),
  ]);

  const resourceGroup = new AzureResourceGroup("rg-data-platform-prd", [storageAccount]);
  const subscription = new AzureSubscription("sub-production-workloads", [resourceGroup]);
  const managementGroup = new AzureManagementGroup("mg-enterprise-root", [subscription]);
  
  const users = [
    new AzureEntraUser("Alice Tanaka", "alice.tanaka@example.com"),
    new AzureEntraUser("Bob Suzuki", "bob.suzuki@example.com"),
    new AzureEntraUser("Charlie Sato", "charlie.sato@example.com"),
  ];

  const groups = [
    new AzureEntraGroup("Global Administrators", "group-id-global-admin"),
    new AzureEntraGroup("Data Engineers", "group-id-data-engineers"),
  ];

  const apps = [
    new AzureEntraApp("Hayabusa Data Importer (Mock)", "app-id-data-importer"),
  ];

  const tenant = new AzureTenant("Default Directory (Entra ID)", [managementGroup], users, groups, apps);

  return tenant;
}
