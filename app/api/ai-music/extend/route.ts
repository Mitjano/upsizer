import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { extendMusicSuno, checkSunoStatus } from '@/lib/ai-music/suno-provider';

const CREDIT_COST = 10; // Same cost as generation

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        credits: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      trackId,       // ID of the track to extend
      continueAt,    // Timestamp in seconds to continue from
      prompt,        // Optional continuation lyrics
      style,         // Optional style override
      title,         // Optional title for extended track
    } = body;

    // Validate inputs
    if (!trackId || typeof trackId !== 'string') {
      return NextResponse.json(
        { error: 'Track ID is required' },
        { status: 400 }
      );
    }

    if (typeof continueAt !== 'number' || continueAt < 30) {
      return NextResponse.json(
        { error: 'Continue timestamp must be at least 30 seconds' },
        { status: 400 }
      );
    }

    // Get source track
    const sourceTrack = await prisma.generatedMusic.findUnique({
      where: { id: trackId },
    });

    if (!sourceTrack) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (sourceTrack.userId !== user.id) {
      return NextResponse.json(
        { error: 'You can only extend your own tracks' },
        { status: 403 }
      );
    }

    // Check if track is completed
    if (sourceTrack.status !== 'completed') {
      return NextResponse.json(
        { error: 'Can only extend completed tracks' },
        { status: 400 }
      );
    }

    // Validate continue point
    const trackDuration = sourceTrack.actualDuration || sourceTrack.duration;
    if (continueAt >= trackDuration - 10) {
      return NextResponse.json(
        { error: 'Continue point must be at least 10 seconds before track end' },
        { status: 400 }
      );
    }

    // Check credits
    if (user.credits < CREDIT_COST) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: CREDIT_COST,
          available: user.credits,
        },
        { status: 402 }
      );
    }

    // Get clip ID - we need the Suno clip ID from the original generation
    // For now, we'll use jobId as it may contain the clip ID
    const clipId = sourceTrack.jobId;

    if (!clipId) {
      return NextResponse.json(
        { error: 'Cannot extend this track - missing clip ID. This track may have been generated with a different provider.' },
        { status: 400 }
      );
    }

    // Reserve credits
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: CREDIT_COST } },
    });

    // Calculate extension number
    const existingExtensions = await prisma.generatedMusic.count({
      where: {
        OR: [
          { id: trackId },
          // Note: parentTrackId field needs to be added via migration
        ],
      },
    });

    // Create new music record for the extension
    const extensionRecord = await prisma.generatedMusic.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        userName: user.name || undefined,
        prompt: prompt || sourceTrack.prompt,
        style: style || sourceTrack.style,
        mood: sourceTrack.mood,
        model: sourceTrack.model,
        provider: 'suno', // Extensions require Suno
        duration: sourceTrack.duration, // Same expected duration
        instrumental: sourceTrack.instrumental,
        title: title || `${sourceTrack.title || 'Track'} (Extended)`,
        folderId: sourceTrack.folderId,
        creditsReserved: CREDIT_COST,
        status: 'pending',
        isPublic: sourceTrack.isPublic,
        // Extension tracking fields (will work once migration is applied)
        // parentTrackId: trackId,
        // extendedFromTime: continueAt,
        // extensionNumber: existingExtensions + 1,
        // isExtension: true,
      },
    });

    // Call Suno extend API
    const result = await extendMusicSuno({
      clipId,
      continueAt,
      prompt: prompt || undefined,
      style: style || sourceTrack.style || undefined,
      title: title || undefined,
    });

    if (!result.success) {
      // Refund credits on failure
      await prisma.user.update({
        where: { id: user.id },
        data: { credits: { increment: CREDIT_COST } },
      });

      // Update record status
      await prisma.generatedMusic.update({
        where: { id: extensionRecord.id },
        data: {
          status: 'failed',
          errorMessage: result.error,
        },
      });

      return NextResponse.json(
        { error: result.error || 'Extension failed' },
        { status: 500 }
      );
    }

    // Update record with job ID
    await prisma.generatedMusic.update({
      where: { id: extensionRecord.id },
      data: {
        jobId: result.taskId,
        status: 'processing',
      },
    });

    return NextResponse.json({
      success: true,
      musicId: extensionRecord.id,
      jobId: result.taskId,
      status: 'processing',
      estimatedTime: result.estimatedTime,
      creditsUsed: CREDIT_COST,
      sourceTrackId: trackId,
      continueAt,
    });
  } catch (error) {
    console.error('Music extension error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
