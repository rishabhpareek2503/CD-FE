"use client"

import { useState, useEffect } from "react"
import { ref, onValue, get } from "firebase/database"
import { realtimeDb } from "@/lib/firebase"

export interface HistoricalReading {
  id: string
  BOD: number
  COD: number
  Flow: number
  PH: number
  TSS: number
  Timestamp: string
  timestamp: Date
}

// Helper function to safely parse dates
const parseDate = (dateStr: string): Date => {
  try {
    return new Date(dateStr)
  } catch (e) {
    console.error("Error parsing date:", dateStr, e)
    return new Date() // Return current date as fallback
  }
}

export function useRealtimeHistory(deviceId = "RPi001") {
  const [historicalData, setHistoricalData] = useState<HistoricalReading[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)

    const historyRef = ref(realtimeDb, `HMI_Sensor_Data/${deviceId}/History`)

    const unsubscribe = onValue(
      historyRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val()
          const readings: HistoricalReading[] = []

          // Convert the object of timestamps to an array of readings
          Object.keys(data).forEach((timestampKey) => {
            const reading = data[timestampKey]
            if (reading) {
              const timestampStr = reading.Timestamp || timestampKey.replace(/_/g, " ").replace(/-/g, ":")

              readings.push({
                id: timestampKey,
                BOD: typeof reading.BOD === "number" ? reading.BOD : 0,
                COD: typeof reading.COD === "number" ? reading.COD : 0,
                Flow: typeof reading.Flow === "number" ? reading.Flow : 0,
                PH: typeof reading.PH === "number" ? reading.PH : 0,
                TSS: typeof reading.TSS === "number" ? reading.TSS : 0,
                Timestamp: timestampStr,
                timestamp: parseDate(timestampStr),
              })
            }
          })

          // Sort by timestamp (newest first)
          readings.sort((a, b) => {
            return b.timestamp.getTime() - a.timestamp.getTime()
          })

          setHistoricalData(readings)
        } else {
          setHistoricalData([])
        }
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching historical data:", error)
        setError("Failed to fetch historical data")
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [deviceId])

  // Function to get a specific reading by timestamp
  const getReadingByTimestamp = async (timestamp: string) => {
    try {
      const readingRef = ref(realtimeDb, `HMI_Sensor_Data/${deviceId}/History/${timestamp}`)
      const snapshot = await get(readingRef)

      if (snapshot.exists()) {
        const reading = snapshot.val()
        const timestampStr = reading.Timestamp || timestamp.replace(/_/g, " ").replace(/-/g, ":")

        return {
          id: timestamp,
          BOD: typeof reading.BOD === "number" ? reading.BOD : 0,
          COD: typeof reading.COD === "number" ? reading.COD : 0,
          Flow: typeof reading.Flow === "number" ? reading.Flow : 0,
          PH: typeof reading.PH === "number" ? reading.PH : 0,
          TSS: typeof reading.TSS === "number" ? reading.TSS : 0,
          Timestamp: timestampStr,
          timestamp: parseDate(timestampStr),
        }
      }
      return null
    } catch (err) {
      console.error("Error fetching specific reading:", err)
      return null
    }
  }

  return {
    historicalData,
    loading,
    error,
    getReadingByTimestamp,
  }
}
