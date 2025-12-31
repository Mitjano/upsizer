/**
 * AI Agent Session API
 *
 * POST /api/ai-agent/session - Create new session
 * GET /api/ai-agent/session - List user sessions
 * DELETE /api/ai-agent/session?id=xxx - Delete session
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { nanoid } from 'nanoid';
import { getStateManager } from '@/lib/ai-agent';
import type { OrchestratorConfig } from '@/lib/ai-agent';

// Default system prompt for AI Agent
const DEFAULT_SYSTEM_PROMPT = `You are PixeLift AI Agent - an intelligent assistant specialized in image editing and processing.

You have access to various image tools:
- Background removal
- Image upscaling (2x, 4x)
- Image compression and optimization
- Format conversion (PNG, JPG, WebP, AVIF)
- Resize and crop
- Color adjustments and filters
- AI image generation and editing
- Text extraction (OCR)
- Image analysis

When a user asks you to process an image:
1. Analyze their request to understand what they want
2. Choose the appropriate tool(s) to accomplish the task
3. Execute the tools in the correct order
4. Provide a summary of what was done

Always be helpful, concise, and explain what you're doing.
If you need an image to work with but none was provided, ask the user to upload one.`;

/**
 * POST - Create new AI Agent session
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    // Generate unique session ID
    const sessionId = `agent_${nanoid(12)}`;

    // Build config
    const config: OrchestratorConfig = {
      model: body.model || 'anthropic/claude-sonnet-4',
      systemPrompt: body.systemPrompt || DEFAULT_SYSTEM_PROMPT,
      temperature: body.temperature ?? 0.7,
      maxTokens: body.maxTokens ?? 4096,
      maxSteps: body.maxSteps ?? 10,
      availableTools: body.availableTools, // undefined = all tools
    };

    // Get user credits (placeholder - integrate with your credits system)
    const availableCredits = 100; // TODO: Get from user record

    // Create session in state manager
    const stateManager = getStateManager();
    const agentSession = stateManager.createSession({
      sessionId,
      userId: session.user.id,
      status: 'idle',
      config,
      messages: [],
      steps: [],
      totalCreditsUsed: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      session: {
        id: sessionId,
        status: agentSession.status,
        config: {
          model: config.model,
          temperature: config.temperature,
          maxSteps: config.maxSteps,
        },
        availableCredits,
        createdAt: agentSession.createdAt,
      },
    });
  } catch (error) {
    console.error('[ai-agent/session] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

/**
 * GET - List user's AI Agent sessions
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    const stateManager = getStateManager();

    // If specific session requested
    if (sessionId) {
      const agentSession = stateManager.getSession(sessionId);
      if (!agentSession) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      if (agentSession.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      return NextResponse.json({
        session: {
          id: agentSession.sessionId,
          status: agentSession.status,
          steps: agentSession.steps.length,
          creditsUsed: agentSession.totalCreditsUsed,
          images: stateManager.getImages(sessionId),
          createdAt: agentSession.createdAt,
          updatedAt: agentSession.updatedAt,
        },
      });
    }

    // List all sessions for user
    const sessionIds = await stateManager.getUserSessions(session.user.id);
    const sessions = sessionIds
      .map((id) => stateManager.getSession(id))
      .filter((s) => s !== null)
      .map((s) => ({
        id: s!.sessionId,
        status: s!.status,
        steps: s!.steps.length,
        creditsUsed: s!.totalCreditsUsed,
        createdAt: s!.createdAt,
        updatedAt: s!.updatedAt,
      }));

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('[ai-agent/session] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get sessions' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete AI Agent session
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const stateManager = getStateManager();
    const agentSession = stateManager.getSession(sessionId);

    if (!agentSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (agentSession.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await stateManager.deleteSession(sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ai-agent/session] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
