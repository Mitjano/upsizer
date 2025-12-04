/**
 * Google APIs Integration Library
 * Handles Search Console and Analytics API calls
 */

import { prisma } from "./prisma";

// Types
export interface SearchConsoleQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchConsolePage {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchConsoleResponse {
  rows: Array<{
    keys: string[];
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
}

export interface AnalyticsResponse {
  rows: Array<{
    dimensionValues: Array<{ value: string }>;
    metricValues: Array<{ value: string }>;
  }>;
}

// Get Google credentials from database
async function getGoogleCredentials() {
  const integration = await prisma.googleIntegration.findFirst();
  if (!integration) {
    throw new Error("Google integration not configured");
  }
  return integration;
}

// Get access token (refresh if needed)
async function getAccessToken(): Promise<string> {
  const integration = await getGoogleCredentials();

  // If using service account
  if (integration.serviceAccountKey) {
    return getServiceAccountToken(integration);
  }

  // If using OAuth
  if (integration.accessToken) {
    // Check if token is expired
    if (integration.tokenExpiry && new Date() >= integration.tokenExpiry) {
      return refreshOAuthToken(integration);
    }
    return integration.accessToken;
  }

  throw new Error("No valid credentials found");
}

// Get token using service account
async function getServiceAccountToken(
  integration: Awaited<ReturnType<typeof getGoogleCredentials>>
): Promise<string> {
  if (!integration.serviceAccountKey || !integration.serviceAccountEmail) {
    throw new Error("Service account credentials not configured");
  }

  const jwt = await createJWT(
    integration.serviceAccountEmail,
    integration.serviceAccountKey,
    [
      "https://www.googleapis.com/auth/webmasters.readonly",
      "https://www.googleapis.com/auth/analytics.readonly",
    ]
  );

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Create JWT for service account
async function createJWT(
  email: string,
  privateKey: string,
  scopes: string[]
): Promise<string> {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: email,
    scope: scopes.join(" "),
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Sign with private key
  const signature = await signRS256(signatureInput, privateKey);

  return `${signatureInput}.${signature}`;
}

// Base64url encode
function base64url(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Sign with RS256
async function signRS256(data: string, privateKey: string): Promise<string> {
  const crypto = await import("crypto");
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(data);
  const signature = sign.sign(privateKey, "base64");
  return signature.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Refresh OAuth token
async function refreshOAuthToken(
  integration: Awaited<ReturnType<typeof getGoogleCredentials>>
): Promise<string> {
  if (!integration.refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: integration.refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  const data = await response.json();

  // Update token in database
  await prisma.googleIntegration.update({
    where: { id: integration.id },
    data: {
      accessToken: data.access_token,
      tokenExpiry: new Date(Date.now() + data.expires_in * 1000),
    },
  });

  return data.access_token;
}

// ============================================
// SEARCH CONSOLE API
// ============================================

export async function fetchSearchConsoleData(
  startDate: string,
  endDate: string,
  dimensions: string[] = ["query", "page"],
  rowLimit: number = 1000
): Promise<SearchConsoleResponse> {
  const integration = await getGoogleCredentials();

  if (!integration.searchConsoleEnabled || !integration.searchConsoleSiteUrl) {
    throw new Error("Search Console not configured");
  }

  const accessToken = await getAccessToken();
  const siteUrl = encodeURIComponent(integration.searchConsoleSiteUrl);

  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${siteUrl}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions,
        rowLimit,
        dimensionFilterGroups: [],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Search Console API error: ${error}`);
  }

  return response.json();
}

// Get top queries
export async function getTopQueries(
  days: number = 28,
  limit: number = 100
): Promise<SearchConsoleQuery[]> {
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const data = await fetchSearchConsoleData(startDate, endDate, ["query"], limit);

  return (data.rows || []).map((row) => ({
    query: row.keys[0],
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  }));
}

// Get top pages
export async function getTopPages(
  days: number = 28,
  limit: number = 100
): Promise<SearchConsolePage[]> {
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const data = await fetchSearchConsoleData(startDate, endDate, ["page"], limit);

  return (data.rows || []).map((row) => ({
    page: row.keys[0],
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  }));
}

// Get query performance for specific keyword
export async function getQueryPerformance(
  query: string,
  days: number = 28
): Promise<{
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  history: Array<{ date: string; position: number; clicks: number }>;
}> {
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const integration = await getGoogleCredentials();
  const accessToken = await getAccessToken();
  const siteUrl = encodeURIComponent(integration.searchConsoleSiteUrl || "");

  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${siteUrl}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ["date"],
        dimensionFilterGroups: [
          {
            filters: [
              {
                dimension: "query",
                expression: query,
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch query performance");
  }

  const data = await response.json();
  const rows = data.rows || [];

  // Calculate totals
  const totals = rows.reduce(
    (acc: { clicks: number; impressions: number }, row: { clicks: number; impressions: number }) => ({
      clicks: acc.clicks + row.clicks,
      impressions: acc.impressions + row.impressions,
    }),
    { clicks: 0, impressions: 0 }
  );

  const avgPosition =
    rows.length > 0
      ? rows.reduce((sum: number, row: { position: number }) => sum + row.position, 0) / rows.length
      : 0;

  return {
    clicks: totals.clicks,
    impressions: totals.impressions,
    ctr: totals.impressions > 0 ? totals.clicks / totals.impressions : 0,
    position: avgPosition,
    history: rows.map((row: { keys: string[]; position: number; clicks: number }) => ({
      date: row.keys[0],
      position: row.position,
      clicks: row.clicks,
    })),
  };
}

// Sync Search Console data to database
export async function syncSearchConsoleData(days: number = 28): Promise<number> {
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const data = await fetchSearchConsoleData(
    startDate,
    endDate,
    ["date", "query", "page", "country", "device"],
    5000
  );

  let synced = 0;

  for (const row of data.rows || []) {
    const country = row.keys[3] || "";
    const device = row.keys[4] || "";

    await prisma.searchConsoleData.upsert({
      where: {
        date_query_page_country_device: {
          date: new Date(row.keys[0]),
          query: row.keys[1],
          page: row.keys[2],
          country,
          device,
        },
      },
      update: {
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      },
      create: {
        date: new Date(row.keys[0]),
        query: row.keys[1],
        page: row.keys[2],
        country,
        device,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      },
    });
    synced++;
  }

  return synced;
}

// ============================================
// GOOGLE ANALYTICS API (GA4)
// ============================================

export async function fetchAnalyticsData(
  startDate: string,
  endDate: string,
  dimensions: string[],
  metrics: string[]
): Promise<AnalyticsResponse> {
  const integration = await getGoogleCredentials();

  if (!integration.analyticsEnabled || !integration.analyticsPropertyId) {
    throw new Error("Analytics not configured");
  }

  const accessToken = await getAccessToken();
  const propertyId = integration.analyticsPropertyId;

  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: dimensions.map((name) => ({ name })),
        metrics: metrics.map((name) => ({ name })),
        limit: 10000,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Analytics API error: ${error}`);
  }

  return response.json();
}

// Get organic traffic stats
export async function getOrganicTrafficStats(days: number = 28) {
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const data = await fetchAnalyticsData(
    startDate,
    endDate,
    ["date", "sessionDefaultChannelGroup"],
    ["sessions", "totalUsers", "newUsers", "screenPageViews", "bounceRate", "averageSessionDuration"]
  );

  // Filter for organic search
  const organicRows = (data.rows || []).filter(
    (row) => row.dimensionValues[1]?.value === "Organic Search"
  );

  return organicRows.map((row) => ({
    date: row.dimensionValues[0].value,
    sessions: parseInt(row.metricValues[0].value) || 0,
    users: parseInt(row.metricValues[1].value) || 0,
    newUsers: parseInt(row.metricValues[2].value) || 0,
    pageviews: parseInt(row.metricValues[3].value) || 0,
    bounceRate: parseFloat(row.metricValues[4].value) || 0,
    avgSessionDuration: parseFloat(row.metricValues[5].value) || 0,
  }));
}

// Get top landing pages from organic search
export async function getTopOrganicLandingPages(days: number = 28, limit: number = 50) {
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const integration = await getGoogleCredentials();
  const accessToken = await getAccessToken();
  const propertyId = integration.analyticsPropertyId;

  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "landingPage" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "bounceRate" },
          { name: "averageSessionDuration" },
        ],
        dimensionFilter: {
          filter: {
            fieldName: "sessionDefaultChannelGroup",
            stringFilter: {
              value: "Organic Search",
            },
          },
        },
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch landing pages");
  }

  const data = await response.json();

  return (data.rows || []).map((row: AnalyticsResponse["rows"][0]) => ({
    page: row.dimensionValues[0].value,
    sessions: parseInt(row.metricValues[0].value) || 0,
    users: parseInt(row.metricValues[1].value) || 0,
    bounceRate: parseFloat(row.metricValues[2].value) || 0,
    avgSessionDuration: parseFloat(row.metricValues[3].value) || 0,
  }));
}

// Sync Analytics data to database
export async function syncAnalyticsData(days: number = 28): Promise<number> {
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const data = await fetchAnalyticsData(
    startDate,
    endDate,
    ["date", "sessionDefaultChannelGroup", "sessionMedium", "landingPage", "country", "deviceCategory"],
    ["sessions", "totalUsers", "newUsers", "screenPageViews", "bounceRate", "averageSessionDuration"]
  );

  let synced = 0;

  for (const row of data.rows || []) {
    const source = row.dimensionValues[1]?.value || "";
    const medium = row.dimensionValues[2]?.value || "";
    const landingPage = row.dimensionValues[3]?.value || "";
    const country = row.dimensionValues[4]?.value || "";
    const device = row.dimensionValues[5]?.value || "";

    await prisma.analyticsData.upsert({
      where: {
        date_source_medium_landingPage_country_device: {
          date: new Date(row.dimensionValues[0].value),
          source,
          medium,
          landingPage,
          country,
          device,
        },
      },
      update: {
        sessions: parseInt(row.metricValues[0].value) || 0,
        users: parseInt(row.metricValues[1].value) || 0,
        newUsers: parseInt(row.metricValues[2].value) || 0,
        pageviews: parseInt(row.metricValues[3].value) || 0,
        bounceRate: parseFloat(row.metricValues[4].value) || 0,
        avgSessionDuration: parseFloat(row.metricValues[5].value) || 0,
      },
      create: {
        date: new Date(row.dimensionValues[0].value),
        source,
        medium,
        landingPage,
        country,
        device,
        sessions: parseInt(row.metricValues[0].value) || 0,
        users: parseInt(row.metricValues[1].value) || 0,
        newUsers: parseInt(row.metricValues[2].value) || 0,
        pageviews: parseInt(row.metricValues[3].value) || 0,
        bounceRate: parseFloat(row.metricValues[4].value) || 0,
        avgSessionDuration: parseFloat(row.metricValues[5].value) || 0,
      },
    });
    synced++;
  }

  return synced;
}

// ============================================
// VERIFICATION & SETUP
// ============================================

export async function verifySearchConsoleAccess(): Promise<boolean> {
  try {
    const integration = await getGoogleCredentials();
    const accessToken = await getAccessToken();
    const siteUrl = encodeURIComponent(integration.searchConsoleSiteUrl || "");

    const response = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${siteUrl}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (response.ok) {
      await prisma.googleIntegration.update({
        where: { id: integration.id },
        data: { searchConsoleVerified: true },
      });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function verifyAnalyticsAccess(): Promise<boolean> {
  try {
    const integration = await getGoogleCredentials();
    const accessToken = await getAccessToken();
    const propertyId = integration.analyticsPropertyId;

    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}/metadata`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (response.ok) {
      await prisma.googleIntegration.update({
        where: { id: integration.id },
        data: { analyticsVerified: true },
      });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
