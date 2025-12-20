import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Vercel Cron configuration - runs every 5 minutes
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60 seconds for all checks

// Service health check configurations
const SERVICE_CONFIGS = {
  replicate: {
    displayName: "Replicate",
    check: async () => {
      const token = process.env.REPLICATE_API_TOKEN;
      if (!token) throw new Error("REPLICATE_API_TOKEN not configured");

      const start = Date.now();
      const res = await fetch("https://api.replicate.com/v1/models", {
        headers: { Authorization: `Token ${token}` },
      });
      const latency = Date.now() - start;

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return { latency };
    },
  },
  fal: {
    displayName: "Fal.ai",
    check: async () => {
      const key = process.env.FAL_API_KEY;
      if (!key) throw new Error("FAL_API_KEY not configured");

      const start = Date.now();
      const res = await fetch("https://rest.alpha.fal.ai/tokens/current", {
        headers: { Authorization: `Key ${key}` },
      });
      const latency = Date.now() - start;

      if (!res.ok && res.status !== 401) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return { latency };
    },
  },
  openai: {
    displayName: "OpenAI",
    check: async () => {
      const key = process.env.OPENAI_API_KEY;
      if (!key) throw new Error("OPENAI_API_KEY not configured");

      const start = Date.now();
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
      });
      const latency = Date.now() - start;

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return { latency };
    },
  },
  anthropic: {
    displayName: "Anthropic",
    check: async () => {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) throw new Error("ANTHROPIC_API_KEY not configured");

      const start = Date.now();
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }],
        }),
      });
      const latency = Date.now() - start;

      if (!res.ok && res.status >= 500) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return { latency };
    },
  },
  stripe: {
    displayName: "Stripe",
    check: async () => {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) throw new Error("STRIPE_SECRET_KEY not configured");

      const start = Date.now();
      const res = await fetch("https://api.stripe.com/v1/balance", {
        headers: { Authorization: `Bearer ${key}` },
      });
      const latency = Date.now() - start;

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return { latency };
    },
  },
  resend: {
    displayName: "Resend",
    check: async () => {
      const key = process.env.RESEND_API_KEY;
      if (!key) throw new Error("RESEND_API_KEY not configured");

      const start = Date.now();
      const res = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${key}` },
      });
      const latency = Date.now() - start;

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return { latency };
    },
  },
};

function getStatus(latency: number): "online" | "degraded" {
  if (latency > 5000) return "degraded";
  return "online";
}

async function testService(serviceName: string): Promise<{
  status: "online" | "offline" | "degraded";
  latency: number | null;
  error: string | null;
}> {
  const config = SERVICE_CONFIGS[serviceName as keyof typeof SERVICE_CONFIGS];
  if (!config) {
    return { status: "offline", latency: null, error: "Unknown service" };
  }

  try {
    const result = await config.check();
    return {
      status: getStatus(result.latency),
      latency: result.latency,
      error: null,
    };
  } catch (err) {
    return {
      status: "offline",
      latency: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function updateServiceStatus(
  serviceName: string,
  displayName: string,
  status: "online" | "offline" | "degraded",
  latency: number | null,
  error: string | null
) {
  const now = new Date();

  const existing = await prisma.serviceStatus.findUnique({
    where: { serviceName },
  });

  let checkCount24h = 1;
  let errorCount24h = status === "offline" ? 1 : 0;
  let uptime24h = status === "online" || status === "degraded" ? 100 : 0;

  if (existing) {
    const hoursSinceCheck = (now.getTime() - new Date(existing.lastCheck).getTime()) / (1000 * 60 * 60);

    if (hoursSinceCheck < 24) {
      checkCount24h = existing.checkCount24h + 1;
      errorCount24h = existing.errorCount24h + (status === "offline" ? 1 : 0);
      uptime24h = ((checkCount24h - errorCount24h) / checkCount24h) * 100;
    }
  }

  return await prisma.serviceStatus.upsert({
    where: { serviceName },
    update: {
      status,
      latency,
      lastCheck: now,
      lastOnline: status !== "offline" ? now : existing?.lastOnline,
      lastError: error,
      checkCount24h,
      errorCount24h,
      uptime24h,
    },
    create: {
      serviceName,
      displayName,
      status,
      latency,
      lastCheck: now,
      lastOnline: status !== "offline" ? now : null,
      lastError: error,
      checkCount24h,
      errorCount24h,
      uptime24h,
    },
  });
}

async function sendAlertEmail(serviceName: string, displayName: string, error: string) {
  // Only send alert if service was online in last check
  const existing = await prisma.serviceStatus.findUnique({
    where: { serviceName },
  });

  if (existing?.status !== "online") {
    // Already alerted, don't spam
    return;
  }

  // Check if we have Resend configured
  const resendKey = process.env.RESEND_API_KEY;
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()).filter(Boolean);

  if (!resendKey || !adminEmails?.length) {
    console.log(`[health-check] Alert: ${displayName} is offline - ${error}`);
    return;
  }

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Pixelift <alerts@pixelift.app>",
        to: adminEmails,
        subject: `[ALERT] ${displayName} is offline`,
        html: `
          <h2>Service Alert</h2>
          <p><strong>${displayName}</strong> is currently offline.</p>
          <p><strong>Error:</strong> ${error}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p>Please check the <a href="https://pixelift.app/admin/tool-status">Tool Status Dashboard</a> for more details.</p>
        `,
      }),
    });
  } catch (err) {
    console.error("[health-check] Failed to send alert email:", err);
  }
}

// Verify request is from Vercel Cron
function verifyCronRequest(request: NextRequest): boolean {
  // In production, verify the Authorization header
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // If no CRON_SECRET is set, allow in development
  if (!cronSecret) {
    return process.env.NODE_ENV === "development";
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron request
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[health-check] Starting health checks...");

    const results: Record<string, { status: string; latency: number | null; error: string | null }> = {};

    // Test all services in parallel
    await Promise.all(
      Object.entries(SERVICE_CONFIGS).map(async ([name, config]) => {
        const result = await testService(name);
        results[name] = result;

        await updateServiceStatus(
          name,
          config.displayName,
          result.status,
          result.latency,
          result.error
        );

        // Send alert if service went offline
        if (result.status === "offline" && result.error) {
          await sendAlertEmail(name, config.displayName, result.error);
        }
      })
    );

    console.log("[health-check] Health checks completed:", results);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error("[health-check] Error:", error);
    return NextResponse.json(
      { error: "Health check failed" },
      { status: 500 }
    );
  }
}
