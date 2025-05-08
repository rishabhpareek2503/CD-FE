"use client"

import { useEffect, useState } from "react"
import { collection, onSnapshot, query, where, limit } from "firebase/firestore"

import { db } from "@/lib/firebase"

export interface Alert {
  id: string
  deviceId: string
  parameter: string
  value: number
  threshold: number
  type: "high" | "low"
  timestamp: Date
  status: "active" | "acknowledged" | "resolved"
  acknowledgedBy?: string
  acknowledgedAt?: Date
  resolvedBy?: string
  resolvedAt?: Date
}

export function useAlerts(deviceId?: string) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let q

    if (deviceId) {
      q = query(collection(db, "alerts"), where("deviceId", "==", deviceId), limit(50))
    } else {
      q = query(collection(db, "alerts"), limit(50))
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const alertsList: Alert[] = []
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data()
          alertsList.push({
            id: docSnapshot.id,
            ...data,
            timestamp: new Date(data.timestamp),
            acknowledgedAt: data.acknowledgedAt ? new Date(data.acknowledgedAt) : undefined,
            resolvedAt: data.resolvedAt ? new Date(data.resolvedAt) : undefined,
          } as Alert)
        })

        // Sort the alerts manually after fetching
        alertsList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

        setAlerts(alertsList)
        setLoading(false)
      },
      (err) => {
        console.error("Error fetching alerts:", err)
        setError("Failed to fetch alerts")
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [deviceId])

  return {
    alerts,
    loading,
    error,
  }
}
