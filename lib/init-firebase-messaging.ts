// This script initializes the Firebase Cloud Messaging service worker with fallbacks

export const initFirebaseMessaging = () => {
  if (typeof window === "undefined") return

  // Check if we're in a development or preview environment
  const isPreviewEnvironment =
    window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("localhost")

  // Skip service worker registration in preview environments
  if (isPreviewEnvironment) {
    console.log("Service Worker registration skipped in preview environment")
    return
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/firebase-messaging-sw.js")
      .then((registration) => {
        console.log("Service Worker registered with scope:", registration.scope)

        // Pass Firebase config to service worker
        if (registration.active) {
          registration.active.postMessage({
            type: "FIREBASE_CONFIG",
            config: {
              FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
              FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
              FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
              FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
              FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
            },
          })
        }
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error)
        console.log("Falling back to in-app notifications only")
      })
  } else {
    console.log("Service Workers not supported in this browser. Using in-app notifications only.")
  }
}
