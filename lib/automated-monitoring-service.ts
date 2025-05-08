import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { ref, onValue, off } from "firebase/database"
import { db, realtimeDb } from "@/lib/firebase"
import { diagnoseFaults } from "@/lib/fault-diagnosis-service"
import NotificationService from "@/lib/notification-service"

// Define thresholds for parameters that would trigger alerts
const CRITICAL_THRESHOLDS = {
  pH: { min: 5.5, max: 9.5 }, // More extreme than normal operating thresholds
  temperature: { min: 25, max: 70 },
  tss: { max: 250 },
  cod: { max: 600 },
  bod: { max: 180 },
  hardness: { max: 350 },
}

// Store active monitoring sessions
const activeMonitoringSessions: Record<string, boolean> = {}

/**
 * Start automated monitoring for a specific device
 * @param deviceId The device ID to monitor
 * @param userId The user ID who owns the device
 */
export function startAutomatedMonitoring(deviceId: string, userId: string): void {
  // Prevent duplicate monitoring sessions
  if (activeMonitoringSessions[deviceId]) {
    console.log(`Monitoring already active for device ${deviceId}`)
    return
  }

  console.log(`Starting automated monitoring for device ${deviceId}`)
  activeMonitoringSessions[deviceId] = true

  // Reference to the device data in Realtime Database
  const deviceRef = ref(realtimeDb, `HMI_Sensor_Data/${deviceId}`)

  // Set up real-time listener
  onValue(
    deviceRef,
    async (snapshot) => {
      if (!snapshot.exists()) {
        console.log(`No data available for device ${deviceId}`)
        return
      }

      const data = snapshot.val()
      console.log(`Received data for device ${deviceId}:`, data)

      // Convert to the format expected by diagnoseFaults
      const processParameters = {
        pH: data.PH || 7,
        temperature: data.Temperature || 45,
        tss: data.TSS || 150,
        cod: data.COD || 350,
        bod: data.BOD || 120,
        hardness: data.Hardness || 200,
      }

      // Check for unusual conditions (values outside critical thresholds)
      const unusualConditions = checkForUnusualConditions(processParameters)

      // Run fault diagnosis
      const diagnosisResult = diagnoseFaults(processParameters)

      // Log the results
      await logMonitoringResult(deviceId, userId, processParameters, diagnosisResult, unusualConditions)

      // If there are unusual conditions or critical faults, send notifications
      if (unusualConditions.length > 0 || (diagnosisResult.hasFault && diagnosisResult.severity === "high")) {
        // Get device details
        const deviceDoc = await getDeviceDetails(deviceId)
        const deviceName = deviceDoc?.name || deviceId

        // Create notification message
        const title = unusualConditions.length > 0 ? `URGENT: Unusual Conditions Detected` : `Critical Fault Detected`

        const message =
          unusualConditions.length > 0
            ? `Device ${deviceName} has ${unusualConditions.length} parameters outside safe limits: ${unusualConditions.join(", ")}`
            : `${diagnosisResult.faults.length} critical issue(s) found in device ${deviceName}`

        // Send notifications through all channels
        await sendAutomatedAlerts(deviceId, userId, title, message, "critical")
      }
    },
    (error) => {
      console.error(`Error monitoring device ${deviceId}:`, error)
    },
  )
}

/**
 * Stop automated monitoring for a specific device
 * @param deviceId The device ID to stop monitoring
 */
export function stopAutomatedMonitoring(deviceId: string): void {
  if (!activeMonitoringSessions[deviceId]) {
    console.log(`No active monitoring for device ${deviceId}`)
    return
  }

  console.log(`Stopping automated monitoring for device ${deviceId}`)

  // Remove the listener
  const deviceRef = ref(realtimeDb, `HMI_Sensor_Data/${deviceId}`)
  off(deviceRef)

  // Update the tracking object
  delete activeMonitoringSessions[deviceId]
}

/**
 * Check for unusual conditions in the sensor data
 * @param parameters The sensor parameters to check
 * @returns Array of parameter names that are outside critical thresholds
 */
function checkForUnusualConditions(parameters: Record<string, number>): string[] {
  const unusualConditions: string[] = []

  // Check each parameter against critical thresholds
  Object.entries(parameters).forEach(([param, value]) => {
    const paramKey = param.toLowerCase() as keyof typeof CRITICAL_THRESHOLDS
    const thresholds = CRITICAL_THRESHOLDS[paramKey]

    if (!thresholds) return

    if (thresholds.min !== undefined && value < thresholds.min) {
      unusualConditions.push(`${param} (${value}) below critical minimum`)
    }

    if (thresholds.max !== undefined && value > thresholds.max) {
      unusualConditions.push(`${param} (${value}) above critical maximum`)
    }
  })

  return unusualConditions
}

/**
 * Get device details from Firestore
 * @param deviceId The device ID
 * @returns Device details or null if not found
 */
async function getDeviceDetails(deviceId: string): Promise<any | null> {
  try {
    const devicesRef = collection(db, "devices")
    const q = query(devicesRef, where("id", "==", deviceId))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() }
    }

    return null
  } catch (error) {
    console.error("Error fetching device details:", error)
    return null
  }
}

/**
 * Log monitoring results to Firestore
 */
async function logMonitoringResult(
  deviceId: string,
  userId: string,
  parameters: any,
  diagnosis: any,
  unusualConditions: string[],
): Promise<void> {
  try {
    await addDoc(collection(db, "monitoringLogs"), {
      deviceId,
      userId,
      parameters,
      diagnosis,
      unusualConditions,
      timestamp: serverTimestamp(),
      hasIssues: diagnosis.hasFault || unusualConditions.length > 0,
      severity: diagnosis.hasFault ? diagnosis.severity : unusualConditions.length > 0 ? "critical" : "normal",
    })
  } catch (error) {
    console.error("Error logging monitoring result:", error)
  }
}

/**
 * Send automated alerts through all channels
 */
async function sendAutomatedAlerts(
  deviceId: string,
  userId: string,
  title: string,
  message: string,
  level: "info" | "warning" | "critical",
): Promise<void> {
  try {
    // Get user notification preferences
    const userPreferences = await getUserNotificationPreferences(userId)

    // Create notification
    const notification = {
      title,
      message,
      level: level as any,
      deviceId,
    }

    // Get notification service
    const notificationService = NotificationService.getInstance()

    // Add to in-app notifications
    notificationService.addNotification(notification)

    // Send through all enabled channels
    if (userPreferences.smsEnabled) {
      await notificationService.sendSMSNotification(notification as any)
    }

    if (userPreferences.whatsappEnabled) {
      await notificationService.sendWhatsAppNotification(notification as any)
    }

    if (userPreferences.emailEnabled) {
      await notificationService.sendEmailNotification(notification as any)
    }

    if (userPreferences.pushEnabled) {
      await notificationService.sendPushNotification(notification as any)
    }

    console.log(`Automated alerts sent for device ${deviceId}`)
  } catch (error) {
    console.error("Error sending automated alerts:", error)
  }
}

/**
 * Get user notification preferences
 */
async function getUserNotificationPreferences(userId: string): Promise<{
  pushEnabled: boolean
  emailEnabled: boolean
  smsEnabled: boolean
  whatsappEnabled: boolean
}> {
  try {
    const userRef = collection(db, "users")
    const q = query(userRef, where("id", "==", userId))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data()
      return {
        pushEnabled: userData.notificationPreferences?.pushEnabled ?? true,
        emailEnabled: userData.notificationPreferences?.emailEnabled ?? true,
        smsEnabled: userData.notificationPreferences?.smsEnabled ?? true,
        whatsappEnabled: userData.notificationPreferences?.whatsappEnabled ?? true,
      }
    }

    // Default to all enabled if preferences not found
    return {
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: true,
      whatsappEnabled: true,
    }
  } catch (error) {
    console.error("Error fetching user notification preferences:", error)
    return {
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: true,
      whatsappEnabled: true,
    }
  }
}

// Export a function to start monitoring all devices for a user
export async function startMonitoringAllDevices(userId: string): Promise<void> {
  try {
    const devicesRef = collection(db, "devices")
    const q = query(devicesRef, where("userId", "==", userId))
    const querySnapshot = await getDocs(q)

    querySnapshot.forEach((doc) => {
      const deviceId = doc.id
      startAutomatedMonitoring(deviceId, userId)
    })

    console.log(`Started monitoring all devices for user ${userId}`)
  } catch (error) {
    console.error("Error starting monitoring for all devices:", error)
  }
}

// Export a function to stop monitoring all devices
export function stopAllMonitoring(): void {
  Object.keys(activeMonitoringSessions).forEach((deviceId) => {
    stopAutomatedMonitoring(deviceId)
  })
  console.log("Stopped all monitoring sessions")
}
