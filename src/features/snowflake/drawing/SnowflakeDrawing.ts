import { IDrawingClass, IDrawingNode } from "@/core/interfaces";
import { SnowflakeDatabase, SnowflakeSchema, SnowflakeObjectGroup, SnowflakeObject } from "../data/SnowflakeData";

// Define layout constants
const CONFIG = {
  dbPadding: { top: 50, right: 30, bottom: 30, left: 30 },
  schemaPadding: { top: 40, right: 20, bottom: 20, left: 20 },
  groupPadding: { top: 35, right: 15, bottom: 15, left: 15 },
  schemaGap: 30,
  groupGap: 20,
  itemGap: 10,
  itemWidth: 220,
  itemHeight: 35,
};

export class SnowflakeDrawing implements IDrawingClass {
  public nodes: IDrawingNode[] = [];
  public width: number = 0;
  public height: number = 0;

  constructor(data: SnowflakeDatabase, private measureTextWidth?: (text: string) => number) {
    this.computeLayout(data);
  }

  private computeLayout(db: SnowflakeDatabase) {
    this.nodes = [];
    
    let currentSchemaX = CONFIG.dbPadding.left;
    let maxSchemaHeight = 0;

    // First pass: compute sizes and locations of schemas and children
    const schemaNodes: IDrawingNode[] = [];
    
    for (const schema of db.schemas) {
      let currentGroupY = CONFIG.schemaPadding.top;
      const groupNodes: IDrawingNode[] = [];
      
      let maxGroupWidth = 0;

      for (const group of schema.objectGroups) {
        // Pre-calculate maximum item width needed in this group
        let maxItemWidthForGroup = CONFIG.itemWidth;
        for (const obj of group.objects) {
          // If precise measurement is available from the client, use it. Otherwise fallback to heuristic.
          let textWidth = 0;
          if (this.measureTextWidth) {
            textWidth = this.measureTextWidth(obj.name);
          } else {
            // Estimate pixel width: ~9.5px per char for a 13px font (especially for uppercase like M, W, $)
            textWidth = obj.name.length * 9.5;
          }
          
          const estimatedWidth = textWidth + 25; // add 25px horizontal padding
          
          if (estimatedWidth > maxItemWidthForGroup) {
            maxItemWidthForGroup = estimatedWidth;
          }
        }

        // Items in this group
        const itemNodes: IDrawingNode[] = [];
        let currentItemY = CONFIG.groupPadding.top;
        
        for (const obj of group.objects) {
          const itemNode: IDrawingNode = {
            id: `${schema.name}-${group.type}-${obj.name}`,
            x: CONFIG.groupPadding.left,
            y: currentItemY,
            width: maxItemWidthForGroup,
            height: CONFIG.itemHeight,
            label: obj.name,
            type: "item"
          };
          itemNodes.push(itemNode);
          currentItemY += CONFIG.itemHeight + CONFIG.itemGap;
        }

        // Object Group sizing
        const groupHeight = Math.max(CONFIG.groupPadding.top + CONFIG.groupPadding.bottom, currentItemY - CONFIG.itemGap + CONFIG.groupPadding.bottom);
        const groupWidth = CONFIG.groupPadding.left + maxItemWidthForGroup + CONFIG.groupPadding.right;
        
        const groupNode: IDrawingNode = {
          id: `${schema.name}-${group.type}`,
          x: CONFIG.schemaPadding.left,
          y: currentGroupY,
          width: groupWidth,
          height: groupHeight,
          label: group.type,
          type: "group",
          children: itemNodes
        };
        groupNodes.push(groupNode);
        
        if (groupWidth > maxGroupWidth) {
          maxGroupWidth = groupWidth;
        }
        currentGroupY += groupHeight + CONFIG.groupGap;
      }

      // Determine Schema sizing
      // Force minimum schema height and width for empty ones (like MART)
      const minSchemaHeight = 500; // Let's ensure empty schemas stretch down beautifully
      const minSchemaWidth = CONFIG.schemaPadding.left + CONFIG.itemWidth + CONFIG.groupPadding.left + CONFIG.groupPadding.right + CONFIG.schemaPadding.right;
      
      const computedSchemaWidth = Math.max(minSchemaWidth, CONFIG.schemaPadding.left + maxGroupWidth + CONFIG.schemaPadding.right);
      const computedSchemaHeight = Math.max(minSchemaHeight, currentGroupY - CONFIG.groupGap + CONFIG.schemaPadding.bottom);
      
      const schemaNode: IDrawingNode = {
        id: `schema-${schema.name}`,
        x: currentSchemaX,
        y: CONFIG.dbPadding.top,
        width: computedSchemaWidth,
        height: computedSchemaHeight,
        label: schema.name,
        type: "schema",
        children: groupNodes
      };
      
      schemaNodes.push(schemaNode);
      
      currentSchemaX += computedSchemaWidth + CONFIG.schemaGap;
      if (computedSchemaHeight > maxSchemaHeight) {
        maxSchemaHeight = computedSchemaHeight;
      }
    }

    // Now equalize schema heights so they look aligned (like the wireframe)
    for (const sNode of schemaNodes) {
      sNode.height = maxSchemaHeight;
    }

    // Determine DB Sizing
    const dbWidth = currentSchemaX - CONFIG.schemaGap + CONFIG.dbPadding.right;
    const dbHeight = CONFIG.dbPadding.top + maxSchemaHeight + CONFIG.dbPadding.bottom;
    this.width = dbWidth;
    this.height = dbHeight;

    const dbNode: IDrawingNode = {
      id: "database",
      x: 0,
      y: 0,
      width: dbWidth,
      height: dbHeight,
      label: db.name,
      type: "database",
      children: schemaNodes
    };

    // Keep it as a nested single root, but can flatten if needed.
    // The renderer will consume this root node.
    this.nodes = [dbNode];
  }
}
