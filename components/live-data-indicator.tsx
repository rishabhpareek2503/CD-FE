"use client"

import { useEffect, useState } from "react"
import { RefreshCw, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface LiveDataIndicatorProps {
  timeUntilRefresh: number
  lastUpdated: Date
  isOffline?: boolean
  offlineSince?: Date | null
  className?: string
}

export function LiveDataIndicator({
  timeUntilRefresh,
  lastUpdated,
  isOffline = false,
  offlineSince = null,
  className,
}: LiveDataIndicatorProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Show refreshing animation when countdown is at 0
  useEffect(() => {
    if (timeUntilRefresh <= 0 && !isOffline) {
      setIsRefreshing(true)
      const timer = setTimeout(() => setIsRefreshing(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [timeUntilRefresh, isOffline])

  // Format the time until refresh as MM:SS
  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeUntilRefresh / 60)
    const seconds = timeUntilRefresh % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  // Format time since offline
  const formatTimeSinceOffline = () => {
    if (!offlineSince) return "Unknown"

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

  // Format the last updated time safely
  const getFormattedLastUpdated = () => {
    if (!lastUpdated) return "N/A"
    try {
      return lastUpdated.toLocaleTimeString()
    } catch (error) {
      console.error("Error formatting lastUpdated:", error)
      return "Invalid date"
    }
  }

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      {isOffline ? (
        <>
          <WifiOff className="h-4 w-4 text-red-500" />
          <div className="flex flex-col">
            <span className="text-xs text-red-500 font-medium">Sensor Offline</span>
            <span className="text-xs text-muted-foreground">Last data: {formatTimeSinceOffline()}</span>
          </div>
        </>
      ) : (
        <>
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">
              Next update in: <span className="font-mono">{formatTimeRemaining()}</span>
            </span>
            <span className="text-xs text-muted-foreground">Last updated: {getFormattedLastUpdated()}</span>
          </div>
        </>
      )}
    </div>
  )
}
