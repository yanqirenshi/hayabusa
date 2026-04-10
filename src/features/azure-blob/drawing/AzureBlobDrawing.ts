import { IDrawingClass, IDrawingNode } from "@/core/interfaces";
import { AzureManagementGroup, AzureSubscription, AzureResourceGroup, AzureBlobStorage, AzureBlobContainer, AzureTenant } from "../data/AzureBlobData";

const CONFIG = {
  tenantPadding: { top: 65, right: 50, bottom: 50, left: 50 },
  mgPadding: { top: 60, right: 40, bottom: 40, left: 40 },
  subPadding: { top: 60, right: 40, bottom: 40, left: 40 },
  rgPadding: { top: 60, right: 40, bottom: 40, left: 40 },
  accountPadding: { top: 60, right: 30, bottom: 30, left: 30 },
  containerPadding: { top: 40, right: 20, bottom: 20, left: 20 },
  gap: 40,
  itemGap: 10,
  itemWidth: 220,
  itemHeight: 35,
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
    
    const tenantNode = this.layoutTenant(tenant, 0, 0);
    this.width = tenantNode.width;
    this.height = tenantNode.height;
    
    this.nodes = [tenantNode];
  }

  private layoutTenant(tenant: AzureTenant, startX: number, startY: number): IDrawingNode {
    const childNodes: IDrawingNode[] = [];
    let currentX = CONFIG.tenantPadding.left;
    let maxOverallHeight = CONFIG.tenantPadding.top;

    // 1. Users Column
    if (tenant.users && tenant.users.length > 0) {
      let relativeY = 40;
      let maxWidth = 280;
      const userColNodes: IDrawingNode[] = [];

      for (const u of tenant.users) {
        userColNodes.push({
          id: `azure-user-${u.userPrincipalName}`,
          x: 15,
          y: relativeY,
          width: maxWidth - 30,
          height: CONFIG.itemHeight,
          label: u.displayName,
          type: "azure-entra-user",
          data: u
        });
        relativeY += CONFIG.itemHeight + CONFIG.itemGap;
      }

      const colHeight = Math.max(200, relativeY + 20);
      if (CONFIG.tenantPadding.top + colHeight > maxOverallHeight) {
        maxOverallHeight = CONFIG.tenantPadding.top + colHeight;
      }

      childNodes.push({
        id: `azure-users-col`,
        x: currentX,
        y: CONFIG.tenantPadding.top,
        width: maxWidth,
        height: colHeight,
        label: "Users",
        type: "azure-entra-users-container",
        children: userColNodes,
        data: null
      });

      currentX += maxWidth + CONFIG.gap;
    }

    // 2. Groups Column
    if (tenant.groups && tenant.groups.length > 0) {
      let relativeY = 40;
      let maxWidth = 280;
      const groupColNodes: IDrawingNode[] = [];

      for (const g of tenant.groups) {
        groupColNodes.push({
          id: `azure-group-${g.id}`,
          x: 15,
          y: relativeY,
          width: maxWidth - 30,
          height: CONFIG.itemHeight,
          label: g.displayName,
          type: "azure-entra-group",
          data: g
        });
        relativeY += CONFIG.itemHeight + CONFIG.itemGap;
      }

      const colHeight = Math.max(200, relativeY + 20);
      if (CONFIG.tenantPadding.top + colHeight > maxOverallHeight) {
        maxOverallHeight = CONFIG.tenantPadding.top + colHeight;
      }

      childNodes.push({
        id: `azure-groups-col`,
        x: currentX,
        y: CONFIG.tenantPadding.top,
        width: maxWidth,
        height: colHeight,
        label: "Groups",
        type: "azure-entra-groups-container",
        children: groupColNodes,
        data: null
      });

      currentX += maxWidth + CONFIG.gap;
    }

    // 3. Apps Column
    if (tenant.apps && tenant.apps.length > 0) {
      let relativeY = 40;
      let maxWidth = 280;
      const appColNodes: IDrawingNode[] = [];

      for (const a of tenant.apps) {
        appColNodes.push({
          id: `azure-app-${a.appId}`,
          x: 15,
          y: relativeY,
          width: maxWidth - 30,
          height: CONFIG.itemHeight,
          label: a.displayName,
          type: "azure-entra-app",
          data: a
        });
        relativeY += CONFIG.itemHeight + CONFIG.itemGap;
      }

      const colHeight = Math.max(200, relativeY + 20);
      if (CONFIG.tenantPadding.top + colHeight > maxOverallHeight) {
        maxOverallHeight = CONFIG.tenantPadding.top + colHeight;
      }

      childNodes.push({
        id: `azure-apps-col`,
        x: currentX,
        y: CONFIG.tenantPadding.top,
        width: maxWidth,
        height: colHeight,
        label: "Apps",
        type: "azure-entra-apps-container",
        children: appColNodes,
        data: null
      });

      currentX += maxWidth + CONFIG.gap;
    }

    // 4. Management Groups Column
    if (tenant.managementGroups && tenant.managementGroups.length > 0) {
      let mgY = CONFIG.tenantPadding.top;
      let maxMgWidth = 0;

      for (const mg of tenant.managementGroups) {
        const mgNode = this.layoutManagementGroup(mg, currentX, mgY);
        childNodes.push(mgNode);
        mgY += mgNode.height + CONFIG.gap;
        if (mgNode.width > maxMgWidth) maxMgWidth = mgNode.width;
      }

      if (mgY > maxOverallHeight) {
        maxOverallHeight = mgY;
      }
      currentX += maxMgWidth;
    } else {
      // In case there are no MGs, remove the extra gap
      currentX -= CONFIG.gap;
    }

    const tenantWidth = Math.max(500, currentX + CONFIG.tenantPadding.right);
    const tenantHeight = Math.max(250, maxOverallHeight + CONFIG.tenantPadding.bottom);

    return {
      id: `azure-tenant-${tenant.name}`,
      x: startX,
      y: startY,
      width: tenantWidth,
      height: tenantHeight,
      label: tenant.name,
      type: "azure-tenant",
      children: childNodes,
      data: tenant
    };
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

    return {
      id: `azure-mg-${mg.name}`,
      x: startX,
      y: startY,
      width: mgWidth,
      height: mgHeight,
      label: mg.name,
      type: "azure-management-group",
      children: childNodes,
      data: mg
    };
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

    return {
      id: `azure-sub-${sub.name}`,
      x: startX,
      y: startY,
      width: subWidth,
      height: subHeight,
      label: sub.name,
      type: "azure-subscription",
      children: childNodes,
      data: sub
    };
  }

  private layoutResourceGroup(rg: AzureResourceGroup, startX: number, startY: number): IDrawingNode {
    let currentY = CONFIG.rgPadding.top;
    let maxWidth = 0;
    const childNodes: IDrawingNode[] = [];

    for (const storage of rg.storages) {
      const storageNode = this.layoutStorageAccount(storage, CONFIG.rgPadding.left, currentY);
      childNodes.push(storageNode);
      currentY += storageNode.height + CONFIG.gap;
      if (storageNode.width > maxWidth) maxWidth = storageNode.width;
    }

    const rgWidth = Math.max(300, CONFIG.rgPadding.left + maxWidth + CONFIG.rgPadding.right);
    const rgHeight = Math.max(100, currentY > CONFIG.rgPadding.top ? currentY - CONFIG.gap + CONFIG.rgPadding.bottom : CONFIG.rgPadding.top + CONFIG.rgPadding.bottom);

    return {
      id: `azure-rg-${rg.name}`,
      x: startX,
      y: startY,
      width: rgWidth,
      height: rgHeight,
      label: rg.name,
      type: "azure-resource-group",
      children: childNodes,
      data: rg
    };
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
        childNodes.push({
          id: `${storage.accountName}-${container.name}-dir-${dir.name}`,
          x: CONFIG.containerPadding.left,
          y: currentItemY,
          width: maxItemWidth,
          height: CONFIG.itemHeight,
          label: dir.name,
          type: "azure-blob-directory",
          data: dir
        });
        currentItemY += CONFIG.itemHeight + CONFIG.itemGap;
      }

      for (const blob of container.blobs) {
        childNodes.push({
          id: `${storage.accountName}-${container.name}-blob-${blob.name}`,
          x: CONFIG.containerPadding.left,
          y: currentItemY,
          width: maxItemWidth,
          height: CONFIG.itemHeight,
          label: blob.name,
          type: "azure-blob-item",
          data: blob
        });
        currentItemY += CONFIG.itemHeight + CONFIG.itemGap;
      }

      const computedContainerWidth = CONFIG.containerPadding.left + maxItemWidth + CONFIG.containerPadding.right;
      const computedContainerHeight = Math.max(200, currentItemY - CONFIG.itemGap + CONFIG.containerPadding.bottom);
      
      containerNodes.push({
        id: `azure-blob-container-${storage.accountName}-${container.name}`,
        x: currentContainerX,
        y: CONFIG.accountPadding.top,
        width: computedContainerWidth,
        height: computedContainerHeight,
        label: container.name,
        type: "azure-blob-container",
        children: childNodes,
        data: container,
      });
      
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

    return {
      id: `azure-blob-account-${storage.accountName}`,
      x: startX,
      y: startY,
      width: accountWidth,
      height: accountHeight,
      label: storage.accountName,
      type: "azure-blob-account",
      children: containerNodes,
      data: storage,
    };
  }
}
