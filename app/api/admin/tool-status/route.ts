import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      // Fal.ai doesn't have a dedicated health endpoint, use account endpoint
      const res = await fetch("https://rest.alpha.fal.ai/tokens/current", {
        headers: { Authorization: `Key ${key}` },
      });
      const latency = Date.now() - start;

      if (!res.ok && res.status !== 401) {
        // 401 means API key format issue but service is up
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
      // Anthropic doesn't have a models endpoint, so we do a minimal completion
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

      // Any response means API is reachable
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

// Determine status based on latency
function getStatus(latency: number): "online" | "degraded" {
  if (latency > 5000) return "degraded";
  return "online";
}

// Test a single service
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

// Update service status in database
async function updateServiceStatus(
  serviceName: string,
  displayName: string,
  status: "online" | "offline" | "degraded",
  latency: number | null,
  error: string | null
) {
  const now = new Date();

  // Get existing record to calculate 24h stats
  const existing = await prisma.serviceStatus.findUnique({
    where: { serviceName },
  });

  // Calculate 24h stats
  let checkCount24h = 1;
  let errorCount24h = status === "offline" ? 1 : 0;
  let uptime24h = status === "online" || status === "degraded" ? 100 : 0;

  if (existing) {
    const hoursSinceCheck = (now.getTime() - new Date(existing.lastCheck).getTime()) / (1000 * 60 * 60);

    if (hoursSinceCheck < 24) {
      // Accumulate stats
      checkCount24h = existing.checkCount24h + 1;
      errorCount24h = existing.errorCount24h + (status === "offline" ? 1 : 0);
      // Simple uptime calculation: percentage of non-error checks
      uptime24h = ((checkCount24h - errorCount24h) / checkCount24h) * 100;
    }
    // If more than 24h since last check, reset stats
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

// GET - Fetch all service statuses
export async function GET() {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const services = await prisma.serviceStatus.findMany({
      orderBy: { serviceName: "asc" },
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error("[admin/tool-status] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch service statuses" },
      { status: 500 }
    );
  }
}

// POST - Test service(s)
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, serviceName } = body;

    if (action === "test" && serviceName) {
      // Test single service
      const config = SERVICE_CONFIGS[serviceName as keyof typeof SERVICE_CONFIGS];
      if (!config) {
        return NextResponse.json({ error: "Unknown service" }, { status: 400 });
      }

      const result = await testService(serviceName);
      await updateServiceStatus(
        serviceName,
        config.displayName,
        result.status,
        result.latency,
        result.error
      );

      return NextResponse.json({ success: true, result });
    }

    if (action === "test-all") {
      // Test all services in parallel
      const results: Record<string, { status: string; latency: number | null; error: string | null }> = {};

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
        })
      );

      return NextResponse.json({ success: true, results });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[admin/tool-status] Error:", error);
    return NextResponse.json(
      { error: "Failed to test service" },
      { status: 500 }
    );
  }
}
