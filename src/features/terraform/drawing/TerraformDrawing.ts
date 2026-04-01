import { IDrawingNode, IDrawingClass } from "@/core/interfaces";
import { TerraformDirectory, TerraformFile } from "../data/TerraformData";

const CONFIG = {
  // Directory layout
  padding: { top: 40, left: 20, right: 20, bottom: 20 },
  gap: 20,
  minWidth: 150,
  minHeight: 80,

  // Module Layout (3-Column)
  colGap: 30,
  colPadding: { top: 40, left: 15, right: 15, bottom: 15 },
  
  // File Layout
  filePadding: { top: 30, left: 15, right: 15, bottom: 15 },
  fileGap: 15,

  // Record Layer
  itemHeight: 28,
  itemGap: 6,
};

export class TerraformDrawing implements IDrawingClass {
  public nodes: IDrawingNode[] = [];
  public width: number = 0;
  public height: number = 0;

  constructor(
    data: TerraformDirectory,
    private measureTextWidth?: (text: string) => number
  ) {
    const rootNode = this.computeLayout(data, 0);
    this.nodes = [rootNode];
    this.width = rootNode.width;
    this.height = rootNode.height;
  }

  private getTextWidth(text: string, baseWidth: number = 9.5): number {
    if (this.measureTextWidth) {
      return this.measureTextWidth(text);
    }
    return text.length * baseWidth;
  }

  private computeModuleLayout(dir: TerraformDirectory, depth: number): IDrawingNode {
    // 1. Build the 3 columns
    const columns = [
      { id: "input", title: "Input", files: [] as IDrawingNode[] },
      { id: "process", title: "Process", files: [] as IDrawingNode[] },
      { id: "output", title: "Output", files: [] as IDrawingNode[] }
    ];

    // Helper to generate file nodes with items
    const buildFileNode = (
      file: TerraformFile, 
      items: { blockType: "resource" | "data" | "output" | "variable" | "locals" | "module" | "provider"; type?: string; name: string }[], 
      rendererType: "tf-block-list" // Unified renderer
    ): IDrawingNode | null => {
      if (items.length === 0) return null;

      let maxItemWidth = 100;
      let maxTypeWidth = 0;
      const itemNodes: IDrawingNode[] = [];
      let currentY = CONFIG.filePadding.top;

      // Pass 1: find max width of the "Type" column for clean table alignment
      for (const item of items) {
        if (item.type) {
          // Exact width + some padding
          const tWidth = this.getTextWidth(item.type) + 20;
          if (tWidth > maxTypeWidth) maxTypeWidth = tWidth;
        }
      }

      // Pass 2: calculate total row width and build nodes
      for (const item of items) {
        let textLen = 0;
        if (item.type) {
          // 45(tag) + type column width + safe name cell width
          const nameBaseWidth = this.getTextWidth(item.name);
          textLen = 45 + maxTypeWidth + nameBaseWidth + 25;
        } else {
          // 45(tag) + safe name cell width
          const nameBaseWidth = this.getTextWidth(item.name);
          textLen = 45 + nameBaseWidth + 25;
        }

        if (textLen > maxItemWidth) {
          maxItemWidth = textLen;
        }

        const tagMap: Record<string, string> = {
          resource: "RSC",
          data: "DAT",
          output: "OUT",
          variable: "VAL",
          locals: "LOC",
          module: "MOD",
          provider: "PRO"
        };
        const activeTag = tagMap[item.blockType] || "UNK";

        itemNodes.push({
          id: `${dir.path}-${file.name}-${item.name}-${rendererType}`,
          x: CONFIG.filePadding.left,
          y: currentY,
          width: 0, // placeholder, updated next
          height: CONFIG.itemHeight,
          // Format: tag__type__name__typeWidth
          label: `${activeTag}__${item.type || ""}__${item.name}__${maxTypeWidth}`, 
          type: rendererType,
        });

        currentY += CONFIG.itemHeight + CONFIG.itemGap;
      }

      // Sync item widths
      itemNodes.forEach(node => { node.width = maxItemWidth; });

      const fileTitleWidth = this.getTextWidth(file.name) + 40;
      const fileWidth = Math.max(fileTitleWidth, CONFIG.filePadding.left + maxItemWidth + CONFIG.filePadding.right);
      const fileHeight = currentY - CONFIG.itemGap + CONFIG.filePadding.bottom;

      return {
        id: `${dir.path}-${file.name}-${rendererType}-file`,
        x: 0, // set by column layout
        y: 0, // set by column layout
        width: fileWidth,
        height: fileHeight,
        label: file.name,
        type: "tf-file",
        children: itemNodes
      };
    };

    // Distribute files to columns
    for (const file of dir.files) {
      const varFileNode = buildFileNode(file, file.variables, "tf-block-list");
      if (varFileNode) columns[0].files.push(varFileNode);

      const rscFileNode = buildFileNode(file, file.resources, "tf-block-list");
      if (rscFileNode) columns[1].files.push(rscFileNode);

      const outFileNode = buildFileNode(file, file.outputs, "tf-block-list");
      if (outFileNode) columns[2].files.push(outFileNode);
    }

    // Measure columns
    let currentX = CONFIG.padding.left;
    const colNodes: IDrawingNode[] = [];
    let maxColHeight = 0;

    for (const col of columns) {
      if (col.files.length === 0) continue;

      let maxFileWidth = 0;
      let currentY = CONFIG.colPadding.top;

      for (const fileNode of col.files) {
        fileNode.x = CONFIG.colPadding.left;
        fileNode.y = currentY;
        if (fileNode.width > maxFileWidth) maxFileWidth = fileNode.width;
        currentY += fileNode.height + CONFIG.fileGap;
      }

      const colTitleWidth = this.getTextWidth(col.title) + 40;
      const colWidth = Math.max(colTitleWidth, CONFIG.colPadding.left + maxFileWidth + CONFIG.colPadding.right);
      const colHeight = currentY - CONFIG.fileGap + CONFIG.colPadding.bottom;

      // Expand files to fill col width
      col.files.forEach(f => {
        // f.width = colWidth - CONFIG.colPadding.left - CONFIG.colPadding.right; // Optional expand
      });

      colNodes.push({
        id: `${dir.path}-col-${col.id}`,
        x: currentX,
        y: CONFIG.padding.top,
        width: colWidth,
        height: colHeight,
        label: col.title,
        type: "tf-column",
        children: col.files
      });

      currentX += colWidth + CONFIG.colGap;
    }

    // Equalize column heights to create a clean visual grid
    colNodes.forEach(c => { if(c.height > maxColHeight) maxColHeight = c.height; });
    colNodes.forEach(c => { c.height = maxColHeight; });

    // Parent module folder sizing
    const titleWidth = this.getTextWidth(dir.name) + 30;
    const contentWidth = currentX > CONFIG.padding.left ? currentX - CONFIG.colGap + CONFIG.padding.right : 200;
    const contentHeight = CONFIG.padding.top + maxColHeight + CONFIG.padding.bottom;

    return {
      id: `tf-dir-${dir.name}-${depth}`,
      x: 0,
      y: 0,
      width: Math.max(CONFIG.minWidth, Math.max(titleWidth, contentWidth)),
      height: Math.max(CONFIG.minHeight, contentHeight),
      label: dir.name,
      type: "terraform-dir",
      children: colNodes,
    };
  }

  private computeLayout(dir: TerraformDirectory, depth: number): IDrawingNode {
    // If it has Terraform files, map it as a Module (3-column layout)
    if (dir.files && dir.files.length > 0) {
      return this.computeModuleLayout(dir, depth);
    }

    // Standard recursive directory (e.g. environments/dev/)
    // ご要望に合わせ、基本的にはすべて縦並び（Column）に統一します
    const isRowLayout = false;

    const titleWidth = this.getTextWidth(dir.name) + 30;
    let minGroupWidth = Math.max(CONFIG.minWidth, titleWidth);

    const childrenNodes: IDrawingNode[] = [];
    
    // Depth-first compute children sizes first (Bottom-up sizing)
    if (dir.children && dir.children.length > 0) {
      for (const child of dir.children) {
        childrenNodes.push(this.computeLayout(child, depth + 1));
      }

      // Now align children based on direction
      let currentX = CONFIG.padding.left;
      let currentY = CONFIG.padding.top;
      let maxChildSpan = 0;

      for (const childNode of childrenNodes) {
        childNode.x = currentX;
        childNode.y = currentY;

        if (isRowLayout) {
          currentX += childNode.width + CONFIG.gap;
          if (childNode.height > maxChildSpan) {
            maxChildSpan = childNode.height;
          }
        } else {
          currentY += childNode.height + CONFIG.gap;
          if (childNode.width > maxChildSpan) {
            maxChildSpan = childNode.width;
          }
        }
      }

      let contentWidth = 0;
      let contentHeight = 0;

      if (isRowLayout) {
        contentWidth = currentX - CONFIG.gap + CONFIG.padding.right;
        contentHeight = CONFIG.padding.top + maxChildSpan + CONFIG.padding.bottom;
      } else {
        contentWidth = CONFIG.padding.left + maxChildSpan + CONFIG.padding.right;
        contentHeight = currentY - CONFIG.gap + CONFIG.padding.bottom;
      }

      return {
        id: `tf-dir-${dir.name}-${depth}`,
        x: 0,
        y: 0,
        width: Math.max(minGroupWidth, contentWidth),
        height: Math.max(CONFIG.minHeight, contentHeight),
        label: dir.name,
        type: "terraform-dir",
        children: childrenNodes,
      };

    } else {
      // Leaf node (empty directory exactly)
      return {
        id: `tf-dir-${dir.name}-${depth}-leaf`,
        x: 0,
        y: 0,
        width: minGroupWidth,
        height: CONFIG.minHeight,
        label: dir.name,
        type: "terraform-dir",
      };
    }
  }
}
