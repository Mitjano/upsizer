import { Queue, Worker, Job, QueueEvents } from "bullmq";
import { getRedisClient } from "./redis";
import { UpscaleJob, JobInput, JobResult } from "@/types/api";
import Replicate from "replicate";
import { decrementConcurrentJobs } from "./rate-limit";
import { sendWebhook } from "./webhooks";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Queue name
const QUEUE_NAME = "image-processing";

// Create queue instance
let queue: Queue | null = null;
let worker: Worker | null = null;
let queueEvents: QueueEvents | null = null;

/**
 * Get or create queue instance
 */
export function getQueue(): Queue {
  if (!queue) {
    const connection = getRedisClient();

    queue = new Queue(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 1000,
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
    });

    console.log("✅ Queue initialized");
  }

  return queue;
}

/**
 * Add job to queue
 */
export async function addUpscaleJob(
  jobData: Omit<UpscaleJob, "id" | "status" | "createdAt">
): Promise<string> {
  const queue = getQueue();

  const job = await queue.add(
    "upscale",
    jobData,
    {
      priority: jobData.priority || 10,
      jobId: jobData.userId + "-" + Date.now(),
    }
  );

  return job.id!;
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<UpscaleJob | null> {
  const queue = getQueue();

  try {
    const job = await queue.getJob(jobId);

    if (!job) return null;

    const state = await job.getState();
    const progress = job.progress as any;

    return {
      id: job.id!,
      apiKeyId: job.data.apiKeyId,
      userId: job.data.userId,
      status: mapBullStateToJobStatus(state),
      input: job.data.input,
      result: job.returnvalue,
      error: job.failedReason,
      webhookUrl: job.data.webhookUrl,
      priority: job.opts.priority || 10,
      createdAt: new Date(job.timestamp),
      startedAt: job.processedOn ? new Date(job.processedOn) : undefined,
      completedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
      processingTime: job.finishedOn && job.processedOn
        ? (job.finishedOn - job.processedOn) / 1000
        : undefined,
    };
  } catch (error) {
    console.error("Error getting job status:", error);
    return null;
  }
}

/**
 * Map BullMQ state to our JobStatus
 */
function mapBullStateToJobStatus(state: string): "pending" | "processing" | "completed" | "failed" {
  switch (state) {
    case "waiting":
    case "delayed":
      return "pending";
    case "active":
      return "processing";
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    default:
      return "pending";
  }
}

/**
 * Start worker to process jobs
 */
export function startWorker() {
  if (worker) {
    console.log("⚠️  Worker already running");
    return;
  }

  const connection = getRedisClient();

  worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      console.log(`🔄 Processing job ${job.id}`);

      try {
        const { input, webhookUrl } = job.data as UpscaleJob;

        // Send webhook: job.processing
        if (webhookUrl) {
          await sendWebhook(webhookUrl, {
            event: "job.processing",
            jobId: job.id!,
            status: "processing",
            timestamp: new Date(),
          });
        }

        // Process image with Replicate
        let output;
        let imageData: string;

        if (input.imageUrl) {
          // Fetch image from URL
          const response = await fetch(input.imageUrl);
          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          const mimeType = response.headers.get("content-type") || "image/jpeg";
          imageData = `data:${mimeType};base64,${base64}`;
        } else if (input.imageData) {
          imageData = input.imageData;
        } else {
          throw new Error("No image provided");
        }

        // Get original dimensions
        const img = await getImageDimensions(imageData);
        const originalSize = { width: img.width, height: img.height };

        const startTime = Date.now();

        if (input.enhanceFace) {
          // Use GFPGAN
          output = await replicate.run(
            "tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3",
            {
              input: {
                img: imageData,
                scale: input.scale,
                version: "v1.4",
              },
            }
          );
        } else {
          // Use Real-ESRGAN
          const realesrganInput: any = {
            image: imageData,
            scale: input.scale,
            face_enhance: false,
          };

          if (input.denoise || input.removeArtifacts) {
            realesrganInput.noise_reduction = input.denoise ? 0.7 : 0.5;
          }

          output = await replicate.run(
            "nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa",
            {
              input: realesrganInput,
            }
          );
        }

        const processingTime = (Date.now() - startTime) / 1000;

        const resultUrl = Array.isArray(output) ? output[0] : output;

        // Get output dimensions
        const outputImg = await getImageDimensions(resultUrl);
        const outputSize = { width: outputImg.width, height: outputImg.height };

        // Get file size
        const sizeResponse = await fetch(resultUrl, { method: "HEAD" });
        const fileSize = parseInt(sizeResponse.headers.get("content-length") || "0");

        const result: JobResult = {
          outputUrl: resultUrl,
          originalSize,
          outputSize,
          fileSize,
          processingTime,
        };

        console.log(`✅ Job ${job.id} completed in ${processingTime}s`);

        // Send webhook: job.completed
        if (webhookUrl) {
          await sendWebhook(webhookUrl, {
            event: "job.completed",
            jobId: job.id!,
            status: "completed",
            result,
            timestamp: new Date(),
          });
        }

        // Decrement concurrent jobs counter
        await decrementConcurrentJobs(job.data.apiKeyId);

        return result;
      } catch (error: any) {
        console.error(`❌ Job ${job.id} failed:`, error);

        // Send webhook: job.failed
        if (job.data.webhookUrl) {
          await sendWebhook(job.data.webhookUrl, {
            event: "job.failed",
            jobId: job.id!,
            status: "failed",
            error: error.message,
            timestamp: new Date(),
          });
        }

        // Decrement concurrent jobs counter
        await decrementConcurrentJobs(job.data.apiKeyId);

        throw error;
      }
    },
    {
      connection,
      concurrency: 5, // Process up to 5 jobs simultaneously
      limiter: {
        max: 10, // Max 10 jobs
        duration: 1000, // per second
      },
    }
  );

  worker.on("completed", (job) => {
    console.log(`✅ Worker completed job ${job.id}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`❌ Worker failed job ${job?.id}:`, err);
  });

  console.log("🚀 Worker started");
}

/**
 * Stop worker
 */
export async function stopWorker() {
  if (worker) {
    await worker.close();
    worker = null;
    console.log("🛑 Worker stopped");
  }
}

/**
 * Helper: Get image dimensions from URL or data URI
 */
async function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  // This is a simplified version. In production, you might want to use sharp or similar
  // For now, we'll make a HEAD request if it's a URL
  if (src.startsWith("http")) {
    // For external URLs, we can't easily get dimensions without downloading
    // Return placeholder
    return { width: 0, height: 0 };
  }

  // For data URIs, we'd need to decode and use an image library
  return { width: 0, height: 0 };
}
