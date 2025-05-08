import { initializeApp } from "firebase/app"
import { getFirestore, collection, doc, setDoc } from "firebase/firestore"

// Initialize Firebase (use your own config)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// User ID to associate data with
const userId = "current_user" // Using a reliable test ID that your app can recognize from your Firebase Auth

// Generate random number within range
function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min
}

// Generate random date within the last 30 days
function randomDate(days = 30) {
  const date = new Date()
  date.setDate(date.getDate() - Math.floor(Math.random() * days))
  return date
}

// Generate mock companies
async function generateCompanies() {
  const companyId = `company-${userId}`

  await setDoc(doc(db, "companies", companyId), {
    name: "Hitesh Enviro Engineers",
    type: "Wastewater Treatment",
    numberOfIndustries: 5,
    userId: userId,
    location: "Mumbai, India",
    createdAt: new Date().toISOString(), // Changed from Timestamp.fromDate(new Date())
    updatedAt: new Date().toISOString(), // Changed from Timestamp.fromDate(new Date())
  })

  console.log("Company created:", companyId)
  return companyId
}

// Generate mock devices
async function generateDevices(companyId: string) {
  const devices = [
    {
      id: "WW-001",
      name: "Primary Treatment Plant",
      serialNumber: "SN-001-2023",
      location: "North Plant",
      status: "online",
    },
    {
      id: "WW-002",
      name: "Secondary Treatment Plant",
      serialNumber: "SN-002-2023",
      location: "South Plant",
      status: "online",
    },
    {
      id: "WW-003",
      name: "Tertiary Treatment Plant",
      serialNumber: "SN-003-2023",
      location: "East Plant",
      status: "offline",
    },
    {
      id: "WW-004",
      name: "Sludge Processing Unit",
      serialNumber: "SN-004-2023",
      location: "West Plant",
      status: "maintenance",
    },
  ]

  for (const device of devices) {
    await setDoc(doc(db, "devices", device.id), {
      ...device,
      userId: userId,
      companyId: companyId,
      installationDate: new Date(randomDate(365)).toISOString(), // Changed from Timestamp.fromDate()
      lastMaintenance: new Date(randomDate(90)).toISOString(), // Changed from Timestamp.fromDate()
      createdAt: new Date().toISOString(), // Changed from Timestamp.fromDate()
      updatedAt: new Date().toISOString(), // Changed from Timestamp.fromDate()
    })

    console.log("Device created:", device.id)
  }

  return devices.map((d) => d.id)
}

// Generate mock sensor readings
async function generateSensorReadings(deviceIds: string[]) {
  const readingsCollection = collection(db, "sensorReadings")

  for (const deviceId of deviceIds) {
    // Generate current reading
    const currentReading = {
      deviceId,
      timestamp: new Date().toISOString(), // Changed from Timestamp.fromDate()
      pH: randomInRange(6.0, 9.0),
      BOD: randomInRange(5, 40),
      COD: randomInRange(50, 300),
      TSS: randomInRange(5, 40),
      flow: randomInRange(20, 120),
      temperature: randomInRange(10, 40),
      DO: randomInRange(3, 9),
      conductivity: randomInRange(400, 1600),
      turbidity: randomInRange(0.5, 10),
    }

    await setDoc(doc(readingsCollection), currentReading)
    console.log("Current reading created for device:", deviceId)

    // Generate historical readings (last 24 hours, one per hour)
    for (let i = 1; i <= 24; i++) {
      const date = new Date()
      date.setHours(date.getHours() - i)

      const reading = {
        deviceId,
        timestamp: new Date(date).toISOString(), // Changed from Timestamp.fromDate()
        pH: randomInRange(6.0, 9.0),
        BOD: randomInRange(5, 40),
        COD: randomInRange(50, 300),
        TSS: randomInRange(5, 40),
        flow: randomInRange(20, 120),
        temperature: randomInRange(10, 40),
        DO: randomInRange(3, 9),
        conductivity: randomInRange(400, 1600),
        turbidity: randomInRange(0.5, 10),
      }

      await setDoc(doc(readingsCollection), reading)
    }

    console.log("Historical readings created for device:", deviceId)
  }
}

// Generate mock alerts
async function generateAlerts(deviceIds: string[]) {
  const alertsCollection = collection(db, "alerts")

  const alertTypes = [
    { parameter: "pH", threshold: 9.0, type: "high" },
    { parameter: "BOD", threshold: 35, type: "high" },
    { parameter: "TSS", threshold: 5, type: "low" },
    { parameter: "temperature", threshold: 38, type: "high" },
    { parameter: "DO", threshold: 3.5, type: "low" },
  ]

  for (const deviceId of deviceIds) {
    // Generate 1-3 random alerts per device
    const numAlerts = Math.floor(Math.random() * 3) + 1

    for (let i = 0; i < numAlerts; i++) {
      const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)]
      const value =
        alertType.type === "high"
          ? alertType.threshold + randomInRange(0.5, 5)
          : alertType.threshold - randomInRange(0.5, 2)

      const alert = {
        deviceId,
        parameter: alertType.parameter,
        value,
        threshold: alertType.threshold,
        type: alertType.type,
        status: "active",
        timestamp: new Date().toISOString(), // Changed from Timestamp.fromDate()
      }

      await setDoc(doc(alertsCollection), alert)
    }

    console.log(`${numAlerts} alerts created for device:`, deviceId)
  }
}

// Main function to generate all mock data
async function generateMockData() {
  try {
    console.log("Starting mock data generation...")

    // Generate companies
    const companyId = await generateCompanies()

    // Generate devices
    const deviceIds = await generateDevices(companyId)

    // Generate sensor readings
    await generateSensorReadings(deviceIds)

    // Generate alerts
    await generateAlerts(deviceIds)

    console.log("Mock data generation completed successfully!")
  } catch (error) {
    console.error("Error generating mock data:", error)
  }
}

// Run the generator
generateMockData()
