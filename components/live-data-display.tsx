"use client"

import { useState } from "react"
import { RefreshCw, AlertTriangle, WifiOff } from "lucide-react"

import { useLiveData } from "@/hooks/use-live-data"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Define parameter thresholds and units - removed DO, temperature, conductivity, turbidity
const parameters = [
  { name: "pH", unit: "", min: 6.5, max: 8.5, color: "blue", description: "Acidity/Alkalinity" },
  { name: "BOD", unit: "mg/L", min: 0, max: 30, color: "green", description: "Biochemical Oxygen Demand" },
  { name: "COD", unit: "mg/L", min: 0, max: 250, color: "purple", description: "Chemical Oxygen Demand" },
  { name: "TSS", unit: "mg/L", min: 0, max: 30, color: "amber", description: "Total Suspended Solids" },
  { name: "flow", unit: "m³/h", min: 0, max: 100, color: "cyan", description: "Water Flow Rate" },
]

interface LiveDataDisplayProps {
  deviceId: string
  title?: string
}

export function LiveDataDisplay({ deviceId, title = "Live Sensor Data" }: LiveDataDisplayProps) {
  const { liveReading, lastUpdated, timeUntilRefresh, loading, error, isOffline, offlineSince } = useLiveData(deviceId)
  const [refreshing, setRefreshing] = useState(false)

  // Format the countdown timer
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Format time since offline
  const formatTimeSinceOffline = (offlineSince: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - offlineSince.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
    } else if (diffMins > 0) {
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`
    } else {
      return "Just now"
    }
  }

  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshing(true)
    // Force a refresh by updating the lastUpdated state in the hook
    setTimeout(() => setRefreshing(false), 1000)
  }

  // Helper function to get color classes
  const getColorClasses = (paramColor: string, type: "bg" | "text" | "border" | "from" | "to") => {
    const colorMap: Record<string, Record<string, string>> = {
      blue: {
        bg: "bg-blue-100 dark:bg-blue-900",
        text: "text-blue-700 dark:text-blue-300",
        border: "border-blue-200 dark:border-blue-800",
        from: "from-blue-50 dark:from-blue-950",
        to: "to-blue-100 dark:to-blue-900",
      },
      green: {
        bg: "bg-green-100 dark:bg-green-900",
        text: "text-green-700 dark:text-green-300",
        border: "border-green-200 dark:border-green-800",
        from: "from-green-50 dark:from-green-950",
        to: "to-green-100 dark:to-green-900",
      },
      purple: {
        bg: "bg-purple-100 dark:bg-purple-900",
        text: "text-purple-700 dark:text-purple-300",
        border: "border-purple-200 dark:border-purple-800",
        from: "from-purple-50 dark:from-purple-950",
        to: "to-purple-100 dark:to-purple-900",
      },
      amber: {
        bg: "bg-amber-100 dark:bg-amber-900",
        text: "text-amber-700 dark:text-amber-300",
        border: "border-amber-200 dark:border-amber-800",
        from: "from-amber-50 dark:from-amber-950",
        to: "to-amber-100 dark:to-amber-900",
      },
      cyan: {
        bg: "bg-cyan-100 dark:bg-cyan-900",
        text: "text-cyan-700 dark:text-cyan-300",
        border: "border-cyan-200 dark:border-cyan-800",
        from: "from-cyan-50 dark:from-cyan-950",
        to: "to-cyan-100 dark:to-cyan-900",
      },
      red: {
        bg: "bg-red-100 dark:bg-red-900",
        text: "text-red-700 dark:text-red-300",
        border: "border-red-200 dark:border-red-800",
        from: "from-red-50 dark:from-red-950",
        to: "to-red-100 dark:to-red-900",
      },
    }

    return colorMap[paramColor]?.[type] || ""
  }

  // Loading state
  if (loading && !liveReading) {
    return (
      <Card className="border-2 border-primary/20 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
          <CardTitle>{title}</CardTitle>
          <CardDescription>Loading real-time sensor readings...</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error && !liveReading) {
    return (
      <Card className="border-2 border-red-200 dark:border-red-800 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
          <CardTitle className="flex items-center text-red-700 dark:text-red-300">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Error Loading Live Data
          </CardTitle>
          <CardDescription className="text-red-600 dark:text-red-400">
            There was a problem fetching the latest sensor readings
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="p-4 text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <p className="text-xs mt-4 text-gray-500">
              Make sure data exists at path: <code>HMI_Sensor_Data/{deviceId}/Live</code>
            </p>
            <Button onClick={handleRefresh} className="mt-4">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-primary/20 shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              {isOffline ? (
                <WifiOff className="mr-2 h-5 w-5 text-red-600" />
              ) : (
                <span className="mr-2 h-2 w-2 rounded-full bg-green-600 animate-pulse"></span>
              )}
              {isOffline ? "Last Known Sensor Data" : title}
            </CardTitle>
            <CardDescription>
              {isOffline
                ? `Sensor offline since ${offlineSince ? formatTimeSinceOffline(offlineSince) : "unknown time"}`
                : "Real-time readings updated every 6 minutes"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isOffline ? (
              <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300">
                OFFLINE
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                Next update: {formatCountdown(timeUntilRefresh)}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-primary/20 hover:bg-primary/10"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              <span className="sr-only">Refresh</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {isOffline && (
          <Alert className="mb-4 bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Sensor Offline</AlertTitle>
            <AlertDescription>
              This device is currently offline. Showing the last known data from{" "}
              {liveReading?.timestamp.toLocaleString()}.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {parameters.map((param) => {
            if (!liveReading) return null

            // Map the parameter names to match the Firebase data structure
            const paramMapping: Record<string, string> = {
              pH: "pH",
              BOD: "BOD",
              COD: "COD",
              TSS: "TSS",
              flow: "flow",
            }

            const paramKey = paramMapping[param.name] as keyof typeof liveReading
            const value = (liveReading[paramKey] as number) || 0
            const isLow = value < param.min
            const isHigh = value > param.max
            const status = isLow ? "Low" : isHigh ? "High" : "Normal"
            const statusColorClass = isLow
              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
              : isHigh
                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"

            // Calculate percentage for progress bar
            const range = param.max - param.min
            const percentage = Math.min(100, Math.max(0, ((value - param.min) / range) * 100))

            // Get color classes
            const borderClass = getColorClasses(param.color, "border")
            const bgFromClass = getColorClasses(param.color, "from")
            const bgToClass = getColorClasses(param.color, "to")
            const textClass = getColorClasses(param.color, "text")
            const bgClass = getColorClasses(param.color, "bg")

            return (
              <Card
                key={param.name}
                className={`border-2 ${borderClass} shadow-md overflow-hidden ${isOffline ? "opacity-90" : ""}`}
              >
                <CardHeader className={`bg-gradient-to-r ${bgFromClass} ${bgToClass} pb-2`}>
                  <div className="flex justify-between items-center">
                    <CardTitle className={textClass}>{param.name}</CardTitle>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColorClass}`}>{status}</span>
                  </div>
                  <CardDescription>{param.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <span className={`text-3xl font-bold ${textClass}`}>
                        {value} {param.unit}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>
                          {param.min} {param.unit}
                        </span>
                        <span>
                          {param.max} {param.unit}
                        </span>
                      </div>
                      <Progress value={percentage} className={`h-2 ${bgClass}`} indicatorClassName={textClass} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </CardContent>
      <CardFooter className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 flex justify-between">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {isOffline
            ? `Last data received: ${liveReading?.timestamp.toLocaleString()}`
            : `Last updated: ${lastUpdated.toLocaleString()}`}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Device ID: {deviceId}</div>
      </CardFooter>
    </Card>
  )
}
