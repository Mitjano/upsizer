import { WebhookPayload } from "@/types/api";

/**
 * Send webhook to client's callback URL
 */
export async function sendWebhook(
  url: string,
  payload: WebhookPayload,
  retries: number = 3
): Promise<boolean> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Pixelift-Webhook/1.0",
          "X-Webhook-Signature": await generateWebhookSignature(payload),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (response.ok) {
        console.log(`✅ Webhook sent successfully to ${url}`);
        return true;
      }

      console.warn(`⚠️  Webhook failed (attempt ${attempt + 1}/${retries}): ${response.status} ${response.statusText}`);

      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        return false;
      }

      // Wait before retry (exponential backoff)
      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    } catch (error) {
      console.error(`❌ Webhook error (attempt ${attempt + 1}/${retries}):`, error);

      // Wait before retry
      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  console.error(`❌ Webhook failed after ${retries} attempts`);
  return false;
}

/**
 * Generate webhook signature for verification
 * Clients can verify webhooks came from Pixelift
 */
async function generateWebhookSignature(payload: WebhookPayload): Promise<string> {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('WEBHOOK_SECRET environment variable is required for webhook signing');
  }
  const data = JSON.stringify(payload);

  // Use Web Crypto API to generate HMAC-SHA256
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(data)
  );

  // Convert to hex string
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Verify webhook signature
 * Clients can use this to verify webhooks
 */
export async function verifyWebhookSignature(
  payload: WebhookPayload,
  signature: string
): Promise<boolean> {
  const expectedSignature = await generateWebhookSignature(payload);
  return signature === expectedSignature;
}
