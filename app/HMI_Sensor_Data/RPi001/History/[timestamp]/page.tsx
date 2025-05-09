"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { ref, get } from "firebase/database"

import { realtimeDb } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

interface ReadingData {
  BOD: number
  COD: number
  Flow: number
  PH: number
  TSS: number
  Timestamp: string
}

// Helper function to safely format dates
const formatDate = (date: Date | string | undefined | null): string => {
  if (!date) return "N/A"
  if (date instanceof Date) {
    return date.toLocaleString()
  }
  if (typeof date === "string") {
    return date
  }
  return String(date)
}

export default function HistoricalReadingPage() {
  const params = useParams()
  const router = useRouter()
  const timestamp = params.timestamp as string

  const [reading, setReading] = useState<ReadingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchReading() {
      try {
        const readingRef = ref(realtimeDb, `HMI_Sensor_Data/RPi001/History/${timestamp}`)
        const snapshot = await get(readingRef)

        if (snapshot.exists()) {
          const data = snapshot.val()
          // Ensure all numeric fields are numbers
          setReading({
            BOD: typeof data.BOD === "number" ? data.BOD : 0,
            COD: typeof data.COD === "number" ? data.COD : 0,
            Flow: typeof data.Flow === "number" ? data.Flow : 0,
            PH: typeof data.PH === "number" ? data.PH : 0,
            TSS: typeof data.TSS === "number" ? data.TSS : 0,
            Timestamp: data.Timestamp || timestamp.replace(/_/g, " ").replace(/-/g, ":"),
          })
        } else {
          setError("Reading not found")
        }
      } catch (err) {
        console.error("Error fetching reading:", err)
        setError("Failed to fetch reading data")
      } finally {
        setLoading(false)
      }
    }

    fetchReading()
  }, [timestamp])

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !reading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Historical Reading</h1>
        </div>
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || "Reading not found"}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/dashboard/history")}>Go to History Dashboard</Button>
      </div>
    )
  }

  // Define parameter thresholds and units
  const parameters = [
    { name: "PH", unit: "", min: 6.5, max: 8.5, value: reading.PH },
    { name: "BOD", unit: "mg/L", min: 0, max: 30, value: reading.BOD },
    { name: "COD", unit: "mg/L", min: 0, max: 250, value: reading.COD },
    { name: "TSS", unit: "mg/L", min: 0, max: 30, value: reading.TSS },
    { name: "Flow", unit: "m³/h", min: 0, max: 100, value: reading.Flow },
  ]

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Historical Reading</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sensor Reading: {timestamp}</CardTitle>
          <CardDescription>Timestamp: {formatDate(reading.Timestamp)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {parameters.map((param) => {
              const isLow = param.value < param.min
              const isHigh = param.value > param.max
              const status = isLow ? "Low" : isHigh ? "High" : "Normal"
              const statusColor = isLow ? "text-blue-600" : isHigh ? "text-red-600" : "text-green-600"

              return (
                <Card key={param.name} className="overflow-hidden">
                  <CardHeader className="bg-gray-50 dark:bg-gray-800 p-4">
                    <CardTitle className="text-lg">{param.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-2xl font-bold">{param.value}</p>
                        <p className="text-sm text-gray-500">{param.unit}</p>
                      </div>
                      <div className={`text-sm font-medium ${statusColor}`}>{status}</div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Normal range: {param.min} - {param.max} {param.unit}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => router.push("/dashboard/history")}>View All History</Button>
      </div>
    </div>
  )
}
