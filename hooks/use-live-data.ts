"use client"

import { useState, useEffect, useRef } from "react"
import { ref, onValue, off } from "firebase/database"
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

export function useLiveData(deviceId: string) {
  const [liveReading, setLiveReading] = useState<LiveSensorReading | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(30) // 30 seconds refresh
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
    setTimeUntilRefresh(30)
  }

  // Countdown timer effect
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    timerRef.current = setInterval(() => {
      setTimeUntilRefresh((prev) => {
        if (prev <= 1) {
          return 30 // Reset to 30 seconds when it reaches 0
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

  // Set up offline detection - using a more lenient approach
  useEffect(() => {
    if (offlineCheckTimerRef.current) {
      clearInterval(offlineCheckTimerRef.current)
    }

    // Check if sensor is offline every 60 seconds (increased from 30)
    offlineCheckTimerRef.current = setInterval(() => {
      const now = new Date()
      const timeSinceLastData = now.getTime() - lastDataReceivedRef.current.getTime()

      // If no data received in the last 5 minutes (increased from 2), consider sensor offline
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
      console.log(`[${deviceId}] Setting up real-time listener at path:`, `HMI_Sensor_Data/${deviceId}/Live`)

      const unsubscribe = onValue(
        deviceRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            console.log(`[${deviceId}] Real-time data received:`, data)

            // Parse timestamp
            let timestamp: Date
            try {
              timestamp = data.Timestamp ? new Date(data.Timestamp) : new Date()
            } catch (e) {
              console.error(`[${deviceId}] Error parsing timestamp:`, e)
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
              temperature: data.Temperature ? Number.parseFloat(data.Temperature) : undefined,
              DO: data.DO ? Number.parseFloat(data.DO) : undefined,
              conductivity: data.Conductivity ? Number.parseFloat(data.Conductivity) : undefined,
              turbidity: data.Turbidity ? Number.parseFloat(data.Turbidity) : undefined,
              isOffline: false,
            }

            console.log(`[${deviceId}] Processed reading:`, reading)

            setLiveReading(reading)
            setLastUpdated(new Date())
            lastDataReceivedRef.current = new Date()
            setIsOffline(false)
            setOfflineSince(null)
            resetTimer() // Reset the timer when new data arrives
            setError(null)
          } else {
            console.log(`[${deviceId}] No data available for this device`)
            setError(`No data available for device ${deviceId}`)
            // Don't set offline here - let the offline detection timer handle it
          }

          setLoading(false)
        },
        (error) => {
          console.error(`[${deviceId}] Error fetching live data:`, error)
          setError(`Failed to fetch live data for ${deviceId}: ${error.message}`)
          // Don't set offline here - let the offline detection timer handle it
          setLoading(false)
        },
      )

      return () => {
        console.log(`[${deviceId}] Cleaning up listener`)
        unsubscribe()
        off(deviceRef)
      }
    } catch (err: any) {
      console.error(`[${deviceId}] Error setting up live data:`, err)
      setError(`Failed to set up live data connection for ${deviceId}: ${err.message}`)
      setLoading(false)
    }
  }, [deviceId])

  // Force refresh data when timer reaches 0
  useEffect(() => {
    if (timeUntilRefresh <= 0) {
      // This will trigger a re-fetch from the database
      const deviceRef = ref(realtimeDb, `HMI_Sensor_Data/${deviceId}/Live`)
      onValue(
        deviceRef,
        (snapshot) => {
          // This will trigger the main effect again
        },
        { onlyOnce: true },
      )
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
