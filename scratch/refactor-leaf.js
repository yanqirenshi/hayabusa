const fs = require('fs');

// ── AzureBlobDrawing.ts ──────────────────────────────────────
const azurePath = 'src/features/azure-blob/drawing/AzureBlobDrawing.ts';
let azure = fs.readFileSync(azurePath, 'utf8');

// Fix imports
azure = azure.replace(
  /import \{ AzureEntraUser, AzureEntraGroup, AzureEntraApp, AzureDevOpsRepoNode, AzureDevOpsPipelineNode, AzureBlobItemNode \} from "\.\/AzureNodes";/,
  ''
);
azure = azure.replace(
  /import \{ RootBoxNode, BranchBoxNode \} from "@\/core\/models\/BoxNode";/,
  'import { RootBoxNode, BranchBoxNode, LeafBoxNodeDefault } from "@/core/models/BoxNode";'
);

// Replace instantiations
azure = azure.replace(/new AzureEntraUser\(/g, 'new LeafBoxNodeDefault(');
azure = azure.replace(/new AzureEntraGroup\(/g, 'new LeafBoxNodeDefault(');
azure = azure.replace(/new AzureEntraApp\(/g, 'new LeafBoxNodeDefault(');
azure = azure.replace(/new AzureDevOpsRepoNode\(/g, 'new LeafBoxNodeDefault(');
azure = azure.replace(/new AzureDevOpsPipelineNode\(/g, 'new LeafBoxNodeDefault(');
azure = azure.replace(/new AzureBlobItemNode\(/g, 'new LeafBoxNodeDefault(');

fs.writeFileSync(azurePath, azure);
console.log('AzureBlobDrawing.ts updated');

// ── SnowflakeDrawing.ts ──────────────────────────────────────
const sfPath = 'src/features/snowflake/drawing/SnowflakeDrawing.ts';
let sf = fs.readFileSync(sfPath, 'utf8');

sf = sf.replace(
  /import \{ SnowflakeObjectNode, SnowflakeRoleNode \} from "\.\/SnowflakeNodes";/,
  ''
);
sf = sf.replace(
  /import \{ RootBoxNode, BranchBoxNode \} from "@\/core\/models\/BoxNode";/,
  'import { RootBoxNode, BranchBoxNode, LeafBoxNodeDefault, LeafBoxNodeRoleItem } from "@/core/models/BoxNode";'
);
sf = sf.replace(/new SnowflakeObjectNode\(/g, 'new LeafBoxNodeDefault(');
sf = sf.replace(/new SnowflakeRoleNode\(/g, 'new LeafBoxNodeRoleItem(');

fs.writeFileSync(sfPath, sf);
console.log('SnowflakeDrawing.ts updated');

// ── TerraformDrawing.ts ──────────────────────────────────────
const tfPath = 'src/features/terraform/drawing/TerraformDrawing.ts';
let tf = fs.readFileSync(tfPath, 'utf8');

tf = tf.replace(
  /import \{ TerraformBlockNode \} from "\.\/TerraformNodes";/,
  ''
);
tf = tf.replace(
  /import \{ RootBoxNode, BranchBoxNode \} from "@\/core\/models\/BoxNode";/,
  'import { RootBoxNode, BranchBoxNode, LeafBoxNodeTerraformItem } from "@/core/models/BoxNode";'
);
tf = tf.replace(/new TerraformBlockNode\(/g, 'new LeafBoxNodeTerraformItem(');

fs.writeFileSync(tfPath, tf);
console.log('TerraformDrawing.ts updated');

console.log('\nAll done!');
