/**
 * AI Agent Chat API
 *
 * POST /api/ai-agent/chat - Send message to agent (streaming)
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createUsage } from '@/lib/db';
import { createOrchestrator, getStateManager } from '@/lib/ai-agent';
import type { AgentEvent } from '@/lib/ai-agent';

/**
 * POST - Send message to AI Agent (streaming response)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { sessionId, message, images } = body;

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Session ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!message && (!images || images.length === 0)) {
      return new Response(JSON.stringify({ error: 'Message or images required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get session from state manager
    const stateManager = getStateManager();
    const agentSession = stateManager.getSession(sessionId);

    if (!agentSession) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (agentSession.userId !== session.user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user credits from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user has enough credits (minimum 0.1 required)
    if (user.credits < 0.1) {
      return new Response(JSON.stringify({ error: 'Insufficient credits' }), {
        status: 402,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const availableCredits = user.credits;

    // Create orchestrator
    const orchestrator = createOrchestrator(
      sessionId,
      session.user.id,
      agentSession.config,
      availableCredits
    );

    // Build user message
    const userMessage = message || '';

    // Images are now passed as base64 data URLs directly
    const imageDataUrls: string[] = images || [];

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Run agent with streaming (pass images as base64)
          const eventGenerator = orchestrator.runStream(userMessage, imageDataUrls.length > 0 ? imageDataUrls : undefined);

          for await (const event of eventGenerator) {
            const sseData = formatSSEEvent(event);
            controller.enqueue(encoder.encode(sseData));
          }

          // Update session state
          const updatedSession = orchestrator.getSession();
          stateManager.updateSession(sessionId, {
            status: updatedSession.status,
            steps: updatedSession.steps,
            totalCreditsUsed: updatedSession.totalCreditsUsed,
            messages: updatedSession.messages,
          });

          // Deduct credits if any were used
          if (updatedSession.totalCreditsUsed > 0) {
            await createUsage({
              userId: session.user.id,
              type: 'ai_agent',
              creditsUsed: updatedSession.totalCreditsUsed,
            });
          }

          controller.close();
        } catch (error) {
          console.error('[ai-agent/chat] Stream error:', error);
          const errorEvent: AgentEvent = {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
          controller.enqueue(encoder.encode(formatSSEEvent(errorEvent)));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[ai-agent/chat] POST error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process message' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Format agent event as SSE
 */
function formatSSEEvent(event: AgentEvent): string {
  const data = JSON.stringify(event);
  return `data: ${data}\n\n`;
}
