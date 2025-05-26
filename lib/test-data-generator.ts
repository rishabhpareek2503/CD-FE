import { ref, set } from "firebase/database"
import { realtimeDb } from "@/lib/firebase"
import { getDeviceIds } from "@/lib/device-config"

export async function createTestData(deviceId = "RPi001") {
  try {
    const now = new Date()
    const testData = {
      BOD: 19.7,
      COD: 30,
      Flow: 100,
      PH: 7.2,
      TSS: 40,
      Timestamp: now.toISOString(),
    }

    const dataRef = ref(realtimeDb, `HMI_Sensor_Data/${deviceId}/Live`)
    await set(dataRef, testData)
    console.log(`Test data created successfully for ${deviceId}:`, testData)

    return true
  } catch (error) {
    console.error(`Error creating test data for ${deviceId}:`, error)
    return false
  }
}

// Function to create random test data with device-specific variations
export async function createRandomTestData(deviceId = "RPi001") {
  try {
    const now = new Date()

    // Add slight variations based on device ID for realistic simulation
    const deviceVariation = deviceId === "RPi002" ? 1.1 : 1.0

    const testData = {
      BOD: (15 + Math.random() * 10) * deviceVariation, // 15-25 (RPi002 slightly higher)
      COD: (25 + Math.random() * 15) * deviceVariation, // 25-40
      Flow: (80 + Math.random() * 40) * deviceVariation, // 80-120
      PH: 6.8 + Math.random() * 1.2, // 6.8-8.0 (same for both)
      TSS: (30 + Math.random() * 20) * deviceVariation, // 30-50
      Timestamp: now.toISOString(),
    }

    const dataRef = ref(realtimeDb, `HMI_Sensor_Data/${deviceId}/Live`)
    await set(dataRef, testData)
    console.log(`Random test data created successfully for ${deviceId}:`, testData)

    return true
  } catch (error) {
    console.error(`Error creating random test data for ${deviceId}:`, error)
    return false
  }
}

// Function to simulate real-time data updates for multiple devices
export function startDataSimulation(deviceIds: string[] = ["RPi001"], intervalMs = 5000) {
  const intervalIds: NodeJS.Timeout[] = []

  deviceIds.forEach((deviceId) => {
    const intervalId = setInterval(() => {
      createRandomTestData(deviceId)
    }, intervalMs)
    intervalIds.push(intervalId)
  })

  console.log(`Started data simulation for devices: ${deviceIds.join(", ")} with interval ${intervalMs}ms`)

  // Return a function to stop all simulations
  return () => {
    intervalIds.forEach((intervalId) => clearInterval(intervalId))
    console.log(`Stopped data simulation for devices: ${deviceIds.join(", ")}`)
  }
}

// Function to create test data for all available devices
export async function createTestDataForAllDevices() {
  const deviceIds = getDeviceIds()
  const results = await Promise.allSettled(deviceIds.map((deviceId) => createRandomTestData(deviceId)))

  console.log("Test data creation results:", results)
  return results.every((result) => result.status === "fulfilled" && result.value === true)
}

// Expose these functions to the window object for easy access in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  // @ts-ignore
  window.createTestData = createTestData
  // @ts-ignore
  window.createRandomTestData = createRandomTestData
  // @ts-ignore
  window.startDataSimulation = startDataSimulation
  // @ts-ignore
  window.createTestDataForAllDevices = createTestDataForAllDevices
}
