"use server";

import { ClientSecretCredential } from "@azure/identity";
import { AzureEntraUser, AzureEntraGroup, AzureEntraApp } from "../data/AzureBlobData";
import { Logger } from "@/core/Logger";

export async function fetchEntraIdUsersAndGroups(): Promise<{ users: AzureEntraUser[], groups: AzureEntraGroup[], apps: AzureEntraApp[], tenantName: string | null }> {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret || tenantId === "your_tenant_id") {
    Logger.error("[EntraID] Tenant/Client credentials are empty or invalid.");
    throw new Error("Azure Entra ID credentials (Tenant ID, Client ID, Secret) are not fully configured in .env.local.");
  }

  let tenantName: string | null = null;

  try {
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    const tokenResponse = await credential.getToken("https://graph.microsoft.com/.default");

    if (!tokenResponse) {
      throw new Error("Failed to acquire token");
    }

    const { token } = tokenResponse;
    const headers = { Authorization: `Bearer ${token}` };

    // Page size is configurable. Microsoft Graph allows $top up to 999.
    const pageSize = Math.max(1, Math.min(999, parseInt(process.env.AZURE_ENTRA_PAGE_SIZE || "100", 10) || 100));

    // Fire all 4 Graph endpoints in parallel; isolate failures so a single
    // permission gap doesn't tank the whole batch.
    const safeFetch = (url: string) =>
      fetch(url, { headers }).catch((e) => {
        Logger.warn(`[EntraID] Network error fetching ${url}:`, e);
        return null as Response | null;
      });

    const [orgRes, usersRes, groupsRes, appsRes] = await Promise.all([
      safeFetch("https://graph.microsoft.com/v1.0/organization?$select=displayName"),
      safeFetch(`https://graph.microsoft.com/v1.0/users?$top=${pageSize}&$select=id,displayName,userPrincipalName`),
      safeFetch(`https://graph.microsoft.com/v1.0/groups?$top=${pageSize}&$select=id,displayName`),
      safeFetch(`https://graph.microsoft.com/v1.0/applications?$top=${pageSize}&$select=id,displayName,appId`),
    ]);

    if (orgRes && orgRes.ok) {
      try {
        const parsedOrg = await orgRes.json();
        if (parsedOrg.value && parsedOrg.value.length > 0) {
          tenantName = parsedOrg.value[0].displayName;
        }
      } catch (e) {
        Logger.warn("[EntraID] Failed to parse organization response", e);
      }
    } else if (orgRes) {
      Logger.warn(`[EntraID] Failed to fetch organization info: ${orgRes.status}`);
    }

    if (!usersRes || !usersRes.ok || !groupsRes || !groupsRes.ok) {
      throw new Error(
        `Graph API returned error: users=${usersRes?.status ?? "no-response"}, groups=${groupsRes?.status ?? "no-response"}`
      );
    }

    const parsedUsers = await usersRes.json();
    const parsedGroups = await groupsRes.json();
    let parsedApps: any = { value: [] };

    if (appsRes && appsRes.ok) {
      parsedApps = await appsRes.json();
    } else if (appsRes) {
      const errText = await appsRes.text();
      Logger.warn("[EntraID] Apps fetch returned error:", appsRes.status, errText);
      parsedApps.value = [{ displayName: "Require App.Read.All", appId: "error-app" }];
    }

    const users: AzureEntraUser[] = (parsedUsers.value || []).map((u: any) => new AzureEntraUser(u.displayName || "Unknown User", u.userPrincipalName || ""));
    const groups: AzureEntraGroup[] = (parsedGroups.value || []).map((g: any) => new AzureEntraGroup(g.displayName || "Unknown Group", g.id || ""));
    const apps: AzureEntraApp[] = (parsedApps.value || []).map((a: any) => new AzureEntraApp(a.displayName || "Unknown App", a.appId || ""));

    return { users, groups, apps, tenantName };
  } catch (error: any) {
    Logger.error("[EntraID] Failed to fetch users/groups:", error);
    throw new Error(`Failed to fetch Entra ID data: ${error.message || JSON.stringify(error)}`);
  }
}


