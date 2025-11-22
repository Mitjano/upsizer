import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createABTest, updateABTest, deleteABTest, recordABTestEvent, calculateABTestWinner, type ABTest } from '@/lib/db';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, testId, variantId, eventType } = body;

    // Handle calculate winner action
    if (action === 'calculate_winner' && testId) {
      const result = calculateABTestWinner(testId);
      if (!result) {
        return NextResponse.json({ error: 'Cannot calculate winner' }, { status: 400 });
      }

      // Update test with winner
      updateABTest(testId, { winner: result.winner, confidence: result.confidence });

      return NextResponse.json({ success: true, ...result });
    }

    // Handle record event action
    if (action === 'record_event' && testId && variantId && eventType) {
      recordABTestEvent(testId, variantId, eventType);
      return NextResponse.json({ success: true });
    }

    // Handle create test
    const { name, description, type, variants, targetMetric, targetUrl } = body;

    if (!name || !type || !variants || variants.length < 2) {
      return NextResponse.json({ error: 'Missing required fields or insufficient variants' }, { status: 400 });
    }

    // Ensure all variants have required fields and IDs
    const processedVariants = variants.map((v: any) => ({
      id: v.id || nanoid(),
      name: v.name,
      description: v.description || '',
      traffic: v.traffic || 0,
      conversions: 0,
      visitors: 0,
    }));

    const test = createABTest({
      name,
      description: description || '',
      type,
      status: 'draft',
      variants: processedVariants,
      targetMetric: targetMetric || 'conversions',
      targetUrl,
      createdBy: session.user.email || 'Unknown',
    });

    return NextResponse.json({ success: true, test });
  } catch (error) {
    console.error('A/B test creation error:', error);
    return NextResponse.json({ error: 'Failed to create A/B test' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, updates } = body;

    if (!id || !updates) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const test = updateABTest(id, updates);

    if (!test) {
      return NextResponse.json({ error: 'A/B test not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, test });
  } catch (error) {
    console.error('A/B test update error:', error);
    return NextResponse.json({ error: 'Failed to update A/B test' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const success = deleteABTest(id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('A/B test delete error:', error);
    return NextResponse.json({ error: 'Failed to delete A/B test' }, { status: 500 });
  }
}
