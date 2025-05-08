/**
 * Utility functions for checking device status
 */

/**
 * Check if a device is offline based on the last data timestamp
 * @param lastDataTimestamp The timestamp of the last data received
 * @param offlineThresholdMinutes The number of minutes after which a device is considered offline (default: 10)
 * @returns True if the device is offline, false otherwise
 */
export function isDeviceOffline(lastDataTimestamp: Date | null, offlineThresholdMinutes = 10): boolean {
  if (!lastDataTimestamp) return true

  const now = new Date()
  const diffMs = now.getTime() - lastDataTimestamp.getTime()
  const diffMinutes = diffMs / (1000 * 60)

  return diffMinutes > offlineThresholdMinutes
}

/**
 * Format the time since a device went offline
 * @param offlineSince The timestamp when the device went offline
 * @returns A formatted string representing the time since the device went offline
 */
export function formatTimeSinceOffline(offlineSince: Date | null): string {
  if (!offlineSince) return "Unknown"

  const now = new Date()
  const diffMs = now.getTime() - offlineSince.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  } else if (diffMins > 0) {
    return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`
  } else {
    return "Just now"
  }
}

/**
 * Get the last known data timestamp from an array of readings
 * @param readings Array of sensor readings
 * @returns The timestamp of the most recent reading, or null if no readings
 */
export function getLastDataTimestamp(readings: Array<{ timestamp: Date }>): Date | null {
  if (!readings || readings.length === 0) return null

  // Sort readings by timestamp (newest first)
  const sortedReadings = [...readings].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return sortedReadings[0].timestamp
}
