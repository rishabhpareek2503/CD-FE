"use client"

import { useEffect, useState } from "react"
import { collection, onSnapshot, query, where, limit, orderBy } from "firebase/firestore"

import { db } from "@/lib/firebase"

// Add isOffline property to SensorReading interface
export interface SensorReading {
  id: string
  deviceId: string
  timestamp: Date
  pH: number
  BOD: number
  COD: number
  TSS: number
  flow: number
  temperature: number
  DO: number // Dissolved Oxygen
  conductivity: number
  turbidity: number
  isOffline?: boolean
  lastOnlineTime?: Date
  // Add any other sensor parameters
}

export interface DeviceInfo {
  id: string
  name: string
  serialNumber: string
  location: string
  installationDate: Date
  lastMaintenance: Date
  status: "online" | "offline" | "maintenance"
}

// Update the hook to include isOffline and lastOnlineTime
export function useSensorData(deviceId?: string) {
  const [latestReadings, setLatestReadings] = useState<SensorReading | null>(null)
  const [historicalData, setHistoricalData] = useState<SensorReading[]>([])
  const [devices, setDevices] = useState<DeviceInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)
  const [offlineSince, setOfflineSince] = useState<Date | null>(null)

  // Fetch available devices
  useEffect(() => {
    const devicesRef = collection(db, "devices")

    const unsubscribe = onSnapshot(
      devicesRef,
      (snapshot) => {
        const devicesList: DeviceInfo[] = []
        snapshot.forEach((doc) => {
          const data = doc.data() as Omit<DeviceInfo, "id">
          devicesList.push({
            id: doc.id,
            ...data,
            installationDate: new Date(data.installationDate),
            lastMaintenance: new Date(data.lastMaintenance),
          })
        })
        setDevices(devicesList)
        setLoading(false)
      },
      (err) => {
        console.error("Error fetching devices:", err)
        setError("Failed to fetch devices")
        setLoading(false)
      },
    )

    return unsubscribe
  }, [])

  // Fetch latest readings for a specific device
  useEffect(() => {
    if (!deviceId) return

    const readingsRef = collection(db, "sensorReadings")
    const q = query(readingsRef, where("deviceId", "==", deviceId), orderBy("timestamp", "desc"), limit(1))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const docSnapshot = snapshot.docs[0]
          const data = docSnapshot.data()

          // Check if data is recent (within last 10 minutes)
          const timestamp = new Date(data.timestamp.toDate())
          const now = new Date()
          const isDataRecent = now.getTime() - timestamp.getTime() < 10 * 60 * 1000

          setLatestReadings({
            id: docSnapshot.id,
            ...data,
            timestamp: timestamp,
            isOffline: !isDataRecent,
            lastOnlineTime: timestamp,
          } as SensorReading)

          setIsOffline(!isDataRecent)
          if (!isDataRecent) {
            setOfflineSince(timestamp)
          } else {
            setOfflineSince(null)
          }
        }
        setLoading(false)
      },
      (err) => {
        console.error("Error fetching latest readings:", err)
        setError("Failed to fetch latest readings")
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [deviceId])

  // Fetch historical data for a specific device
  useEffect(() => {
    if (!deviceId) return

    const readingsRef = collection(db, "sensorReadings")
    const q = query(
      readingsRef,
      where("deviceId", "==", deviceId),
      orderBy("timestamp", "desc"),
      limit(100), // Adjust limit as needed
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const readings: SensorReading[] = []
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data()
          readings.push({
            id: docSnapshot.id,
            ...data,
            timestamp: new Date(data.timestamp.toDate()),
          } as SensorReading)
        })

        setHistoricalData(readings)
        setLoading(false)
      },
      (err) => {
        console.error("Error fetching historical data:", err)
        setError("Failed to fetch historical data")
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [deviceId])

  return {
    latestReadings,
    historicalData,
    devices,
    loading,
    error,
    isOffline,
    offlineSince,
  }
}
