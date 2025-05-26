"use client"

import { useState } from "react"
import { useAlerts } from "@/hooks/use-alerts"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, AlertTriangle, Info, Bell, CheckCircle2, Clock } from "lucide-react"
import { format } from "date-fns"
import { acknowledgeAlert } from "@/lib/automated-monitoring-service"
import { Skeleton } from "@/components/ui/skeleton"

interface AlertsDisplayProps {
  deviceId?: string
  limit?: number
  showTitle?: boolean
}

export function AlertsDisplay({ deviceId, limit = 10, showTitle = true }: AlertsDisplayProps) {
  const { alerts, loading, error } = useAlerts(deviceId, limit)
  const [activeTab, setActiveTab] = useState<string>("all")

  const handleAcknowledge = async (alertId: string) => {
    await acknowledgeAlert(alertId)
  }

  const filteredAlerts = alerts.filter((alert) => {
    if (activeTab === "all") return true
    if (activeTab === "critical") return alert.level === "critical"
    if (activeTab === "warning") return alert.level === "warning"
    if (activeTab === "info") return alert.level === "info"
    if (activeTab === "unacknowledged") return !alert.acknowledged
    return true
  })

  const getAlertIcon = (level: string) => {
    switch (level) {
      case "critical":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getAlertBadge = (level: string) => {
    switch (level) {
      case "critical":
        return (
          <Badge variant="destructive" className="ml-2">
            Critical
          </Badge>
        )
      case "warning":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 ml-2">
            Warning
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 ml-2">
            Info
          </Badge>
        )
    }
  }

  return (
    <Card className="border-2 border-blue-100 dark:border-blue-900 shadow-md">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        {showTitle && (
          <>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              System Alerts
            </CardTitle>
            <CardDescription>
              {deviceId ? "Recent alerts for this device" : "Recent alerts across all devices"}
            </CardDescription>
          </>
        )}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="critical">Critical</TabsTrigger>
            <TabsTrigger value="warning">Warning</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="unacknowledged">Unacknowledged</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="p-4">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="mb-4">
                <CardHeader className="p-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 text-red-500 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p className="text-lg font-medium">No alerts found</p>
            <p className="text-sm">All systems are operating normally</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <Card key={alert.id} className={`mb-4 ${alert.acknowledged ? "opacity-70" : ""}`}>
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getAlertIcon(alert.level)}
                      <span className="ml-2 font-semibold">{alert.title}</span>
                      {getAlertBadge(alert.level)}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {alert.timestamp && format(alert.timestamp.toDate(), "MMM d, yyyy h:mm a")}
                    </div>
                  </div>
                  <CardDescription>Device: {alert.deviceName || alert.deviceId}</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <p>{alert.message}</p>
                  {alert.conditions && alert.conditions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Conditions:</p>
                      <ul className="list-disc list-inside text-sm">
                        {alert.conditions.map((condition, i) => (
                          <li key={i}>{condition}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between">
                  <div>
                    {alert.acknowledged ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Acknowledged
                      </Badge>
                    ) : (
                      <Badge variant="outline">Unacknowledged</Badge>
                    )}
                  </div>
                  {!alert.acknowledged && (
                    <Button variant="outline" size="sm" onClick={() => handleAcknowledge(alert.id)}>
                      Acknowledge
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
