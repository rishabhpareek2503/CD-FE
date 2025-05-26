import { NextResponse } from "next/server"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function POST(request: Request) {
  try {
    console.log("Test notification API called")

    const { userId } = await request.json()
    console.log("User ID received:", userId)

    if (!userId) {
      console.log("No user ID provided")
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Check if user document exists
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)
    console.log("User document exists:", userDoc.exists())

    if (!userDoc.exists()) {
      console.log("Creating test user document")
      // Create a test user document
      await setDoc(userRef, {
        fcmTokens: ["test-fcm-token-for-debugging"],
        notificationPreferences: {
          pushEnabled: true,
          emailEnabled: true,
          smsEnabled: false,
          whatsappEnabled: false,
        },
        createdAt: new Date().toISOString(),
        testUser: true,
      })
      console.log("Test user document created")
    }

    const userData = userDoc.exists()
      ? userDoc.data()
      : {
          fcmTokens: ["test-fcm-token-for-debugging"],
          testUser: true,
        }

    console.log("User data:", userData)

    // Simulate successful notification without actually sending
    return NextResponse.json({
      success: true,
      message: "Test notification simulated successfully",
      userId,
      fcmTokens: userData.fcmTokens?.length || 0,
      timestamp: new Date().toISOString(),
      note: "This is a test endpoint - no actual notification was sent",
    })
  } catch (error) {
    console.error("Test notification error:", error)
    return NextResponse.json(
      {
        error: "Test notification failed",
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
