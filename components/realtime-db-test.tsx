"use client"

import { useEffect, useState } from "react"
import { ref, onValue } from "firebase/database"
import { realtimeDb } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function RealtimeDbTest() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Try to access the root of HMI_Sensor_Data to see what's available
    const dataRef = ref(realtimeDb, "HMI_Sensor_Data")

    const unsubscribe = onValue(
      dataRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val()
          console.log("Direct Realtime DB data:", data)
          setData(data)
        } else {
          console.log("No data available")
          setData(null)
        }
      },
      (error) => {
        console.error("Error fetching data:", error)
        setError(error.message)
      },
    )

    return () => unsubscribe()
  }, [])

  if (error) {
    return (
      <Card className="border-2 border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Data...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Connecting to Firebase Realtime Database...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Raw Realtime Database Data</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto max-h-96">
          {JSON.stringify(data, null, 2)}
        </pre>
      </CardContent>
    </Card>
  )
}
