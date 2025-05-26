import { NextResponse } from "next/server"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import admin from "firebase-admin"

// Initialize Firebase Admin if not already initialized
let firebaseAdmin: typeof admin
if (!admin.apps.length) {
  firebaseAdmin = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  })
} else {
  firebaseAdmin = admin
}

export async function POST(request: Request) {
  try {
    const { userId, title, body, data } = await request.json()

    if (!userId || !title || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

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
    const response = await firebaseAdmin.messaging().sendMulticast(message)

    return NextResponse.json({
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
      tokens: fcmTokens.length,
    })
  } catch (error) {
    console.error("Error sending notification:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}
