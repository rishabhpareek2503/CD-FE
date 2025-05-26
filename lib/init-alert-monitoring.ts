import { startAllDeviceAlertMonitoring, stopAllAlertMonitoring } from "@/lib/alert-notification-service"

let isInitialized = false

export function initAlertMonitoring() {
  if (typeof window === "undefined" || isInitialized) {
    return
  }

  console.log("Initializing alert monitoring")
  isInitialized = true

  // Start monitoring all devices
  startAllDeviceAlertMonitoring()

  // Clean up on page unload
  window.addEventListener("beforeunload", () => {
    stopAllAlertMonitoring()
  })
}
