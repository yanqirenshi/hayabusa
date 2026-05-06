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
   ├─ LeafBoxNodeDefault
   ├─ LeafBoxNodeRoleItem
   └─ LeafBoxNodeTerraformItem
```

### クラスの責務
- **`BoxNode`**: 描画に必要な基本情報を保持。
- **`RootBoxNode`**: 最上位のコンテナ。`type` で `icon`/`subtitle` を切替 (`strokeWidth: 3`)。
- **`BranchBoxNode`**: 中間層のコンテナ。`type` で `icon`/`subtitle` を切替 (`strokeWidth: 2`)。
- **`LeafBoxNode`**: 末端アイテムの抽象基底クラス (`strokeWidth: 1.5`)。
  - **`LeafBoxNodeDefault`**: 汎用末端ノード。`type` でアイコン・サブタイトルを切替。
  - **`LeafBoxNodeRoleItem`**: ロール専用（Snowflake ロール等）。
  - **`LeafBoxNodeTerraformItem`**: Terraform ブロックアイテム専用。

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

`BranchBoxNode` は具象クラスであり、直接インスタンス化されます。

| type | subtitle |
|------|----------|
| `azure-entra-users-container` | Container |
| `azure-entra-groups-container` | Container |
| `azure-entra-apps-container` | Container |
| `azure-management-group` | Management Group |
| `azure-subscription` | Subscription |
| `azure-resource-group` | Resource Group |
| `azure-blob-account` | Storage Account |
| `azure-blob-container` | Blob Container |
| `azure-batch` | Batch Account |
| `azure-acr` | Container Registry |
| `azure-adf` | Data Factory |
| `azure-devops-container` | Organization |
| `snowflake-schema` | Schema |
| `snowflake-group` | Group |
| `terraform-dir` | Directory |
| `terraform-column` | Column |
| `tf-file` | Terraform File |


## LeafBoxNodeDefault

file: src/core/models/BoxNode.ts


## LeafBoxNodeRoleItem

file: src/core/models/BoxNode.ts


## LeafBoxNodeTerraformItem

file: src/core/models/BoxNode.ts

