import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    const { userId, email, displayName, photoURL } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: "userId and email are required" },
        { status: 400 }
      );
    }

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // First time user - create new document
      await userRef.set({
        email,
        displayName: displayName || null,
        photoURL: photoURL || null,
        createdAt: FieldValue.serverTimestamp(),
        lastLogin: FieldValue.serverTimestamp(),
        creditsUsed: 0,
        creditsRemaining: 3, // Free tier starts with 3 credits
        subscription: {
          plan: "free",
          status: "active",
        },
      });

      console.log(`Created new user: ${userId} (${email})`);
    } else {
      // Existing user - update lastLogin
      await userRef.update({
        lastLogin: FieldValue.serverTimestamp(),
        displayName: displayName || null,
        photoURL: photoURL || null,
      });

      console.log(`Updated user login: ${userId} (${email})`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error syncing user:", error);
    return NextResponse.json(
      {
        error: "Failed to sync user data",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
