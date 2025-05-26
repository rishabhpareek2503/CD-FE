import { NextResponse } from "next/server"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Simple version that doesn't rely on firebase-admin
export async function POST(request: Request) {
  try {
    // Log that the API was called
    console.log("Notification test API called")

    // Parse the request body
    let userId: string
    try {
      const body = await request.json()
      userId = body.userId
      console.log("Request body parsed successfully:", { userId })
    } catch (error) {
      console.error("Error parsing request body:", error)
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 400 },
      )
    }

    if (!userId) {
      console.log("Missing userId in request")
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get user's FCM tokens from Firestore
    console.log(`Fetching user document for userId: ${userId}`)
    let userDoc
    try {
      const userRef = doc(db, "users", userId)
      userDoc = await getDoc(userRef)
      console.log("User document fetch result:", { exists: userDoc.exists() })
    } catch (error) {
      console.error("Error fetching user document:", error)
      return NextResponse.json(
        {
          error: "Failed to fetch user data",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }

    if (!userDoc.exists()) {
      console.log(`User not found: ${userId}`)
      return NextResponse.json(
        {
          error: "User not found",
          userId,
        },
        { status: 404 },
      )
    }

    const userData = userDoc.data()
    const fcmTokens = userData.fcmTokens || []
    console.log(`Found ${fcmTokens.length} FCM tokens for user`)

    if (fcmTokens.length === 0) {
      console.log(`No FCM tokens found for user: ${userId}`)
      return NextResponse.json(
        {
          error: "No FCM tokens found for user",
          userId,
        },
        { status: 404 },
      )
    }

    // In this simplified version, we're not actually sending FCM messages
    // since we're not using firebase-admin
    // Instead, we'll just return a success response
    console.log("Returning success response")
    return NextResponse.json({
      success: true,
      message: "This is a simulated success response. In production, FCM messages would be sent.",
      tokens: fcmTokens.length,
      tokenDetails: fcmTokens.map((token: string) => ({
        token: token.substring(0, 10) + "...", // Only show part of the token for security
      })),
    })
  } catch (error) {
    console.error("Unhandled error in test notification API:", error)
    return NextResponse.json(
      {
        error: "Failed to process notification request",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
