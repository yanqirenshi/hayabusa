// Script to remove all BranchBoxNode subclasses from *Nodes.ts files
// and update Drawing files to use BranchBoxNode directly

const fs = require('fs');

// ── 1. AzureNodes.ts ──────────────────────────────────────────
const azureNodesPath = 'src/features/azure-blob/drawing/AzureNodes.ts';
let azure = fs.readFileSync(azureNodesPath, 'utf8');

// Remove import of BranchBoxNode (keep RootBoxNode, LeafBoxNode)
azure = azure.replace(
  /import \{ RootBoxNode, BranchBoxNode, LeafBoxNode \} from "@\/core\/models\/BoxNode";/,
  'import { RootBoxNode, LeafBoxNode } from "@/core/models/BoxNode";'
);

// Remove all BranchBoxNode subclasses
const branchClassPatterns = [
  /export class AzureEntraContainer extends BranchBoxNode \{[^}]+\}\n\n/,
  /export class AzureManagementGroupNode extends BranchBoxNode \{[^}]+\}\n\n/,
  /export class AzureSubscriptionNode extends BranchBoxNode \{[^}]+\}\n\n/,
  /export class AzureResourceGroupNode extends BranchBoxNode \{[^}]+\}\n\n/,
  /export class AzureStorageAccountNode extends BranchBoxNode \{[^}]+\}\n\n/,
  /export class AzureBlobContainerNode extends BranchBoxNode \{[^}]+\}\n\n/,
  /export class AzureBatchNode extends BranchBoxNode \{[^}]+\}\n\n/,
  /export class AzureContainerRegistryNode extends BranchBoxNode \{[^}]+\}\n\n/,
  /export class AzureDataFactoryNode extends BranchBoxNode \{[^}]+\}\n\n/,
  /export class AzureDevOpsOrganizationNode extends BranchBoxNode \{[^}]+\}\n\n/,
];
for (const pat of branchClassPatterns) {
  azure = azure.replace(pat, '');
}
fs.writeFileSync(azureNodesPath, azure);
console.log('AzureNodes.ts updated');

// ── 2. SnowflakeNodes.ts ──────────────────────────────────────
const sfNodesPath = 'src/features/snowflake/drawing/SnowflakeNodes.ts';
let sf = fs.readFileSync(sfNodesPath, 'utf8');

sf = sf.replace(
  /import \{ RootBoxNode, BranchBoxNode, LeafBoxNode \} from "@\/core\/models\/BoxNode";/,
  'import { LeafBoxNode } from "@/core/models/BoxNode";'
);
sf = sf.replace(/export class SnowflakeSchemaNode extends BranchBoxNode \{[^}]+\}\n\n/, '');
sf = sf.replace(/export class SnowflakeGroupNode extends BranchBoxNode \{[^}]+\}\n\n/, '');
fs.writeFileSync(sfNodesPath, sf);
console.log('SnowflakeNodes.ts updated');

// ── 3. TerraformNodes.ts ─────────────────────────────────────
const tfNodesPath = 'src/features/terraform/drawing/TerraformNodes.ts';
let tf = fs.readFileSync(tfNodesPath, 'utf8');

tf = tf.replace(
  /import \{ RootBoxNode, BranchBoxNode, LeafBoxNode \} from "@\/core\/models\/BoxNode";/,
  'import { LeafBoxNode } from "@/core/models/BoxNode";'
);
tf = tf.replace(/export class TerraformDirNode extends BranchBoxNode \{[^}]+\}\n\n/, '');
tf = tf.replace(/export class TerraformColumnNode extends BranchBoxNode \{[^}]+\}\n\n/, '');
tf = tf.replace(/export class TerraformFileNode extends BranchBoxNode \{[^}]+\}\n\n/, '');
fs.writeFileSync(tfNodesPath, tf);
console.log('TerraformNodes.ts updated');

// ── 4. AzureBlobDrawing.ts ────────────────────────────────────
const azureDrawPath = 'src/features/azure-blob/drawing/AzureBlobDrawing.ts';
let azureDraw = fs.readFileSync(azureDrawPath, 'utf8');

// Replace big import with new one
azureDraw = azureDraw.replace(
  /import \{ AzureEntraUser, AzureEntraGroup, AzureEntraApp, AzureDevOpsRepoNode, AzureDevOpsPipelineNode, AzureDevOpsOrganizationNode, AzureManagementGroupNode, AzureSubscriptionNode, AzureResourceGroupNode, AzureBlobItemNode, AzureContainerRegistryNode, AzureBatchNode, AzureDataFactoryNode, AzureBlobContainerNode, AzureStorageAccountNode, AzureEntraContainer \} from "\.\/AzureNodes";/,
  'import { AzureEntraUser, AzureEntraGroup, AzureEntraApp, AzureDevOpsRepoNode, AzureDevOpsPipelineNode, AzureBlobItemNode } from "./AzureNodes";'
);
azureDraw = azureDraw.replace(
  /import \{ RootBoxNode \} from "@\/core\/models\/BoxNode";/,
  'import { RootBoxNode, BranchBoxNode } from "@/core/models/BoxNode";'
);

// Replace all BranchBoxNode subclass instantiations
const branchNodeReplacements = [
  [/new AzureEntraContainer\(/g, 'new BranchBoxNode('],
  [/new AzureManagementGroupNode\(/g, 'new BranchBoxNode('],
  [/new AzureSubscriptionNode\(/g, 'new BranchBoxNode('],
  [/new AzureResourceGroupNode\(/g, 'new BranchBoxNode('],
  [/new AzureStorageAccountNode\(/g, 'new BranchBoxNode('],
  [/new AzureBlobContainerNode\(/g, 'new BranchBoxNode('],
  [/new AzureBatchNode\(/g, 'new BranchBoxNode('],
  [/new AzureContainerRegistryNode\(/g, 'new BranchBoxNode('],
  [/new AzureDataFactoryNode\(/g, 'new BranchBoxNode('],
  [/new AzureDevOpsOrganizationNode\(/g, 'new BranchBoxNode('],
];
for (const [from, to] of branchNodeReplacements) {
  azureDraw = azureDraw.replace(from, to);
}
fs.writeFileSync(azureDrawPath, azureDraw);
console.log('AzureBlobDrawing.ts updated');

// ── 5. SnowflakeDrawing.ts ────────────────────────────────────
const sfDrawPath = 'src/features/snowflake/drawing/SnowflakeDrawing.ts';
let sfDraw = fs.readFileSync(sfDrawPath, 'utf8');

// Remove old Snowflake node class imports and add BranchBoxNode
sfDraw = sfDraw.replace(
  /import \{ SnowflakeSchemaNode, SnowflakeGroupNode, SnowflakeObjectNode, SnowflakeRoleNode \} from "\.\/SnowflakeNodes";/,
  'import { SnowflakeObjectNode, SnowflakeRoleNode } from "./SnowflakeNodes";'
);
sfDraw = sfDraw.replace(
  /import \{ RootBoxNode \} from "@\/core\/models\/BoxNode";/,
  'import { RootBoxNode, BranchBoxNode } from "@/core/models/BoxNode";'
);
sfDraw = sfDraw.replace(/new SnowflakeSchemaNode\(/g, 'new BranchBoxNode(');
sfDraw = sfDraw.replace(/new SnowflakeGroupNode\(/g, 'new BranchBoxNode(');
fs.writeFileSync(sfDrawPath, sfDraw);
console.log('SnowflakeDrawing.ts updated');

// ── 6. TerraformDrawing.ts ────────────────────────────────────
const tfDrawPath = 'src/features/terraform/drawing/TerraformDrawing.ts';
let tfDraw = fs.readFileSync(tfDrawPath, 'utf8');

tfDraw = tfDraw.replace(
  /import \{ TerraformFileNode, TerraformColumnNode, TerraformDirNode \} from "\.\/TerraformNodes";/,
  'import { TerraformBlockNode } from "./TerraformNodes";'
);
tfDraw = tfDraw.replace(
  /import \{ RootBoxNode \} from "@\/core\/models\/BoxNode";/,
  'import { RootBoxNode, BranchBoxNode } from "@/core/models/BoxNode";'
);
tfDraw = tfDraw.replace(/new TerraformFileNode\(/g, 'new BranchBoxNode(');
tfDraw = tfDraw.replace(/new TerraformColumnNode\(/g, 'new BranchBoxNode(');
tfDraw = tfDraw.replace(/new TerraformDirNode\(/g, 'new BranchBoxNode(');
fs.writeFileSync(tfDrawPath, tfDraw);
console.log('TerraformDrawing.ts updated');

console.log('\nAll done!');
