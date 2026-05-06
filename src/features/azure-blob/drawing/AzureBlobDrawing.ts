import { IDrawingClass, IDrawingNode } from "@/core/interfaces";
import { AzureManagementGroup, AzureSubscription, AzureResourceGroup, AzureBlobStorage, AzureBlobContainer, AzureTenant, AzureDevOps, AzureContainerRegistry, AzureBatch, AzureDataFactory } from "../data/AzureBlobData";
import { AzureEntraUser, AzureEntraGroup, AzureEntraApp, AzureDevOpsRepoNode, AzureDevOpsPipelineNode, AzureDevOpsOrganizationNode, AzureManagementGroupNode, AzureSubscriptionNode, AzureResourceGroupNode, AzureBlobItemNode, AzureContainerRegistryNode, AzureBatchNode, AzureDataFactoryNode, AzureBlobContainerNode, AzureStorageAccountNode, AzureEntraRoot, AzureEntraContainer, AzureArmRoot, AzureDevOpsRoot } from "./AzureNodes";

const CONFIG = {
  tenantPadding: { top: 60, right: 20, bottom: 20, left: 20 },
  mgPadding: { top: 60, right: 20, bottom: 20, left: 20 },
  subPadding: { top: 60, right: 20, bottom: 20, left: 20 },
  rgPadding: { top: 60, right: 20, bottom: 20, left: 20 },
  accountPadding: { top: 60, right: 20, bottom: 20, left: 20 },
  containerPadding: { top: 60, right: 20, bottom: 20, left: 20 },
  gap: 20,
  itemGap: 10,
  itemWidth: 260,
  itemHeight: 50,
};

export class AzureBlobDrawing implements IDrawingClass {
  public nodes: IDrawingNode[] = [];
  public width: number = 0;
  public height: number = 0;

  constructor(data: AzureTenant, private measureTextWidth?: (text: string) => number) {
    this.computeLayout(data);
  }

  private computeLayout(tenant: AzureTenant) {
    this.nodes = [];
    
    let currentY = 0;
    const startX = 0;
    
    // 1. Entra ID
    const entraNode = this.layoutEntraId(tenant, startX, currentY);
    if (entraNode) {
      this.nodes.push(entraNode);
      currentY += entraNode.height + CONFIG.gap;
      this.width = Math.max(this.width, entraNode.width);
    }
    
    // 2. ARM
    const armNode = this.layoutARM(tenant, startX, currentY);
    if (armNode) {
      this.nodes.push(armNode);
      currentY += armNode.height + CONFIG.gap;
      this.width = Math.max(this.width, armNode.width);
    }
    
    // 3. DevOps
    const devOpsNode = this.layoutDevOps(tenant, startX, currentY);
    if (devOpsNode) {
      this.nodes.push(devOpsNode);
      currentY += devOpsNode.height + CONFIG.gap;
      this.width = Math.max(this.width, devOpsNode.width);
    }
    
    this.height = currentY;
  }

  private layoutEntraId(tenant: AzureTenant, startX: number, startY: number): IDrawingNode | null {
    const hasUsers = tenant.users && tenant.users.length > 0;
    const hasGroups = tenant.groups && tenant.groups.length > 0;
    const hasApps = tenant.apps && tenant.apps.length > 0;
    
    if (!hasUsers && !hasGroups && !hasApps) return null;

    const childNodes: IDrawingNode[] = [];
    let currentX = CONFIG.tenantPadding.left;
    let maxOverallHeight = CONFIG.tenantPadding.top;

    // 1. Users Column
    if (hasUsers) {
      let relativeY = 60;
      let maxWidth = 280;
      const userColNodes: IDrawingNode[] = [];

      for (const u of tenant.users) {
        userColNodes.push(new AzureEntraUser({
          id: `azure-user-${u.userPrincipalName}`,
          x: 20,
          y: relativeY,
          width: maxWidth - 40,
          height: CONFIG.itemHeight,
          label: u.displayName,
          type: "azure-entra-user",
          data: u
        }));
        relativeY += CONFIG.itemHeight + CONFIG.itemGap;
      }

      const colHeight = Math.max(200, relativeY + 20);
      if (CONFIG.tenantPadding.top + colHeight > maxOverallHeight) {
        maxOverallHeight = CONFIG.tenantPadding.top + colHeight;
      }

      childNodes.push(new AzureEntraContainer({
        id: `azure-users-col`,
        x: currentX,
        y: CONFIG.tenantPadding.top,
        width: maxWidth,
        height: colHeight,
        label: "Users",
        type: "azure-entra-users-container",
        children: userColNodes,
        data: null
      }));

      currentX += maxWidth + CONFIG.gap;
    }

    // 2. Groups Column
    if (hasGroups) {
      let relativeY = 60;
      let maxWidth = 280;
      const groupColNodes: IDrawingNode[] = [];

      for (const g of tenant.groups) {
        groupColNodes.push(new AzureEntraGroup({
          id: `azure-group-${g.id}`,
          x: 20,
          y: relativeY,
          width: maxWidth - 40,
          height: CONFIG.itemHeight,
          label: g.displayName,
          type: "azure-entra-group",
          data: g
        }));
        relativeY += CONFIG.itemHeight + CONFIG.itemGap;
      }

      const colHeight = Math.max(200, relativeY + 20);
      if (CONFIG.tenantPadding.top + colHeight > maxOverallHeight) {
        maxOverallHeight = CONFIG.tenantPadding.top + colHeight;
      }

      childNodes.push(new AzureEntraContainer({
        id: `azure-groups-col`,
        x: currentX,
        y: CONFIG.tenantPadding.top,
        width: maxWidth,
        height: colHeight,
        label: "Groups",
        type: "azure-entra-groups-container",
        children: groupColNodes,
        data: null
      }));

      currentX += maxWidth + CONFIG.gap;
    }

    // 3. Apps Column
    if (hasApps) {
      let relativeY = 60;
      let maxWidth = 280;
      const appColNodes: IDrawingNode[] = [];

      for (const a of tenant.apps) {
        appColNodes.push(new AzureEntraApp({
          id: `azure-app-${a.appId}`,
          x: 20,
          y: relativeY,
          width: maxWidth - 40,
          height: CONFIG.itemHeight,
          label: a.displayName,
          type: "azure-entra-app",
          data: a
        }));
        relativeY += CONFIG.itemHeight + CONFIG.itemGap;
      }

      const colHeight = Math.max(200, relativeY + 20);
      if (CONFIG.tenantPadding.top + colHeight > maxOverallHeight) {
        maxOverallHeight = CONFIG.tenantPadding.top + colHeight;
      }

      childNodes.push(new AzureEntraContainer({
        id: `azure-apps-col`,
        x: currentX,
        y: CONFIG.tenantPadding.top,
        width: maxWidth,
        height: colHeight,
        label: "Apps",
        type: "azure-entra-apps-container",
        children: appColNodes,
        data: null
      }));

      currentX += maxWidth + CONFIG.gap;
    }

    const containerWidth = Math.max(500, currentX - CONFIG.gap + CONFIG.tenantPadding.right);
    const containerHeight = Math.max(250, maxOverallHeight + CONFIG.tenantPadding.bottom);

    return new AzureEntraRoot({
      id: `azure-entra-root-${tenant.name}`,
      x: startX,
      y: startY,
      width: containerWidth,
      height: containerHeight,
      label: "Microsoft Entra ID",
      type: "azure-entra-root",
      children: childNodes,
      data: { name: "Microsoft Entra ID", type: "Entra ID" }
    });
  }

  private layoutARM(tenant: AzureTenant, startX: number, startY: number): IDrawingNode | null {
    if (!tenant.managementGroups || tenant.managementGroups.length === 0) return null;

    const childNodes: IDrawingNode[] = [];
    let currentX = CONFIG.tenantPadding.left;
    let maxOverallHeight = CONFIG.tenantPadding.top;

    for (const mg of tenant.managementGroups) {
      const mgNode = this.layoutManagementGroup(mg, currentX, CONFIG.tenantPadding.top);
      childNodes.push(mgNode);
      currentX += mgNode.width + CONFIG.gap;
      if (mgNode.height + CONFIG.tenantPadding.top > maxOverallHeight) {
        maxOverallHeight = mgNode.height + CONFIG.tenantPadding.top;
      }
    }

    const containerWidth = Math.max(500, currentX - CONFIG.gap + CONFIG.tenantPadding.right);
    const containerHeight = Math.max(250, maxOverallHeight + CONFIG.tenantPadding.bottom);

    return new AzureArmRoot({
      id: `azure-arm-root-${tenant.name}`,
      x: startX,
      y: startY,
      width: containerWidth,
      height: containerHeight,
      label: "Azure Resource Manager",
      type: "azure-arm-root",
      children: childNodes,
      data: { name: "Azure Resource Manager", type: "ARM" }
    });
  }

  private layoutDevOps(tenant: AzureTenant, startX: number, startY: number): IDrawingNode | null {
    if (!tenant.devOps || tenant.devOps.length === 0) return null;

    const childNodes: IDrawingNode[] = [];
    let currentX = CONFIG.tenantPadding.left;
    let maxOverallHeight = CONFIG.tenantPadding.top;

    for (const d of tenant.devOps) {
      let relativeY = 60;
      let maxWidth = 280;
      const devOpsNodes: IDrawingNode[] = [];

      for (const r of d.repos) {
        devOpsNodes.push(new AzureDevOpsRepoNode({
          id: `azure-devops-repo-${r.id}`,
          x: 20,
          y: relativeY,
          width: maxWidth - 40,
          height: CONFIG.itemHeight,
          label: r.name,
          type: "azure-devops-repo",
          data: r
        }));
        relativeY += CONFIG.itemHeight + CONFIG.itemGap;
      }
      for (const p of d.pipelines) {
        devOpsNodes.push(new AzureDevOpsPipelineNode({
          id: `azure-devops-pipe-${p.id}`,
          x: 20,
          y: relativeY,
          width: maxWidth - 40,
          height: CONFIG.itemHeight,
          label: p.name,
          type: "azure-devops-pipeline",
          data: p
        }));
        relativeY += CONFIG.itemHeight + CONFIG.itemGap;
      }

      const colHeight = Math.max(200, relativeY + 20);
      if (CONFIG.tenantPadding.top + colHeight > maxOverallHeight) {
        maxOverallHeight = CONFIG.tenantPadding.top + colHeight;
      }

      childNodes.push(new AzureDevOpsOrganizationNode({
        id: `azure-devops-col-${d.organizationName}`,
        x: currentX,
        y: CONFIG.tenantPadding.top,
        width: maxWidth,
        height: colHeight,
        label: d.organizationName || "Azure DevOps",
        type: "azure-devops-container",
        children: devOpsNodes,
        data: d
      }));

      currentX += maxWidth + CONFIG.gap;
    }

    const containerWidth = Math.max(500, currentX - CONFIG.gap + CONFIG.tenantPadding.right);
    const containerHeight = Math.max(250, maxOverallHeight + CONFIG.tenantPadding.bottom);

    return new AzureDevOpsRoot({
      id: `azure-devops-root-${tenant.name}`,
      x: startX,
      y: startY,
      width: containerWidth,
      height: containerHeight,
      label: "Azure DevOps",
      type: "azure-devops-root",
      children: childNodes,
      data: { name: "Azure DevOps", type: "DevOps" }
    });
  }

  private layoutManagementGroup(mg: AzureManagementGroup, startX: number, startY: number): IDrawingNode {
    let currentY = CONFIG.mgPadding.top;
    let maxWidth = 0;
    const childNodes: IDrawingNode[] = [];

    for (const sub of mg.subscriptions) {
      const subNode = this.layoutSubscription(sub, CONFIG.mgPadding.left, currentY);
      childNodes.push(subNode);
      currentY += subNode.height + CONFIG.gap;
      if (subNode.width > maxWidth) maxWidth = subNode.width;
    }

    const mgWidth = Math.max(400, CONFIG.mgPadding.left + maxWidth + CONFIG.mgPadding.right);
    const mgHeight = Math.max(200, currentY > CONFIG.mgPadding.top ? currentY - CONFIG.gap + CONFIG.mgPadding.bottom : CONFIG.mgPadding.top + CONFIG.mgPadding.bottom);

    return new AzureManagementGroupNode({
          id: `azure-mg-${mg.name}`,
          x: startX,
          y: startY,
          width: mgWidth,
          height: mgHeight,
          label: mg.name,
          type: "azure-management-group",
          children: childNodes,
          data: mg
        });
  }

  private layoutSubscription(sub: AzureSubscription, startX: number, startY: number): IDrawingNode {
    let currentY = CONFIG.subPadding.top;
    let maxWidth = 0;
    const childNodes: IDrawingNode[] = [];

    for (const rg of sub.resourceGroups) {
      const rgNode = this.layoutResourceGroup(rg, CONFIG.subPadding.left, currentY);
      childNodes.push(rgNode);
      currentY += rgNode.height + CONFIG.gap;
      if (rgNode.width > maxWidth) maxWidth = rgNode.width;
    }

    const subWidth = Math.max(350, CONFIG.subPadding.left + maxWidth + CONFIG.subPadding.right);
    const subHeight = Math.max(150, currentY > CONFIG.subPadding.top ? currentY - CONFIG.gap + CONFIG.subPadding.bottom : CONFIG.subPadding.top + CONFIG.subPadding.bottom);

    return new AzureSubscriptionNode({
          id: `azure-sub-${sub.name}`,
          x: startX,
          y: startY,
          width: subWidth,
          height: subHeight,
          label: sub.name,
          type: "azure-subscription",
          children: childNodes,
          data: sub
        });
  }

  private layoutResourceGroup(rg: AzureResourceGroup, startX: number, startY: number): IDrawingNode {
    let currentY = CONFIG.rgPadding.top;
    let maxWidth = 0;
    const childNodes: IDrawingNode[] = [];

    for (const resource of rg.resources) {
      let node: IDrawingNode;
      const res = resource as any;
      if (res.type === "storage") {
        node = this.layoutStorageAccount(resource as AzureBlobStorage, CONFIG.rgPadding.left, currentY);
      } else if (res.type === "acr") {
        node = this.layoutACR(resource as AzureContainerRegistry, CONFIG.rgPadding.left, currentY);
      } else if (res.type === "batch") {
        node = this.layoutBatch(resource as AzureBatch, CONFIG.rgPadding.left, currentY);
      } else if (res.type === "adf") {
        node = this.layoutADF(resource as AzureDataFactory, CONFIG.rgPadding.left, currentY);
      } else {
        continue;
      }
      
      childNodes.push(node);
      currentY += node.height + CONFIG.gap;
      if (node.width > maxWidth) maxWidth = node.width;
    }

    const rgWidth = Math.max(300, CONFIG.rgPadding.left + maxWidth + CONFIG.rgPadding.right);
    const rgHeight = Math.max(100, currentY > CONFIG.rgPadding.top ? currentY - CONFIG.gap + CONFIG.rgPadding.bottom : CONFIG.rgPadding.top + CONFIG.rgPadding.bottom);

    return new AzureResourceGroupNode({
          id: `azure-rg-${rg.name}`,
          x: startX,
          y: startY,
          width: rgWidth,
          height: rgHeight,
          label: rg.name,
          type: "azure-resource-group",
          children: childNodes,
          data: rg
        });
  }

  private layoutACR(acr: AzureContainerRegistry, startX: number, startY: number): IDrawingNode {
    let currentItemY = CONFIG.containerPadding.top;
    const childNodes: IDrawingNode[] = [];
    const maxItemWidth = CONFIG.itemWidth;

    for (const repo of acr.repositories) {
      childNodes.push(new AzureBlobItemNode({
              id: `azure-acr-${acr.name}-repo-${repo}`,
              x: CONFIG.containerPadding.left,
              y: currentItemY,
              width: maxItemWidth,
              height: CONFIG.itemHeight,
              label: repo,
              type: "azure-container-repository",
              data: repo
            }));
      currentItemY += CONFIG.itemHeight + CONFIG.itemGap;
    }

    const acrWidth = Math.max(300, CONFIG.containerPadding.left + maxItemWidth + CONFIG.containerPadding.right);
    const acrHeight = Math.max(60, currentItemY > CONFIG.containerPadding.top ? currentItemY - CONFIG.itemGap + CONFIG.containerPadding.bottom : 60);

    return new AzureContainerRegistryNode({
          id: `azure-acr-${acr.name}`,
          x: startX,
          y: startY,
          width: acrWidth,
          height: acrHeight,
          label: acr.name,
          type: "azure-acr",
          children: childNodes,
          data: acr
        });
  }

  private layoutBatch(batch: AzureBatch, startX: number, startY: number): IDrawingNode {
    return new AzureBatchNode({
          id: `azure-batch-${batch.name}`,
          x: startX,
          y: startY,
          width: 280,
          height: 60,
          label: batch.name,
          type: "azure-batch",
          data: batch
        });
  }

  private layoutADF(adf: AzureDataFactory, startX: number, startY: number): IDrawingNode {
    let currentItemY = CONFIG.containerPadding.top;
    const childNodes: IDrawingNode[] = [];
    const maxItemWidth = CONFIG.itemWidth;

    for (const pipeline of adf.pipelines) {
      childNodes.push(new AzureDevOpsPipelineNode({
              id: `azure-adf-${adf.name}-pipeline-${pipeline.name}`,
              x: CONFIG.containerPadding.left,
              y: currentItemY,
              width: maxItemWidth,
              height: CONFIG.itemHeight,
              label: pipeline.name,
              type: "azure-adf-pipeline",
              data: pipeline
            }));
      currentItemY += CONFIG.itemHeight + CONFIG.itemGap;
    }

    const adfWidth = Math.max(300, CONFIG.containerPadding.left + maxItemWidth + CONFIG.containerPadding.right);
    const adfHeight = Math.max(60, currentItemY > CONFIG.containerPadding.top ? currentItemY - CONFIG.itemGap + CONFIG.containerPadding.bottom : 60);

    return new AzureDataFactoryNode({
          id: `azure-adf-${adf.name}`,
          x: startX,
          y: startY,
          width: adfWidth,
          height: adfHeight,
          label: adf.name,
          type: "azure-adf",
          children: childNodes,
          data: adf
        });
  }

  private layoutStorageAccount(storage: AzureBlobStorage, startX: number, startY: number): IDrawingNode {
    let currentContainerX = CONFIG.accountPadding.left;
    let maxContainerHeight = 0;

    const containerNodes: IDrawingNode[] = [];
    
    for (const container of storage.containers) {
      let currentItemY = CONFIG.containerPadding.top;
      const childNodes: IDrawingNode[] = [];
      
      let maxItemWidth = CONFIG.itemWidth;

      const allItems = [...container.directories.map(d => ({ name: d.name, type: "directory" })), ...container.blobs.map(b => ({ name: b.name, type: "blob" }))];

      for (const item of allItems) {
        let textWidth = this.measureTextWidth ? this.measureTextWidth(item.name) : item.name.length * 9.5;
        const estimatedWidth = textWidth + 35;
        if (estimatedWidth > maxItemWidth) {
          maxItemWidth = estimatedWidth;
        }
      }

      for (const dir of container.directories) {
        childNodes.push(new AzureBlobItemNode({
                  id: `${storage.accountName}-${container.name}-dir-${dir.name}`,
                  x: CONFIG.containerPadding.left,
                  y: currentItemY,
                  width: maxItemWidth,
                  height: CONFIG.itemHeight,
                  label: dir.name,
                  type: "azure-blob-directory",
                  data: dir
                }));
        currentItemY += CONFIG.itemHeight + CONFIG.itemGap;
      }

      for (const blob of container.blobs) {
        childNodes.push(new AzureBlobItemNode({
                  id: `${storage.accountName}-${container.name}-blob-${blob.name}`,
                  x: CONFIG.containerPadding.left,
                  y: currentItemY,
                  width: maxItemWidth,
                  height: CONFIG.itemHeight,
                  label: blob.name,
                  type: "azure-blob-item",
                  data: blob
                }));
        currentItemY += CONFIG.itemHeight + CONFIG.itemGap;
      }

      const computedContainerWidth = CONFIG.containerPadding.left + maxItemWidth + CONFIG.containerPadding.right;
      const computedContainerHeight = Math.max(200, currentItemY - CONFIG.itemGap + CONFIG.containerPadding.bottom);
      
      containerNodes.push(new AzureBlobContainerNode({
              id: `azure-blob-container-${storage.accountName}-${container.name}`,
              x: currentContainerX,
              y: CONFIG.accountPadding.top,
              width: computedContainerWidth,
              height: computedContainerHeight,
              label: container.name,
              type: "azure-blob-container",
              children: childNodes,
              data: container,
            }));
      
      currentContainerX += computedContainerWidth + CONFIG.gap;
      
      if (computedContainerHeight > maxContainerHeight) {
        maxContainerHeight = computedContainerHeight;
      }
    }

    for (const cNode of containerNodes) {
      cNode.height = maxContainerHeight;
    }

    const accountWidth = Math.max(300, currentContainerX > CONFIG.accountPadding.left ? currentContainerX - CONFIG.gap + CONFIG.accountPadding.right : 300);
    const accountHeight = Math.max(100, CONFIG.accountPadding.top + maxContainerHeight + CONFIG.accountPadding.bottom);

    return new AzureStorageAccountNode({
          id: `azure-blob-account-${storage.accountName}`,
          x: startX,
          y: startY,
          width: accountWidth,
          height: accountHeight,
          label: storage.accountName,
          type: "azure-blob-account",
          children: containerNodes,
          data: storage,
        });
  }
}
