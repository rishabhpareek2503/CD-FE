"use client"

import { useState, useEffect } from "react"
import { AlertCircle, Bell, CheckCircle } from "lucide-react"

import { useDevices } from "@/providers/device-provider"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { diagnoseFaults } from "@/lib/fault-diagnosis-service"
import NotificationService from "@/lib/notification-service"

export function AutomatedFaultMonitoring() {
  const { user } = useAuth()
  const { devices } = useDevices()
  const [monitoringEnabled, setMonitoringEnabled] = useState(true)
  const [monitoredDevices, setMonitoredDevices] = useState<string[]>([])
  const [monitoringInterval, setMonitoringInterval] = useState(5) // minutes
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [status, setStatus] = useState<"idle" | "monitoring" | "error">("idle")
  const [selectedDevice, setSelectedDevice] = useState<string>("")
  const [monitoringTimerId, setMonitoringTimerId] = useState<NodeJS.Timeout | null>(null)

  // Initialize monitoring
  useEffect(() => {
    if (devices.length > 0 && monitoredDevices.length === 0) {
      // By default, monitor all devices
      setMonitoredDevices(devices.map((device) => device.id))
    }
  }, [devices, monitoredDevices])

  // Start/stop monitoring based on monitoringEnabled state
  useEffect(() => {
    if (monitoringEnabled && monitoredDevices.length > 0) {
      setStatus("monitoring")

      // Set up interval for monitoring
      const timerId = setInterval(
        () => {
          checkDevices()
        },
        monitoringInterval * 60 * 1000,
      ) // Convert minutes to milliseconds

      setMonitoringTimerId(timerId)

      // Initial check
      checkDevices()

      return () => {
        if (timerId) clearInterval(timerId)
      }
    } else {
      setStatus("idle")
      if (monitoringTimerId) {
        clearInterval(monitoringTimerId)
        setMonitoringTimerId(null)
      }
    }
  }, [monitoringEnabled, monitoredDevices, monitoringInterval])

  // Function to check all monitored devices
  const checkDevices = async () => {
    if (!user) return

    setLastChecked(new Date())

    for (const deviceId of monitoredDevices) {
      try {
        // Fetch latest data for the device
        const response = await fetch(`/api/devices/${deviceId}/latest-data`)

        if (!response.ok) {
          console.error(`Failed to fetch data for device ${deviceId}`)
          continue
        }

        const data = await response.json()

        // Run fault diagnosis
        const diagnosisResult = diagnoseFaults(data)

        // If faults are detected, send notifications
        if (diagnosisResult.hasFault) {
          const device = devices.find((d) => d.id === deviceId)
          const deviceName = device ? device.name : deviceId

          // Send notification based on severity
          const notificationService = NotificationService.getInstance()
          notificationService.addNotification({
            title: `${diagnosisResult.severity.toUpperCase()} Fault Detected`,
            message: `${diagnosisResult.faults.length} issue(s) found in device ${deviceName}`,
            level:
              diagnosisResult.severity === "high"
                ? "critical"
                : diagnosisResult.severity === "medium"
                  ? "warning"
                  : "info",
            deviceId: deviceId,
          })

          console.log(`Notification sent for device ${deviceId} with ${diagnosisResult.faults.length} faults`)
        }
      } catch (error) {
        console.error(`Error checking device ${deviceId}:`, error)
      }
    }
  }

  // Handle adding a device to monitoring
  const handleAddDevice = () => {
    if (selectedDevice && !monitoredDevices.includes(selectedDevice)) {
      setMonitoredDevices([...monitoredDevices, selectedDevice])
      setSelectedDevice("")
    }
  }

  // Handle removing a device from monitoring
  const handleRemoveDevice = (deviceId: string) => {
    setMonitoredDevices(monitoredDevices.filter((id) => id !== deviceId))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Automated Fault Monitoring
            </CardTitle>
            <CardDescription>Automatically monitor devices for faults and send notifications</CardDescription>
          </div>
          <Switch checked={monitoringEnabled} onCheckedChange={setMonitoringEnabled} aria-label="Toggle monitoring" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "monitoring" && (
          <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Monitoring Active</AlertTitle>
            <AlertDescription>
              Automatically checking {monitoredDevices.length} device(s) every {monitoringInterval} minutes.
              {lastChecked && <div className="mt-1 text-xs">Last checked: {lastChecked.toLocaleString()}</div>}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="interval">Monitoring Interval (minutes)</Label>
          <Select
            value={monitoringInterval.toString()}
            onValueChange={(value) => setMonitoringInterval(Number.parseInt(value))}
            disabled={!monitoringEnabled}
          >
            <SelectTrigger id="interval">
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 minute</SelectItem>
              <SelectItem value="5">5 minutes</SelectItem>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Monitored Devices</Label>
          <div className="flex flex-wrap gap-2">
            {monitoredDevices.map((deviceId) => {
              const device = devices.find((d) => d.id === deviceId)
              return (
                <Badge key={deviceId} variant="outline" className="flex items-center gap-1">
                  <span>{device?.name || deviceId}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 rounded-full"
                    onClick={() => handleRemoveDevice(deviceId)}
                  >
                    ×
                  </Button>
                </Badge>
              )
            })}
          </div>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="add-device">Add Device</Label>
            <Select value={selectedDevice} onValueChange={setSelectedDevice} disabled={!monitoringEnabled}>
              <SelectTrigger id="add-device">
                <SelectValue placeholder="Select device" />
              </SelectTrigger>
              <SelectContent>
                {devices
                  .filter((device) => !monitoredDevices.includes(device.id))
                  .map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.name} ({device.id})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAddDevice} disabled={!selectedDevice || !monitoringEnabled}>
            Add
          </Button>
        </div>

        <div className="pt-4">
          <Button
            variant="outline"
            onClick={checkDevices}
            disabled={!monitoringEnabled || monitoredDevices.length === 0}
            className="w-full"
          >
            <Bell className="mr-2 h-4 w-4" />
            Check Now
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
