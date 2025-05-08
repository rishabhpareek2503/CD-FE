"use client"

import { useState, useEffect, useRef } from "react"
import { collection, query, where, limit, onSnapshot, Timestamp, getDocs } from "firebase/firestore"
import { ref, onValue, off } from "firebase/database"
import { db as firestoreDb } from "@/lib/firebase"
import { realtimeDb } from "@/lib/firebase"

export interface LiveSensorReading {
  id: string
  deviceId: string
  timestamp: Date
  pH: number
  BOD: number
  COD: number
  TSS: number
  flow: number
  temperature?: number
  DO?: number
  conductivity?: number
  turbidity?: number
  isOffline?: boolean
  lastOnlineTime?: Date
}

export function useLiveData(deviceId?: string) {
  const [liveReading, setLiveReading] = useState<LiveSensorReading | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(360) // 360 seconds = 6 minutes
  const [isOffline, setIsOffline] = useState(false)
  const [offlineSince, setOfflineSince] = useState<Date | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const lastDataReceivedRef = useRef<Date>(new Date())
  const offlineCheckTimerRef = useRef<NodeJS.Timeout | null>(null)
  const networkStatusRef = useRef<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true)

  // Monitor network status
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleOnline = () => {
      console.log("Network is online")
      networkStatusRef.current = true
      setError(null)
    }

    const handleOffline = () => {
      console.log("Network is offline")
      networkStatusRef.current = false
      setIsOffline(true)
      setError("Network connection lost. Using cached data.")
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Function to reset the countdown timer
  const resetTimer = () => {
    setTimeUntilRefresh(360)
  }

  // Countdown timer effect
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    timerRef.current = setInterval(() => {
      setTimeUntilRefresh((prev) => {
        if (prev <= 1) {
          return 360 // Reset to 6 minutes when it reaches 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // Function to fetch the last known data from Firestore
  const fetchLastKnownData = async (deviceId: string) => {
    try {
      const readingsRef = collection(firestoreDb, "sensorReadings")
      // Remove orderBy to avoid index error
      const q = query(readingsRef, where("deviceId", "==", deviceId), limit(10))

      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        // Sort the documents manually by timestamp
        const sortedDocs = snapshot.docs.sort((a, b) => {
          const timestampA =
            a.data().timestamp instanceof Timestamp
              ? a.data().timestamp.toDate().getTime()
              : new Date(a.data().timestamp).getTime()
          const timestampB =
            b.data().timestamp instanceof Timestamp
              ? b.data().timestamp.toDate().getTime()
              : new Date(b.data().timestamp).getTime()
          return timestampB - timestampA // Descending order
        })

        // Get the most recent document
        const docSnapshot = sortedDocs[0]
        const data = docSnapshot.data()
        console.log("Last known data from Firestore:", data)

        return {
          id: docSnapshot.id,
          deviceId: deviceId,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp),
          pH: data.pH || 0,
          BOD: data.BOD || 0,
          COD: data.COD || 0,
          TSS: data.TSS || 0,
          flow: data.flow || 0,
          temperature: data.temperature || 25,
          DO: data.DO || 6,
          conductivity: data.conductivity || 1000,
          turbidity: data.turbidity || 2,
          isOffline: true,
          lastOnlineTime: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp),
        } as LiveSensorReading
      }

      return null
    } catch (error) {
      console.error("Error fetching last known data:", error)
      return null
    }
  }

  // Set up offline detection
  useEffect(() => {
    if (offlineCheckTimerRef.current) {
      clearInterval(offlineCheckTimerRef.current)
    }

    // Check if sensor is offline every 60 seconds
    offlineCheckTimerRef.current = setInterval(() => {
      const now = new Date()
      const timeSinceLastData = now.getTime() - lastDataReceivedRef.current.getTime()

      // If no data received in the last 5 minutes, consider sensor offline
      if (timeSinceLastData > 5 * 60 * 1000) {
        if (!isOffline) {
          setIsOffline(true)
          setOfflineSince(lastDataReceivedRef.current)
          console.log(`Sensor ${deviceId} appears to be offline since ${lastDataReceivedRef.current.toLocaleString()}`)
        }
      } else {
        // If we received data within the threshold, ensure device is marked as online
        if (isOffline) {
          setIsOffline(false)
          setOfflineSince(null)
          console.log(`Sensor ${deviceId} is back online`)
        }
      }
    }, 60000)

    return () => {
      if (offlineCheckTimerRef.current) {
        clearInterval(offlineCheckTimerRef.current)
      }
    }
  }, [deviceId, isOffline])

  // Fetch live data from Realtime Database
  useEffect(() => {
    if (!deviceId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Reference to the device data in Realtime Database - using the specific path
      const deviceRef = ref(realtimeDb, `HMI_Sensor_Data/${deviceId}/Live`)
      console.log("Setting up listener at path:", `HMI_Sensor_Data/${deviceId}/Live`)

      const unsubscribe = onValue(
        deviceRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            console.log("Realtime DB data received:", data)

            // Parse timestamp
            let timestamp: Date
            try {
              timestamp = data.Timestamp ? new Date(data.Timestamp) : new Date()
            } catch (e) {
              console.error("Error parsing timestamp:", e)
              timestamp = new Date()
            }

            // Create a standardized reading object with the exact field names from your database
            const reading: LiveSensorReading = {
              id: deviceId,
              deviceId: deviceId,
              timestamp: timestamp,
              pH: Number.parseFloat(data.PH || "0"),
              BOD: Number.parseFloat(data.BOD || "0"),
              COD: Number.parseFloat(data.COD || "0"),
              TSS: Number.parseFloat(data.TSS || "0"),
              flow: Number.parseFloat(data.Flow || "0"),
              temperature: Number.parseFloat(data.Temperature || "25"),
              DO: Number.parseFloat(data.DO || "6"),
              conductivity: Number.parseFloat(data.Conductivity || "1000"),
              turbidity: Number.parseFloat(data.Turbidity || "2"),
              isOffline: false,
            }

            console.log("Processed reading:", reading)

            setLiveReading(reading)
            setLastUpdated(new Date())
            lastDataReceivedRef.current = new Date()
            setIsOffline(false)
            setOfflineSince(null)
            resetTimer() // Reset the timer when new data arrives
            setError(null)
          } else {
            console.log("No data available for this device")
            setError("No data available for this device")
            // Try to fetch the last known data
            fetchLastKnownData(deviceId).then((lastData) => {
              if (lastData) {
                setLiveReading(lastData)
                setIsOffline(true)
                setOfflineSince(lastData.lastOnlineTime || new Date())
              }
            })
          }

          setLoading(false)
        },
        async (error) => {
          console.error("Error fetching live data:", error)
          setError("Failed to fetch live data: " + error.message)

          // If there's an error, try to fetch the last known data
          const lastData = await fetchLastKnownData(deviceId)
          if (lastData) {
            setLiveReading(lastData)
            setIsOffline(true)
            setOfflineSince(lastData.lastOnlineTime || new Date())
          }

          setLoading(false)
        },
      )

      // Also set up a Firestore listener as fallback
      const readingsRef = collection(firestoreDb, "sensorReadings")
      // Remove orderBy to avoid index error
      const q = query(readingsRef, where("deviceId", "==", deviceId), limit(10))

      const firestoreUnsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty && !liveReading) {
            // Sort the documents manually by timestamp
            const sortedDocs = snapshot.docs.sort((a, b) => {
              const timestampA =
                a.data().timestamp instanceof Timestamp
                  ? a.data().timestamp.toDate().getTime()
                  : new Date(a.data().timestamp).getTime()
              const timestampB =
                b.data().timestamp instanceof Timestamp
                  ? b.data().timestamp.toDate().getTime()
                  : new Date(b.data().timestamp).getTime()
              return timestampB - timestampA // Descending order
            })

            // Get the most recent document
            const docSnapshot = sortedDocs[0]
            const data = docSnapshot.data()

            setLiveReading({
              id: docSnapshot.id,
              deviceId: deviceId,
              timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp),
              pH: data.pH || 0,
              BOD: data.BOD || 0,
              COD: data.COD || 0,
              TSS: data.TSS || 0,
              flow: data.flow || 0,
              temperature: data.temperature || 25,
              DO: data.DO || 6,
              conductivity: data.conductivity || 1000,
              turbidity: data.turbidity || 2,
              isOffline: true,
              lastOnlineTime: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp),
            })

            setLastUpdated(new Date())
            setIsOffline(true)
            setOfflineSince(data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp))
          }
        },
        (error) => {
          console.error("Firestore fallback error:", error)
          // Don't set the error state here, as we're using this as a fallback
        },
      )

      return () => {
        console.log("Cleaning up listeners")
        unsubscribe()
        firestoreUnsubscribe()
        off(deviceRef)
      }
    } catch (err: any) {
      console.error("Error setting up live data:", err)
      setError("Failed to set up live data connection: " + err.message)
      setLoading(false)
    }
  }, [deviceId, liveReading])

  // Force refresh data when timer reaches 0
  useEffect(() => {
    if (timeUntilRefresh <= 0) {
      // This will trigger a re-fetch from the database
      if (deviceId) {
        const deviceRef = ref(realtimeDb, `HMI_Sensor_Data/${deviceId}/Live`)
        onValue(
          deviceRef,
          (snapshot) => {
            // This will trigger the main effect again
          },
          { onlyOnce: true },
        )
      }
    }
  }, [timeUntilRefresh, deviceId])

  return {
    liveReading,
    lastUpdated,
    timeUntilRefresh,
    loading,
    error,
    isOffline,
    offlineSince,
  }
}
