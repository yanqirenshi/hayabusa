# 描画ノード クラス構成図 (Drawing Node Classes)

UI の Box 描画を共通化し、ドメインごとのアイコンやサブタイトルなどをカプセル化するためのオブジェクト指向クラス階層です。

```text
BoxNode (src/core/models/BoxNode.ts)
│
├─ RootBoxNode
│  ├─ AzureEntraRoot                 (Microsoft Entra ID)
│  ├─ AzureArmRoot                   (Azure Resource Manager)
│  ├─ AzureDevOpsRoot                (Azure DevOps)
│  ├─ SnowflakeDatabaseNode          (Database)
│  └─ TerraformRootNode              (Terraform Root)
│
├─ BranchBoxNode
│  ├─ AzureEntraContainer            (Container)
│  ├─ AzureManagementGroupNode       (Management Group)
│  ├─ AzureSubscriptionNode          (Subscription)
│  ├─ AzureResourceGroupNode         (Resource Group)
│  ├─ AzureStorageAccountNode        (Storage Account)
│  ├─ AzureBlobContainerNode         (Blob Container)
│  ├─ AzureBatchNode                 (Batch Account)
│  ├─ AzureContainerRegistryNode     (Container Registry)
│  ├─ AzureDataFactoryNode           (Data Factory)
│  ├─ AzureDevOpsOrganizationNode    (Organization)
│  ├─ SnowflakeSchemaNode            (Schema)
│  ├─ SnowflakeGroupNode             (Group)
│  ├─ TerraformDirNode               (Directory)
│  ├─ TerraformColumnNode            (Column)
│  └─ TerraformFileNode              (Terraform File)
│
└─ LeafBoxNode
   ├─ AzureEntraUser                 (User)
   ├─ AzureEntraGroup                (Group)
   ├─ AzureEntraApp                  (App Registration)
   ├─ AzureBlobItemNode              (Blob Item)
   ├─ AzureDevOpsRepoNode            (Repository)
   ├─ AzureDevOpsPipelineNode        (Pipeline)
   ├─ SnowflakeObjectNode            (Role)
   ├─ SnowflakeRoleNode              (Role)
   └─ TerraformBlockNode             (Block)
```

## クラスの責務
- **`BoxNode`**: 描画に必要な基本情報を保持。
- **`RootBoxNode`**: 最上位のコンテナとして機能し、太めの枠線 (`strokeWidth: 3`) を持ちます。
- **`BranchBoxNode`**: 中間層のコンテナとして機能 (`strokeWidth: 2`)。
- **`LeafBoxNode`**: 最下層の末端アイテムとして機能 (`strokeWidth: 1.5`)。
