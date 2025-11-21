import { NextRequest, NextResponse } from "next/server";
import { adminDb as db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    const { userId, type, scale, enhanceFace, imageUrl } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Add to usage history
    await db.collection("usage_history").add({
      userId,
      type, // "preview" or "full"
      scale,
      enhanceFace,
      imageUrl: imageUrl || null,
      timestamp: FieldValue.serverTimestamp(),
    });

    // Update user's credits if it's a full image (not preview)
    if (type === "full") {
      const userRef = db.collection("users").doc(userId);
      await userRef.update({
        creditsUsed: FieldValue.increment(1),
        creditsRemaining: FieldValue.increment(-1),
      });
    }

    console.log(`Logged usage for user ${userId}: ${type} (${scale}x)`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error logging usage:", error);
    return NextResponse.json(
      {
        error: "Failed to log usage",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
