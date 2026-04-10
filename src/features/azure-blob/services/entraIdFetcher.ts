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

    // Fetch tenant display name
    try {
      const orgRes = await fetch("https://graph.microsoft.com/v1.0/organization?$select=displayName", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (orgRes.ok) {
        const parsedOrg = await orgRes.json();
        if (parsedOrg.value && parsedOrg.value.length > 0) {
          tenantName = parsedOrg.value[0].displayName;
        }
      } else {
        console.warn(`[EntraID] Failed to fetch organization info: ${orgRes.status}`);
      }
    } catch (e) {
      console.warn("[EntraID] Exception during organization info fetch", e);
    }

    // Fetch up to 10 users for demo
    const usersRes = await fetch("https://graph.microsoft.com/v1.0/users?$top=10&$select=id,displayName,userPrincipalName", {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Fetch up to 10 groups
    const groupsRes = await fetch("https://graph.microsoft.com/v1.0/groups?$top=10&$select=id,displayName", {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Fetch up to 10 apps
    let appsRes;
    try {
      appsRes = await fetch("https://graph.microsoft.com/v1.0/applications?$top=10&$select=id,displayName,appId", {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {
      console.warn("[EntraID] Failed to fetch apps:", e);
    }

    if (!usersRes.ok || !groupsRes.ok) {
        throw new Error(`Graph API returned error: users=${usersRes.status}, groups=${groupsRes.status}`);
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


