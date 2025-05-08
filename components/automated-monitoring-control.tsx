"use client"

import { useState, useEffect } from "react"
import { Bell, BellOff, RefreshCw, AlertTriangle, Check } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useDevices } from "@/providers/device-provider"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  startAutomatedMonitoring,
  stopAutomatedMonitoring,
  startMonitoringAllDevices,
} from "@/lib/automated-monitoring-service"

export function AutomatedMonitoringControl() {
  const { user } = useAuth()
  const { devices, loading } = useDevices()
  const [monitoringEnabled, setMonitoringEnabled] = useState<Record<string, boolean>>({})
  const [globalMonitoring, setGlobalMonitoring] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  // Initialize monitoring status
  useEffect(() => {
    if (!loading && devices.length > 0 && isInitializing) {
      const initialState: Record<string, boolean> = {}
      devices.forEach((device) => {
        initialState[device.id] = false
      })
      setMonitoringEnabled(initialState)
      setIsInitializing(false)
    }
  }, [devices, loading, isInitializing])

  // Toggle monitoring for a specific device
  const toggleDeviceMonitoring = (deviceId: string) => {
    if (!user) return

    const newState = !monitoringEnabled[deviceId]

    if (newState) {
      startAutomatedMonitoring(deviceId, user.uid)
    } else {
      stopAutomatedMonitoring(deviceId)
    }

    setMonitoringEnabled((prev) => ({
      ...prev,
      [deviceId]: newState,
    }))

    // Update global monitoring state
    const updatedStates = { ...monitoringEnabled, [deviceId]: newState }
    const allDevicesMonitored = devices.every((device) => updatedStates[device.id])
    setGlobalMonitoring(allDevicesMonitored)
  }

  // Toggle monitoring for all devices
  const toggleAllMonitoring = async () => {
    if (!user) return

    const newState = !globalMonitoring
    setGlobalMonitoring(newState)

    const updatedState: Record<string, boolean> = {}

    if (newState) {
      // Start monitoring all devices
      await startMonitoringAllDevices(user.uid)
      devices.forEach((device) => {
        updatedState[device.id] = true
      })
    } else {
      // Stop monitoring all devices
      devices.forEach((device) => {
        stopAutomatedMonitoring(device.id)
        updatedState[device.id] = false
      })
    }

    setMonitoringEnabled(updatedState)
  }

  if (loading || isInitializing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading Monitoring Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please wait while we load your devices...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-md">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Automated Monitoring
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Switch id="global-monitoring" checked={globalMonitoring} onCheckedChange={toggleAllMonitoring} />
            <Label htmlFor="global-monitoring">{globalMonitoring ? "Monitoring All" : "Monitor All"}</Label>
          </div>
        </div>
        <CardDescription>Enable automated monitoring and alerts for your devices</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Automated Monitoring</AlertTitle>
          <AlertDescription>
            When enabled, the system will continuously monitor your devices and automatically send alerts via SMS and
            WhatsApp when unusual conditions are detected.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Device Monitoring Status</h3>
          <div className="space-y-2">
            {devices.length === 0 ? (
              <p className="text-sm text-gray-500">No devices found. Add devices to enable monitoring.</p>
            ) : (
              devices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-2 border rounded-md">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${device.status === "online" ? "bg-green-500" : "bg-red-500"}`}
                    />
                    <span className="font-medium">{device.name}</span>
                    <span className="text-sm text-gray-500">({device.id})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={monitoringEnabled[device.id] ? "default" : "outline"}
                      className={
                        monitoringEnabled[device.id]
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                          : ""
                      }
                    >
                      {monitoringEnabled[device.id] ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Monitoring
                        </>
                      ) : (
                        <>
                          <BellOff className="h-3 w-3 mr-1" />
                          Disabled
                        </>
                      )}
                    </Badge>
                    <Switch
                      checked={monitoringEnabled[device.id] || false}
                      onCheckedChange={() => toggleDeviceMonitoring(device.id)}
                      disabled={device.status !== "online"}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 flex justify-between">
        <p className="text-xs text-gray-500">
          {globalMonitoring
            ? "Monitoring is active for all devices"
            : Object.values(monitoringEnabled).some(Boolean)
              ? "Monitoring is active for some devices"
              : "Monitoring is disabled for all devices"}
        </p>
        <Badge variant={globalMonitoring ? "default" : "outline"}>
          {globalMonitoring ? "System Active" : "System Inactive"}
        </Badge>
      </CardFooter>
    </Card>
  )
}
