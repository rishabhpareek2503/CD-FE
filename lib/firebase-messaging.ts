import { getMessaging, getToken, onMessage } from "firebase/messaging"
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore"
import { db, app } from "@/lib/firebase"

let messaging: any = null
let isMessagingSupported = false

// Initialize Firebase Messaging if we're in the browser
if (typeof window !== "undefined") {
  try {
    // Check if service workers are supported
    if ("serviceWorker" in navigator) {
      messaging = getMessaging(app)
      isMessagingSupported = true
      console.log("Firebase Messaging initialized successfully")
    } else {
      console.log("Service workers not supported in this browser")
    }
  } catch (error) {
    console.error("Error initializing Firebase Messaging:", error)
  }
}

// Request permission and get FCM token
export const requestNotificationPermission = async (userId: string): Promise<string | null> => {
  if (!isMessagingSupported) {
    console.log("Firebase Messaging not supported in this environment")
    // Still store user preference for notifications
    await updateUserNotificationPreferences(userId, true)
    return null
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission()
    if (permission !== "granted") {
      console.log("Notification permission denied")
      return null
    }

    // Get FCM token using the VAPID key from environment variable
    // Use NEXT_PUBLIC_ prefixed environment variable for client-side access
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || ""

    console.log("VAPID key available:", !!vapidKey)

    if (!vapidKey) {
      console.error("NEXT_PUBLIC_FIREBASE_VAPID_KEY environment variable is not set")
      return null
    }

    // Get FCM token
    const currentToken = await getToken(messaging, {
      vapidKey: vapidKey,
    })

    if (currentToken) {
      console.log("FCM Token obtained:", currentToken)

      // Store the token in Firestore
      await storeUserFCMToken(userId, currentToken)
      return currentToken
    } else {
      console.log("No registration token available")
      return null
    }
  } catch (error) {
    console.error("Error getting FCM token:", error)
    return null
  }
}

// Store the FCM token in Firestore
export const storeUserFCMToken = async (userId: string, token: string): Promise<void> => {
  try {
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      // Update existing user document
      await updateDoc(userRef, {
        fcmTokens: userDoc.data().fcmTokens
          ? [...new Set([...userDoc.data().fcmTokens, token])] // Ensure unique tokens
          : [token],
        notificationPreferences: userDoc.data().notificationPreferences || {
          pushEnabled: true,
          emailEnabled: true,
          smsEnabled: false,
          whatsappEnabled: false,
        },
      })
    } else {
      // Create new user document
      await setDoc(userRef, {
        fcmTokens: [token],
        notificationPreferences: {
          pushEnabled: true,
          emailEnabled: true,
          smsEnabled: false,
          whatsappEnabled: false,
        },
      })
    }
    console.log(`FCM token stored for user ${userId}`)
  } catch (error) {
    console.error("Error storing FCM token:", error)
  }
}

// Update user notification preferences without FCM token
export const updateUserNotificationPreferences = async (userId: string, pushEnabled: boolean): Promise<void> => {
  try {
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      // Update existing user document
      await updateDoc(userRef, {
        notificationPreferences: {
          ...(userDoc.data().notificationPreferences || {}),
          pushEnabled,
        },
      })
    } else {
      // Create new user document
      await setDoc(userRef, {
        notificationPreferences: {
          pushEnabled,
          emailEnabled: true,
          smsEnabled: false,
          whatsappEnabled: false,
        },
      })
    }
    console.log(`Notification preferences updated for user ${userId}`)
  } catch (error) {
    console.error("Error updating notification preferences:", error)
  }
}

// Listen for FCM messages in foreground
export const onFCMMessage = (callback: (payload: any) => void): (() => void) => {
  if (!isMessagingSupported) {
    console.log("FCM message listening not supported in this environment")
    return () => {}
  }

  const unsubscribe = onMessage(messaging, (payload) => {
    console.log("Foreground message received:", payload)
    callback(payload)
  })

  return unsubscribe
}

// Test sending a notification (for development purposes)
export const sendTestNotification = async (userId: string): Promise<boolean> => {
  try {
    console.log("Sending test notification for user:", userId)

    // First, test if the API is reachable at all
    try {
      const testResponse = await fetch("/api/test", {
        method: "GET",
      })

      console.log("Test API response status:", testResponse.status)
      const testData = await testResponse.text()
      console.log("Test API response:", testData)

      // Try to parse as JSON to verify it's returning JSON
      try {
        JSON.parse(testData)
        console.log("Test API is returning valid JSON")
      } catch (e) {
        console.error("Test API is not returning valid JSON:", e)
      }
    } catch (testError) {
      console.error("Error testing API connectivity:", testError)
    }

    // Now try the actual notification API
    console.log("Calling notification test API with userId:", userId)
    const response = await fetch("/api/notifications/test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    })

    // Log the raw response for debugging
    console.log("Test notification API response status:", response.status)

    // Get the response body as text first for debugging
    const responseText = await response.text()
    console.log("Test notification API response body:", responseText)

    // If the response is empty or not JSON, throw an error
    if (!responseText.trim()) {
      throw new Error("Empty response from notification API")
    }

    // Parse the response as JSON if possible
    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error("Failed to parse response as JSON:", e)

      // Check if it's an HTML response (likely an error page)
      if (responseText.includes("<!DOCTYPE") || responseText.includes("<html")) {
        throw new Error(
          "API returned an HTML error page instead of JSON. The API route may not exist or is throwing an error.",
        )
      }

      throw new Error("Invalid response format from notification API")
    }

    if (!response.ok) {
      console.error("Error response from notification API:", data)

      // Extract a meaningful error message
      const errorMessage = data.error || data.message || "Unknown error"
      const errorDetails = data.details || ""

      throw new Error(`API Error: ${errorMessage}${errorDetails ? ` - ${errorDetails}` : ""}`)
    }

    console.log("Test notification sent successfully:", data)
    return true
  } catch (error) {
    console.error("Error sending test notification:", error)
    // Re-throw the error so it can be caught by the component
    throw error
  }
}

// Fallback for testing notifications when the API is not available
export const sendLocalTestNotification = async (): Promise<boolean> => {
  try {
    if (Notification.permission !== "granted") {
      throw new Error("Notification permission not granted")
    }

    // Display a local notification
    new Notification("Test Notification", {
      body: "This is a local test notification (API fallback)",
      icon: "/images/heepl-logo.png",
    })

    return true
  } catch (error) {
    console.error("Error sending local test notification:", error)
    throw error
  }
}

// Create a test user document with FCM token if it doesn't exist
export const createTestUserIfNeeded = async (userId: string): Promise<void> => {
  try {
    console.log("Checking if test user exists:", userId)
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      console.log("Creating test user document")
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
      console.log("Test user created successfully")
    } else {
      console.log("Test user already exists")
    }
  } catch (error) {
    console.error("Error creating test user:", error)
  }
}
