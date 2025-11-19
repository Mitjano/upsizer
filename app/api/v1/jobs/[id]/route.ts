import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, extractApiKeyFromHeader, createAuthErrorResponse } from "@/lib/apiAuth";
import { getJobStatus } from "@/lib/queue";
import { nanoid } from "nanoid";

/**
 * GET /api/v1/jobs/:id
 * Get job status and result
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = nanoid(12);
  const { id } = await params;

  try {
    // 1. Authenticate API key
    const authHeader = request.headers.get("authorization");
    const apiKeyString = extractApiKeyFromHeader(authHeader);

    if (!apiKeyString) {
      return createAuthErrorResponse("Missing API key. Provide it in Authorization header.", 401);
    }

    const apiKey = await validateApiKey(apiKeyString);

    if (!apiKey) {
      return createAuthErrorResponse("Invalid or inactive API key.", 401);
    }

    // 2. Get job status
    const jobId = id;
    const job = await getJobStatus(jobId);

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "JOB_NOT_FOUND",
            message: `Job with ID '${jobId}' not found.`,
          },
        },
        { status: 404 }
      );
    }

    // 3. Check if job belongs to this API key's user
    if (job.userId !== apiKey.userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You don't have access to this job.",
          },
        },
        { status: 403 }
      );
    }

    // 4. Build response
    const responseData: any = {
      job_id: job.id,
      status: job.status,
      created_at: job.createdAt,
      started_at: job.startedAt,
      completed_at: job.completedAt,
      processing_time: job.processingTime,
      input: {
        scale: job.input.scale,
        enhance_face: job.input.enhanceFace,
        denoise: job.input.denoise,
        remove_artifacts: job.input.removeArtifacts,
        color_correction: job.input.colorCorrection,
        preset: job.input.preset,
      },
    };

    // Add result if completed
    if (job.status === "completed" && job.result) {
      responseData.result = {
        output_url: job.result.outputUrl,
        original_size: job.result.originalSize,
        output_size: job.result.outputSize,
        file_size: job.result.fileSize,
        processing_time: job.result.processingTime,
      };
    }

    // Add error if failed
    if (job.status === "failed" && job.error) {
      responseData.error = job.error;
    }

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        meta: {
          requestId,
          timestamp: new Date(),
        },
      },
      {
        status: 200,
        headers: {
          "X-Request-Id": requestId,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in /api/v1/jobs/:id:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred.",
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
        meta: {
          requestId,
          timestamp: new Date(),
        },
      },
      { status: 500 }
    );
  }
}
