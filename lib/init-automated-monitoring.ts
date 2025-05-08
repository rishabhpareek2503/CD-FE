import { startMonitoringAllDevices } from "./automated-monitoring-service"

// This function should be called when the app initializes
export async function initializeAutomatedMonitoring(userId: string): Promise<void> {
  if (!userId) return

  console.log("Initializing automated monitoring for user:", userId)

  try {
    // Start monitoring all devices for this user
    await startMonitoringAllDevices(userId)

    console.log("Automated monitoring initialized successfully")
  } catch (error) {
    console.error("Error initializing automated monitoring:", error)
  }
}
