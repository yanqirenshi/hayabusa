# 描画ノード クラス構成図 (Drawing Node Classes)

UI の Box 描画を共通化し、ドメインごとのアイコンやサブタイトルなどをカプセル化するためのオブジェクト指向クラス階層です。

## 家系図

```text
BoxNode (src/core/models/BoxNode.ts)
│
├─ RootBoxNode
│
├─ BranchBoxNode
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

### クラスの責務
- **`BoxNode`**: 描画に必要な基本情報を保持。
- **`RootBoxNode`**: 最上位のコンテナとして機能し、太めの枠線 (`strokeWidth: 3`) を持ちます。
- **`BranchBoxNode`**: 中間層のコンテナとして機能 (`strokeWidth: 2`)。
- **`LeafBoxNode`**: 最下層の末端アイテムとして機能 (`strokeWidth: 1.5`)。

# クラス

## RootBoxNode

`RootBoxNode` は具象クラスであり、直接インスタンス化されます。

サブクラスを持たず、コンストラクタに渡す `type` プロパティの値に応じて `icon` および `subtitle` を内部の switch 文で返します。

| type | icon | subtitle |
|------|------|----------|
| `azure-entra-root` | `/microsoft_entra.svg` | Microsoft Entra ID |
| `azure-arm-root` | `/azure_portal.svg` | Azure Resource Manager |
| `azure-devops-root` | `/azure_devops.svg` | Azure DevOps |
| `snowflake-database` | `/database.svg` | Database |
| `terraform-root` | `/terraform.svg` | Terraform Root |


## BranchBoxNode


## LeafBoxNode

### AzureEntraUser

file: src/features/azure-blob/drawing/AzureNodes.ts

User

### AzureEntraGroup

file: src/features/azure-blob/drawing/AzureNodes.ts

Group

### AzureEntraApp

file: src/features/azure-blob/drawing/AzureNodes.ts

App Registration

### AzureBlobItemNode

file: src/features/azure-blob/drawing/AzureNodes.ts

Blob Item

### AzureDevOpsRepoNode

file: src/features/azure-blob/drawing/AzureNodes.ts

Repository

### AzureDevOpsPipelineNode

file: src/features/azure-blob/drawing/AzureNodes.ts

Pipeline

### SnowflakeObjectNode

file: src/features/snowflake/drawing/SnowflakeNodes.ts

Role

### SnowflakeRoleNode

file: src/features/snowflake/drawing/SnowflakeNodes.ts

Role

### TerraformBlockNode

file: src/features/terraform/drawing/TerraformNodes.ts

Block

