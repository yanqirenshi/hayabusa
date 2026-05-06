const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');
const OUTPUT_FILE = path.join(__dirname, '../CLASSES.md');

function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function parseClasses() {
  const allFiles = findTsFiles(SRC_DIR);
  const hierarchy = {
    RootBoxNode: [],
    BranchBoxNode: [],
    LeafBoxNode: [],
    LeafBoxNodeDefault: [],
    LeafBoxNodeRoleItem: [],
    LeafBoxNodeTerraformItem: [],
  };

  const bases = Object.keys(hierarchy);
  const regex = new RegExp(
    `export\\s+class\\s+([A-Za-z0-9_]+)\\s+extends\\s+(${bases.join('|')})`,
    'g'
  );

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = regex.exec(content)) !== null) {
      const className = match[1];
      const baseClass = match[2];

      // Try to extract subtitle for description
      const subtitleRegex = new RegExp(
        `class\\s+${className}[\\s\\S]*?get\\s+subtitle\\(\\)\\s*{\\s*return\\s+["'](.*?)["']`,
        'm'
      );
      const subtitleMatch = content.match(subtitleRegex);
      const description = subtitleMatch ? subtitleMatch[1] : '';

      const relativePath = path.relative(path.join(__dirname, '..'), file).replace(/\\/g, '/');
      hierarchy[baseClass].push({ className, description, filePath: relativePath });
    }
  }

  return hierarchy;
}

function generateMarkdown(hierarchy) {
  let md = `# 描画ノード クラス構成図 (Drawing Node Classes)\n\n`;
  md += `UI の Box 描画を共通化し、ドメインごとのアイコンやサブタイトルなどをカプセル化するためのオブジェクト指向クラス階層です。\n\n`;
  md += `## 家系図\n\n`;
  md += `\`\`\`text\n`;
  md += `BoxNode (src/core/models/BoxNode.ts)\n│\n`;

  // Tree structure: Root, Branch, Leaf (with Leaf children)
  const topBases = ['RootBoxNode', 'BranchBoxNode', 'LeafBoxNode'];
  const leafChildren = ['LeafBoxNodeDefault', 'LeafBoxNodeRoleItem', 'LeafBoxNodeTerraformItem'];

  for (let i = 0; i < topBases.length; i++) {
    const base = topBases[i];
    const isLast = i === topBases.length - 1;
    const prefixBase = isLast ? `└─` : `├─`;
    const childPrefix = isLast ? `   ` : `│  `;

    md += `${prefixBase} ${base}\n`;

    if (base === 'LeafBoxNode') {
      // Show Leaf subclasses
      for (let j = 0; j < leafChildren.length; j++) {
        const leafChild = leafChildren[j];
        const isLastLeaf = j === leafChildren.length - 1;
        const prefixLeaf = isLastLeaf ? `└─` : `├─`;
        const leafChildPrefix = isLastLeaf ? `      ` : `   │  `;
        md += `${childPrefix}${prefixLeaf} ${leafChild}\n`;

        const classes = hierarchy[leafChild];
        for (let k = 0; k < classes.length; k++) {
          const cls = classes[k];
          const isLastCls = k === classes.length - 1;
          const prefixCls = isLastCls ? `└─` : `├─`;
          const paddedName = cls.className.padEnd(28, ' ');
          md += `${childPrefix}   ${leafChildPrefix}${prefixCls} ${paddedName} (${cls.description})\n`;
        }
      }
    } else {
      const classes = hierarchy[base];
      for (let j = 0; j < classes.length; j++) {
        const cls = classes[j];
        const isLastChild = j === classes.length - 1;
        const prefixChild = isLastChild ? `└─` : `├─`;
        const paddedName = cls.className.padEnd(30, ' ');
        md += `${childPrefix}${prefixChild} ${paddedName} (${cls.description})\n`;
      }
    }

    if (!isLast) {
      md += `│\n`;
    }
  }

  md += `\`\`\`\n\n`;

  // クラスの責務
  md += `### クラスの責務\n`;
  md += `- **\`BoxNode\`**: 描画に必要な基本情報を保持。\n`;
  md += `- **\`RootBoxNode\`**: 最上位のコンテナ。\`type\` で \`icon\`/\`subtitle\` を切替 (\`strokeWidth: 3\`)。\n`;
  md += `- **\`BranchBoxNode\`**: 中間層のコンテナ。\`type\` で \`icon\`/\`subtitle\` を切替 (\`strokeWidth: 2\`)。\n`;
  md += `- **\`LeafBoxNode\`**: 末端アイテムの抽象基底クラス (\`strokeWidth: 1.5\`)。\n`;
  md += `  - **\`LeafBoxNodeDefault\`**: 汎用末端ノード。\`type\` でアイコン・サブタイトルを切替。\n`;
  md += `  - **\`LeafBoxNodeRoleItem\`**: ロール専用（Snowflake ロール等）。\n`;
  md += `  - **\`LeafBoxNodeTerraformItem\`**: Terraform ブロックアイテム専用。\n\n`;
  md += `# クラス\n`;

  // RootBoxNode section
  md += `\n## RootBoxNode\n\n`;
  md += `\`RootBoxNode\` は具象クラスであり、直接インスタンス化されます。\n\n`;
  md += `サブクラスを持たず、コンストラクタに渡す \`type\` プロパティの値に応じて \`icon\` および \`subtitle\` を内部の switch 文で返します。\n\n`;
  md += `| type | icon | subtitle |\n|------|------|----------|\n`;
  md += `| \`azure-entra-root\` | \`/microsoft_entra.svg\` | Microsoft Entra ID |\n`;
  md += `| \`azure-arm-root\` | \`/azure_portal.svg\` | Azure Resource Manager |\n`;
  md += `| \`azure-devops-root\` | \`/azure_devops.svg\` | Azure DevOps |\n`;
  md += `| \`snowflake-database\` | \`/database.svg\` | Database |\n`;
  md += `| \`terraform-root\` | \`/terraform.svg\` | Terraform Root |\n\n`;

  // BranchBoxNode section
  md += `\n## BranchBoxNode\n\n`;
  md += `\`BranchBoxNode\` は具象クラスであり、直接インスタンス化されます。\n\n`;
  md += `| type | subtitle |\n|------|----------|\n`;
  const branchTypes = [
    ['azure-entra-users-container', 'Container'],
    ['azure-entra-groups-container', 'Container'],
    ['azure-entra-apps-container', 'Container'],
    ['azure-management-group', 'Management Group'],
    ['azure-subscription', 'Subscription'],
    ['azure-resource-group', 'Resource Group'],
    ['azure-blob-account', 'Storage Account'],
    ['azure-blob-container', 'Blob Container'],
    ['azure-batch', 'Batch Account'],
    ['azure-acr', 'Container Registry'],
    ['azure-adf', 'Data Factory'],
    ['azure-devops-container', 'Organization'],
    ['snowflake-schema', 'Schema'],
    ['snowflake-group', 'Group'],
    ['terraform-dir', 'Directory'],
    ['terraform-column', 'Column'],
    ['tf-file', 'Terraform File'],
  ];
  for (const [type, subtitle] of branchTypes) {
    md += `| \`${type}\` | ${subtitle} |\n`;
  }
  md += `\n`;

  // LeafBoxNode section with ### subsections
  md += `\n## LeafBoxNode\n\n`;
  md += `\`LeafBoxNode\` は抽象クラスです。以下の具象クラスがインスタンス化されます。\n\n`;
  for (const leafChild of leafChildren) {
    md += `### ${leafChild}\n\n`;
    md += `file: src/core/models/${leafChild}.ts\n\n`;
    const classes = hierarchy[leafChild];
    for (const c of classes) {
      md += `#### ${c.className}\n\n`;
      md += `file: ${c.filePath}\n\n`;
      md += `${c.description || '説明なし'}\n\n`;
    }
  }

  return md;
}

const hierarchy = parseClasses();
const markdown = generateMarkdown(hierarchy);
fs.writeFileSync(OUTPUT_FILE, markdown, 'utf8');
console.log(`Successfully updated ${OUTPUT_FILE}`);
