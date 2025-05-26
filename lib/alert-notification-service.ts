import { ref, onValue, off } from "firebase/database"
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { db, realtimeDb } from "@/lib/firebase"

// Define thresholds for parameters that would trigger alerts
const ALERT_THRESHOLDS = {
  pH: { min: 6.0, max: 9.0 },
  temperature: { min: 30, max: 60 },
  tss: { max: 200 },
  cod: { max: 500 },
  bod: { max: 150 },
  hardness: { max: 300 },
}

// Store active monitoring sessions
const activeAlertSessions: Record<string, boolean> = {}

/**
 * Start real-time alert monitoring for a specific device
 */
export function startAlertMonitoring(deviceId: string): void {
  // Prevent duplicate monitoring sessions
  if (activeAlertSessions[deviceId]) {
    console.log(`Alert monitoring already active for device ${deviceId}`)
    return
  }

  console.log(`Starting alert monitoring for device ${deviceId}`)
  activeAlertSessions[deviceId] = true

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

      // Check for threshold violations
      const violations = checkThresholdViolations(data)

      if (violations.length > 0) {
        // Get device details
        const deviceDetails = await getDeviceDetails(deviceId)
        const deviceName = deviceDetails?.name || deviceId

        // Create alert
        await createAlert({
          deviceId,
          deviceName,
          violations,
          data,
          timestamp: new Date(),
        })

        // Send notifications to users who should be notified
        await sendAlertNotifications({
          deviceId,
          deviceName,
          violations,
        })
      }
    },
    (error) => {
      console.error(`Error monitoring device ${deviceId}:`, error)
    },
  )
}

/**
 * Stop alert monitoring for a specific device
 */
export function stopAlertMonitoring(deviceId: string): void {
  if (!activeAlertSessions[deviceId]) {
    console.log(`No active alert monitoring for device ${deviceId}`)
    return
  }

  console.log(`Stopping alert monitoring for device ${deviceId}`)

  // Remove the listener
  const deviceRef = ref(realtimeDb, `HMI_Sensor_Data/${deviceId}`)
  off(deviceRef)

  // Update the tracking object
  delete activeAlertSessions[deviceId]
}

/**
 * Check for threshold violations in the sensor data
 */
function checkThresholdViolations(data: any): Array<{
  parameter: string
  value: number
  threshold: string
  severity: "warning" | "critical"
}> {
  const violations = []

  // Check each parameter against thresholds
  for (const [param, thresholds] of Object.entries(ALERT_THRESHOLDS)) {
    const paramKey = param.toUpperCase()
    const value = data[paramKey] || data[param]

    if (value === undefined) continue

    // Check minimum threshold
    if (thresholds.min !== undefined && value < thresholds.min) {
      violations.push({
        parameter: param,
        value,
        threshold: `below ${thresholds.min}`,
        severity: value < thresholds.min * 0.9 ? "critical" : "warning",
      })
    }

    // Check maximum threshold
    if (thresholds.max !== undefined && value > thresholds.max) {
      violations.push({
        parameter: param,
        value,
        threshold: `above ${thresholds.max}`,
        severity: value > thresholds.max * 1.1 ? "critical" : "warning",
      })
    }
  }

  return violations
}

/**
 * Get device details from Firestore
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
 * Create an alert in Firestore
 */
async function createAlert(alertData: any): Promise<string | null> {
  try {
    const alertRef = await addDoc(collection(db, "alerts"), {
      ...alertData,
      createdAt: serverTimestamp(),
      status: "new",
    })

    console.log(`Alert created with ID: ${alertRef.id}`)
    return alertRef.id
  } catch (error) {
    console.error("Error creating alert:", error)
    return null
  }
}

/**
 * Send alert notifications to users
 */
async function sendAlertNotifications(alertData: {
  deviceId: string
  deviceName: string
  violations: Array<{
    parameter: string
    value: number
    threshold: string
    severity: "warning" | "critical"
  }>
}): Promise<void> {
  try {
    // Get users who should be notified
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("notificationPreferences.pushEnabled", "==", true))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log("No users to notify")
      return
    }

    // Create notification message
    const criticalViolations = alertData.violations.filter((v) => v.severity === "critical")
    const hasCritical = criticalViolations.length > 0

    const title = hasCritical ? `CRITICAL ALERT: ${alertData.deviceName}` : `Warning: ${alertData.deviceName}`

    const violationText = alertData.violations
      .map((v) => `${v.parameter.toUpperCase()}: ${v.value} (${v.threshold})`)
      .join(", ")

    const body = `${alertData.violations.length} parameter(s) out of range: ${violationText}`

    // Send notification to each user
    for (const doc of querySnapshot.docs) {
      const userData = doc.data()
      const userId = doc.id
      const fcmTokens = userData.fcmTokens || []

      if (fcmTokens.length === 0) continue

      // Call the API to send the notification
      await fetch("/api/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          title,
          body,
          data: {
            deviceId: alertData.deviceId,
            type: "alert",
            severity: hasCritical ? "critical" : "warning",
          },
        }),
      })
    }
  } catch (error) {
    console.error("Error sending alert notifications:", error)
  }
}

/**
 * Start monitoring all devices for alerts
 */
export async function startAllDeviceAlertMonitoring(): Promise<void> {
  try {
    const devicesRef = collection(db, "devices")
    const querySnapshot = await getDocs(devicesRef)

    querySnapshot.forEach((doc) => {
      const deviceData = doc.data()
      const deviceId = deviceData.id || doc.id
      startAlertMonitoring(deviceId)
    })

    console.log(`Started alert monitoring for ${querySnapshot.size} devices`)
  } catch (error) {
    console.error("Error starting alert monitoring for all devices:", error)
  }
}

/**
 * Stop all alert monitoring
 */
export function stopAllAlertMonitoring(): void {
  Object.keys(activeAlertSessions).forEach((deviceId) => {
    stopAlertMonitoring(deviceId)
  })
  console.log("Stopped all alert monitoring sessions")
}
