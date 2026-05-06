const fs = require('fs');
const path = require('path');

const FEATURES_DIR = path.join(__dirname, '../src/features');
const OUTPUT_FILE = path.join(__dirname, '../CLASSES.md');

function findNodeFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findNodeFiles(filePath, fileList);
    } else if (file.endsWith('Nodes.ts')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function parseClasses() {
  const nodeFiles = findNodeFiles(FEATURES_DIR);
  const hierarchy = {
    RootBoxNode: [],
    BranchBoxNode: [],
    LeafBoxNode: []
  };

  const regex = /export\s+class\s+([A-Za-z0-9_]+)\s+extends\s+(RootBoxNode|BranchBoxNode|LeafBoxNode)/g;

  for (const file of nodeFiles) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = regex.exec(content)) !== null) {
      const className = match[1];
      const baseClass = match[2];
      
      // Try to extract subtitle for description
      const subtitleRegex = new RegExp(`class\\s+${className}[\\s\\S]*?get\\s+subtitle\\(\\)\\s*{\\s*return\\s+["'](.*?)["']`, 'm');
      const subtitleMatch = content.match(subtitleRegex);
      const description = subtitleMatch ? subtitleMatch[1] : '';

      hierarchy[baseClass].push({ className, description });
    }
  }

  return hierarchy;
}

function generateMarkdown(hierarchy) {
  let md = `# 描画ノード クラス構成図 (Drawing Node Classes)\n\n`;
  md += `UI の Box 描画を共通化し、ドメインごとのアイコンやサブタイトルなどをカプセル化するためのオブジェクト指向クラス階層です。\n\n`;
  md += `\`\`\`text\n`;
  md += `BoxNode (src/core/models/BoxNode.ts)\n│\n`;

  const bases = ['RootBoxNode', 'BranchBoxNode', 'LeafBoxNode'];
  
  for (let i = 0; i < bases.length; i++) {
    const base = bases[i];
    const isLastBase = i === bases.length - 1;
    const prefixBase = isLastBase ? `└─` : `├─`;
    const childPrefix = isLastBase ? `   ` : `│  `;

    md += `${prefixBase} ${base}\n`;
    
    const classes = hierarchy[base];
    for (let j = 0; j < classes.length; j++) {
      const cls = classes[j];
      const isLastChild = j === classes.length - 1;
      const prefixChild = isLastChild ? `└─` : `├─`;
      
      // Padding for alignment
      const paddedName = cls.className.padEnd(30, ' ');
      md += `${childPrefix}${prefixChild} ${paddedName} (${cls.description})\n`;
    }
    
    if (!isLastBase) {
      md += `│\n`;
    }
  }

  md += `\`\`\`\n\n`;
  md += `## クラスの責務\n`;
  md += `- **\`BoxNode\`**: 描画に必要な基本情報を保持。\n`;
  md += `- **\`RootBoxNode\`**: 最上位のコンテナとして機能し、太めの枠線 (\`strokeWidth: 3\`) を持ちます。\n`;
  md += `- **\`BranchBoxNode\`**: 中間層のコンテナとして機能 (\`strokeWidth: 2\`)。\n`;
  md += `- **\`LeafBoxNode\`**: 最下層の末端アイテムとして機能 (\`strokeWidth: 1.5\`)。\n`;

  return md;
}

const hierarchy = parseClasses();
const markdown = generateMarkdown(hierarchy);
fs.writeFileSync(OUTPUT_FILE, markdown, 'utf8');
console.log(`Successfully updated ${OUTPUT_FILE}`);
