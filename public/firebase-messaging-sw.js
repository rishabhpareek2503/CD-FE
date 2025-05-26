// This is the service worker file for Firebase Cloud Messaging

importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js")

// Initialize the Firebase app in the service worker
const firebaseConfig = {
  // These values will be replaced at runtime with actual values
  apiKey: self.FIREBASE_API_KEY,
  authDomain: self.FIREBASE_AUTH_DOMAIN,
  projectId: self.FIREBASE_PROJECT_ID,
  storageBucket: self.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID,
  appId: self.FIREBASE_APP_ID,
}

// Initialize Firebase
const firebaseApp = firebase.initializeApp(firebaseConfig)

// Retrieve an instance of Firebase Messaging
const messaging = firebaseApp.messaging()

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message:", payload)

  // Extract notification data
  const notificationTitle = payload.notification?.title || "New Alert"
  const notificationOptions = {
    body: payload.notification?.body || "You have a new wastewater alert",
    icon: "/images/heepl-logo.png",
    badge: "/images/badge-icon.png",
    tag: payload.data?.tag || "default",
    data: payload.data,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: "view",
        title: "View Alert",
      },
    ],
  }

  // Show the notification
  self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  console.log("[firebase-messaging-sw.js] Notification clicked:", event)

  // Close the notification
  event.notification.close()

  // Handle action clicks
  if (event.action === "view") {
    // Navigate to specific alert page if we have an ID
    const alertId = event.notification.data?.alertId
    const url = alertId ? `/dashboard/alerts/${alertId}` : "/dashboard/alerts"

    event.waitUntil(clients.openWindow(url))
    return
  }

  // Default click behavior - try to focus existing window or open new one
  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // If we have a matching client, focus it
        for (const client of clientList) {
          if (client.url.includes("/dashboard") && "focus" in client) {
            return client.focus()
          }
        }
        // If no matching client, open a new window
        if (clients.openWindow) {
          return clients.openWindow("/dashboard/alerts")
        }
      }),
  )
})

// Handle service worker installation
self.addEventListener("install", (event) => {
  console.log("[firebase-messaging-sw.js] Service worker installed")
  self.skipWaiting() // Ensure the service worker activates immediately
})

// Handle service worker activation
self.addEventListener("activate", (event) => {
  console.log("[firebase-messaging-sw.js] Service worker activated")
  event.waitUntil(clients.claim()) // Take control of all clients
})
