"use client"

import { useState, useEffect } from "react"
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
  type Timestamp,
  type DocumentData,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface Alert {
  id: string
  deviceId: string
  deviceName: string
  title: string
  message: string
  level: "info" | "warning" | "critical"
  parameters: Record<string, number>
  conditions: string[]
  timestamp: Timestamp
  acknowledged: boolean
  acknowledgedAt?: Timestamp
}

export function useAlerts(deviceId?: string, limitCount = 10) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)

    let alertsQuery

    if (deviceId) {
      alertsQuery = query(
        collection(db, "alerts"),
        where("deviceId", "==", deviceId),
        orderBy("timestamp", "desc"),
        limit(limitCount),
      )
    } else {
      alertsQuery = query(collection(db, "alerts"), orderBy("timestamp", "desc"), limit(limitCount))
    }

    const unsubscribe = onSnapshot(
      alertsQuery,
      (snapshot) => {
        const alertsList: Alert[] = []
        snapshot.forEach((doc) => {
          const data = doc.data() as DocumentData
          alertsList.push({
            id: doc.id,
            deviceId: data.deviceId,
            deviceName: data.deviceName || data.deviceId,
            title: data.title,
            message: data.message,
            level: data.level,
            parameters: data.parameters || {},
            conditions: data.conditions || [],
            timestamp: data.timestamp,
            acknowledged: data.acknowledged || false,
            acknowledgedAt: data.acknowledgedAt,
          })
        })

        setAlerts(alertsList)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error("Error fetching alerts:", err)
        setError(`Failed to fetch alerts: ${err.message}`)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [deviceId, limitCount])

  return { alerts, loading, error }
}
