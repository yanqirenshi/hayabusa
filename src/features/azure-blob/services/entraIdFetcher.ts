"use server";

import { ClientSecretCredential } from "@azure/identity";
import { AzureEntraUser, AzureEntraGroup, AzureEntraApp } from "../data/AzureBlobData";

export async function fetchEntraIdUsersAndGroups(): Promise<{ users: AzureEntraUser[], groups: AzureEntraGroup[], apps: AzureEntraApp[], tenantName: string | null }> {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret || tenantId === "your_tenant_id") {
    // Missing credentials, fallback to dummy
    console.warn("[EntraID] Tenant/Client credentials are empty or invalid. Using mock user/group/app data.");
    return {
      users: [
        new AzureEntraUser("Alice Tanaka (Mock)", "alice.tanaka@example.mock"),
        new AzureEntraUser("Bob Suzuki (Mock)", "bob.suzuki@example.mock"),
        new AzureEntraUser("Charlie Sato (Mock)", "charlie.sato@example.mock"),
      ],
      groups: [
        new AzureEntraGroup("Global Administrators (Mock)", "group-mock-01"),
        new AzureEntraGroup("Data Engineers (Mock)", "group-mock-02"),
      ],
      apps: [
        new AzureEntraApp("Hayabusa Auth App (Mock)", "app-mock-01"),
      ],
      tenantName: null
    };
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
        console.warn(`[EntraID] Network error fetching ${url}:`, e);
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
        console.warn("[EntraID] Failed to parse organization response", e);
      }
    } else if (orgRes) {
      console.warn(`[EntraID] Failed to fetch organization info: ${orgRes.status}`);
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
      console.warn("[EntraID] Apps fetch returned error:", appsRes.status, errText);
      parsedApps.value = [{ displayName: "Require App.Read.All", appId: "error-app" }];
    }

    const users: AzureEntraUser[] = (parsedUsers.value || []).map((u: any) => new AzureEntraUser(u.displayName || "Unknown User", u.userPrincipalName || ""));
    const groups: AzureEntraGroup[] = (parsedGroups.value || []).map((g: any) => new AzureEntraGroup(g.displayName || "Unknown Group", g.id || ""));
    const apps: AzureEntraApp[] = (parsedApps.value || []).map((a: any) => new AzureEntraApp(a.displayName || "Unknown App", a.appId || ""));

    return { users, groups, apps, tenantName };
  } catch (error) {
    console.error("[EntraID] Failed to fetch users/groups:", error);
    // Return error mock to make failures apparent but not crash
    return {
      users: [
        new AzureEntraUser("Auth failed / Check Settings", "error_code@example.com"),
      ],
      groups: [
        new AzureEntraGroup("Auth failed / Check Settings", "error-group-id"),
      ],
      apps: [
        new AzureEntraApp("Auth failed / Check Settings", "error-app-id"),
      ],
      tenantName: null
    };
  }
}


