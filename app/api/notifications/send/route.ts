import { NextResponse } from "next/server"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Dynamic import to prevent build-time initialization
async function getFirebaseAdmin() {
  try {
    const admin = await import("firebase-admin")

    // Check if already initialized
    if (admin.default.apps.length > 0) {
      return admin.default
    }

    // Check if environment variables are available
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error("Firebase Admin environment variables not configured")
    }

    // Initialize Firebase Admin
    const app = admin.default.initializeApp({
      credential: admin.default.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    })

    return admin.default
  } catch (error) {
    console.error("Firebase Admin initialization error:", error)
    throw error
  }
}

export async function POST(request: Request) {
  try {
    const { userId, title, body, data } = await request.json()

    if (!userId || !title || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Initialize Firebase Admin only when needed
    const admin = await getFirebaseAdmin()

    // Get user's FCM tokens from Firestore
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = userDoc.data()
    const fcmTokens = userData.fcmTokens || []

    if (fcmTokens.length === 0) {
      return NextResponse.json({ error: "No FCM tokens found for user" }, { status: 404 })
    }

    // Create notification message
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        timestamp: Date.now().toString(),
      },
      tokens: fcmTokens,
    }

    // Send the message
    const response = await admin.messaging().sendMulticast(message)

    return NextResponse.json({
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
      tokens: fcmTokens.length,
    })
  } catch (error) {
    console.error("Error sending notification:", error)

    // Return specific error messages
    if (error instanceof Error && error.message.includes("environment variables")) {
      return NextResponse.json(
        {
          error: "Firebase Admin not configured",
          details: "Environment variables missing",
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        error: "Failed to send notification",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
