/**
 * API Route: AI Chat
 *
 * POST /api/ai-chat - Wyślij wiadomość i otrzymaj odpowiedź (streaming SSE)
 *
 * Request body:
 * - conversationId?: string - ID istniejącej konwersacji (opcjonalne)
 * - model: string - ID modelu OpenRouter
 * - message: string - Treść wiadomości
 * - images?: { base64: string, mimeType: string }[] - Załączone obrazy
 * - temperature?: number - Temperatura (0-2)
 * - systemPrompt?: string - System prompt
 *
 * Response: SSE stream z chunkami odpowiedzi
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createUsage } from '@/lib/db';
import { nanoid } from 'nanoid';
import {
  chatCompletionStream,
  createSSETransformer,
  createUserMessage,
  getModelById,
  isModelFree,
  type ChatMessage,
} from '@/lib/ai-chat';
import { calculateAIChatCost, getAIChatToolType } from '@/lib/credits-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Generuj slug dla konwersacji
 */
function generateSlug(): string {
  return `chat-${nanoid(10)}`;
}

/**
 * Generuj tytuł z pierwszej wiadomości
 */
function generateTitle(message: string): string {
  // Weź pierwsze 50 znaków, utnij na słowie
  const maxLength = 50;
  if (message.length <= maxLength) {
    return message;
  }

  const truncated = message.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 20) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

export async function POST(request: NextRequest) {
  try {
    // Sprawdź autentykację
    const session = await auth();
    if (!session?.user?.email) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parsuj body
    const body = await request.json();
    const {
      conversationId,
      model: modelId,
      message,
      images,
      temperature = 0.7,
      systemPrompt,
    } = body;

    // Walidacja
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!modelId) {
      return new Response(
        JSON.stringify({ error: 'Model is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Sprawdź model
    const model = getModelById(modelId);
    if (!model || !model.isAvailable) {
      return new Response(
        JSON.stringify({ error: 'Model not available' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Sprawdź obrazy dla modeli bez wsparcia
    if (images && images.length > 0 && !model.supportsImages) {
      return new Response(
        JSON.stringify({ error: 'This model does not support images' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Pobierz użytkownika
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, credits: true },
    });

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Sprawdź kredyty (dla płatnych modeli)
    const isFree = isModelFree(modelId);
    if (!isFree && user.credits < 0.1) {
      return new Response(
        JSON.stringify({ error: 'Insufficient credits' }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Pobierz lub utwórz konwersację
    let conversation: { id: string; messages: { role: string; content: string }[] };

    if (conversationId) {
      // Pobierz istniejącą konwersację z ograniczoną historią (ostatnie 20 wiadomości = 10 par user/assistant)
      // To zapobiega eksplozji tokenów przy długich konwersacjach
      const existingConversation = await prisma.chatConversation.findFirst({
        where: {
          id: conversationId,
          userId: user.id,
        },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 20, // Limit do ostatnich 20 wiadomości
            select: { role: true, content: true },
          },
        },
      });

      // Odwróć kolejność - były pobrane od najnowszych, potrzebujemy chronologicznie
      if (existingConversation) {
        existingConversation.messages.reverse();
      }

      if (!existingConversation) {
        return new Response(
          JSON.stringify({ error: 'Conversation not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      conversation = existingConversation;
    } else {
      // Utwórz nową konwersację
      const newConversation = await prisma.chatConversation.create({
        data: {
          userId: user.id,
          slug: generateSlug(),
          title: generateTitle(message),
          model: modelId,
          systemPrompt: systemPrompt || null,
          temperature,
        },
        select: { id: true },
      });

      conversation = { id: newConversation.id, messages: [] };
    }

    // Przygotuj wiadomości dla API
    const chatMessages: ChatMessage[] = conversation.messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    // Dodaj nową wiadomość użytkownika
    const userMessage = createUserMessage(
      message,
      images?.map((img: { base64: string; mimeType: string }) => ({
        base64: img.base64,
        mimeType: img.mimeType,
      }))
    );
    chatMessages.push(userMessage);

    // Zapisz wiadomość użytkownika
    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
        attachments: images ? { images: images.length } : undefined,
      },
    });

    // Wywołaj OpenRouter ze streamingiem
    const { stream } = await chatCompletionStream({
      model: modelId,
      messages: chatMessages,
      temperature,
      systemPrompt,
      stream: true,
    });

    // Transformuj stream
    const transformedStream = stream.pipeThrough(createSSETransformer());

    // Przygotuj ReadableStream który zapisze dane po zakończeniu
    let fullContent = '';
    let usage: { prompt_tokens: number; completion_tokens: number } | null = null;

    const responseStream = new ReadableStream({
      async start(controller) {
        const reader = transformedStream.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            // Przekaż chunk do klienta
            controller.enqueue(value);

            // Parsuj dane dla zapisu
            const text = decoder.decode(value, { stream: true });
            const lines = text.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.type === 'chunk' && data.content) {
                    fullContent += data.content;
                  }

                  if (data.type === 'done') {
                    fullContent = data.content || fullContent;
                    usage = data.usage || null;
                  }
                } catch {
                  // Ignoruj błędy parsowania
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        // Zapisz odpowiedź asystenta
        const inputTokens = usage?.prompt_tokens || 0;
        const outputTokens = usage?.completion_tokens || 0;

        // Oblicz koszt
        const credits = calculateAIChatCost(model.tier, inputTokens, outputTokens);
        const toolType = getAIChatToolType(model.tier);

        // Zapisz wiadomość asystenta
        await prisma.chatMessage.create({
          data: {
            conversationId: conversation.id,
            role: 'assistant',
            content: fullContent,
            model: modelId,
            inputTokens,
            outputTokens,
            creditsUsed: credits,
          },
        });

        // Aktualizuj konwersację
        await prisma.chatConversation.update({
          where: { id: conversation.id },
          data: {
            messageCount: { increment: 2 },
            totalTokens: { increment: inputTokens + outputTokens },
            creditsUsed: { increment: credits },
            lastMessageAt: new Date(),
            model: modelId,
          },
        });

        // Pobierz kredyty (dla płatnych modeli)
        if (!isFree && credits > 0) {
          // Zapisz usage (to automatycznie odejmuje kredyty)
          await createUsage({
            userId: user.id,
            type: toolType,
            creditsUsed: credits,
          });
        }

        // Wyślij finalną informację o kosztach do klienta
        const finalData = {
          type: 'final',
          creditsUsed: credits,
          inputTokens,
          outputTokens,
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalData)}\n\n`));

        controller.close();
      },
    });

    // Zwróć SSE response
    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Conversation-Id': conversation.id,
      },
    });
  } catch (error) {
    console.error('AI Chat error:', error);

    const message = error instanceof Error ? error.message : 'Internal server error';

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
