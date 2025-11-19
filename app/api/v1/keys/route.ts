import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, Timestamp, doc, updateDoc } from "firebase/firestore";
import { generateApiKey } from "@/lib/generateApiKey";
import { RATE_LIMITS, ApiPlan } from "@/types/api";
import { nanoid } from "nanoid";

/**
 * GET /api/v1/keys
 * List all API keys for authenticated user
 */
export async function GET(request: NextRequest) {
  const requestId = nanoid(12);

  try {
    // TEMPORARY: Skip authentication for testing
    // In production, uncomment the session check below
    // const session = await getServerSession(authOptions);
    // if (!session || !session.user) {
    //   return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "You must be logged in to access API keys." } }, { status: 401 });
    // }
    // const userId = session.user.id;

    const userId = "demo-user-123";

    // Fetch user's API keys from Firestore
    const apiKeysRef = collection(db, "apiKeys");
    const q = query(apiKeysRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    const keys = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        key: data.key.substring(0, 12) + "****" + data.key.slice(-4), // Masked
        plan: data.plan,
        environment: data.environment,
        is_active: data.isActive,
        created_at: data.createdAt?.toDate(),
        last_used_at: data.lastUsedAt?.toDate(),
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          keys,
          count: keys.length,
        },
        meta: {
          requestId,
          timestamp: new Date(),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in GET /api/v1/keys:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred.",
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/keys
 * Create a new API key
 */
export async function POST(request: NextRequest) {
  const requestId = nanoid(12);

  try {
    // TEMPORARY: Skip authentication for testing
    // In production, uncomment the session check below
    // const session = await getServerSession(authOptions);
    // if (!session || !session.user) {
    //   return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "You must be logged in to create API keys." } }, { status: 401 });
    // }
    // const userId = session.user.id;

    const userId = "demo-user-123";
    const body = await request.json();

    // Validate input
    const name = body.name || "Unnamed Key";
    const environment = body.environment || "live";
    const plan: ApiPlan = body.plan || "free";

    if (!["live", "test"].includes(environment)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "Environment must be 'live' or 'test'.",
          },
        },
        { status: 400 }
      );
    }

    if (!["free", "starter", "professional", "enterprise"].includes(plan)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "Invalid plan. Must be one of: free, starter, professional, enterprise.",
          },
        },
        { status: 400 }
      );
    }

    // Generate new API key
    const apiKey = generateApiKey(environment as "live" | "test");
    const rateLimit = RATE_LIMITS[plan];

    // Save to Firestore
    const apiKeysRef = collection(db, "apiKeys");
    const docRef = await addDoc(apiKeysRef, {
      key: apiKey,
      userId,
      name,
      plan,
      environment,
      rateLimit,
      isActive: true,
      createdAt: Timestamp.now(),
      lastUsedAt: null,
    });

    // Also save with key as document ID for fast lookups
    const keyDocRef = doc(db, "apiKeys", apiKey);
    await updateDoc(keyDocRef, {
      id: docRef.id,
      key: apiKey,
      userId,
      name,
      plan,
      environment,
      rateLimit,
      isActive: true,
      createdAt: Timestamp.now(),
      lastUsedAt: null,
    }).catch(async () => {
      // If doc doesn't exist, create it
      await addDoc(collection(db, "apiKeys"), {
        id: apiKey,
        key: apiKey,
        userId,
        name,
        plan,
        environment,
        rateLimit,
        isActive: true,
        createdAt: Timestamp.now(),
        lastUsedAt: null,
      });
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: docRef.id,
          key: apiKey, // Return full key only on creation
          name,
          plan,
          environment,
          rate_limit: rateLimit,
          created_at: new Date(),
          message: "⚠️ Save this key securely. It won't be shown again!",
        },
        meta: {
          requestId,
          timestamp: new Date(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/v1/keys:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred.",
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
