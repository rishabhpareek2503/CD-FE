import { getMessaging, getToken, onMessage } from "firebase/messaging"
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"

// Your Firebase configuration is already set up in firebase.ts
// We'll use the existing Firebase app instance

let messaging: any = null
let isMessagingSupported = false

// Initialize Firebase Messaging if we're in the browser
if (typeof window !== "undefined") {
  try {
    // Check if we're in a preview environment
    const isPreviewEnvironment =
      window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("localhost")

    if (!isPreviewEnvironment) {
      const { app } = require("@/lib/firebase")
      messaging = getMessaging(app)
      isMessagingSupported = true
    } else {
      console.log("Firebase Messaging skipped in preview environment")
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

    // Get FCM token
    const currentToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    })

    if (currentToken) {
      console.log("FCM Token:", currentToken)

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
  } catch (error) {
    console.error("Error updating notification preferences:", error)
  }
}

// Listen for FCM messages
export const onFCMMessage = (callback: (payload: any) => void): (() => void) => {
  if (!isMessagingSupported) {
    console.log("FCM message listening not supported in this environment")
    return () => {}
  }

  const unsubscribe = onMessage(messaging, (payload) => {
    console.log("Message received:", payload)
    callback(payload)
  })

  return unsubscribe
}
