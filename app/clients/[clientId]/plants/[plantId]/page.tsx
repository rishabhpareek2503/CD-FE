"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { collection, query, where, getDocs } from "firebase/firestore"
import { ArrowLeft, Factory, Settings, AlertTriangle, Gauge, RefreshCw, Download } from "lucide-react"

import { db } from "@/lib/firebase"
import { useAuth } from "@/providers/auth-provider"
import { LiveDataDisplay } from "@/components/live-data-display"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert as AlertUI, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AIPredictionDisplay } from "@/components/ai-prediction-display"

interface Device {
  id: string
  name: string
  serialNumber: string
  location: string
  status: "online" | "offline" | "maintenance"
  lastPing: Date
  installationDate: Date
  lastMaintenance: Date
  isReplaced: boolean
  oldDeviceId?: string
  replacedDate?: Date
}

interface AlertData {
  id: string
  deviceId: string
  parameter: string
  value: number
  threshold: number
  type: "high" | "low"
  timestamp: Date
  status: "active" | "acknowledged" | "resolved"
}

export default function PlantDashboardPage() {
  const { clientId, plantId } = useParams<{ clientId: string; plantId: string }>()
  const router = useRouter()
  const { user } = useAuth()

  const [plantName, setPlantName] = useState<string>("")
  const [plantType, setPlantType] = useState<"STP" | "WTP" | "CEMS" | "OTHER">("OTHER")
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [alerts, setAlerts] = useState<AlertData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch plant data and devices
  useEffect(() => {
    if (!user || !clientId || !plantId) return

    const fetchPlantAndDevices = async () => {
      try {
        setLoading(true)

        // Extract plant name from plantId (which is location-based)
        const decodedPlantName = decodeURIComponent(plantId as string).replace(/-/g, " ")
        setPlantName(decodedPlantName)

        // Fetch devices for this plant (based on location)
        const devicesQuery = query(
          collection(db, "devices"),
          where("companyId", "==", clientId),
          where("location", "==", decodedPlantName),
        )

        const devicesSnapshot = await getDocs(devicesQuery)

        if (devicesSnapshot.empty) {
          setError("No devices found for this plant")
          setLoading(false)
          return
        }

        const devicesList: Device[] = []

        devicesSnapshot.forEach((deviceDoc) => {
          const data = deviceDoc.data()

          // Determine plant type from first device
          if (devicesList.length === 0) {
            if (data.deviceType === "STP" || data.name?.includes("STP")) {
              setPlantType("STP")
            } else if (data.deviceType === "WTP" || data.name?.includes("WTP")) {
              setPlantType("WTP")
            } else if (data.deviceType === "CEMS" || data.name?.includes("CEMS")) {
              setPlantType("CEMS")
            }
          }

          devicesList.push({
            id: deviceDoc.id,
            name: data.name || "Unnamed Device",
            serialNumber: data.serialNumber || "Unknown",
            location: data.location || "Unknown Location",
            status: data.status || "offline",
            lastPing: data.lastPing ? new Date(data.lastPing) : new Date(),
            installationDate: data.installationDate ? new Date(data.installationDate) : new Date(),
            lastMaintenance: data.lastMaintenance ? new Date(data.lastMaintenance) : new Date(),
            isReplaced: data.isReplaced || false,
            oldDeviceId: data.oldDeviceId,
            replacedDate: data.replacedDate ? new Date(data.replacedDate) : undefined,
          })
        })

        setDevices(devicesList)

        // Set first device as selected if none is selected
        if (devicesList.length > 0 && !selectedDevice) {
          setSelectedDevice(devicesList[0])
        }

        // Fetch alerts for all devices in this plant
        const deviceIds = devicesList.map((d) => d.id)

        // Mock alerts for now
        const mockAlerts: AlertData[] = [
          {
            id: "alert1",
            deviceId: devicesList[0]?.id || "",
            parameter: "pH",
            value: 9.2,
            threshold: 8.5,
            type: "high",
            timestamp: new Date(Date.now() - 30 * 60000), // 30 minutes ago
            status: "active",
          },
          {
            id: "alert2",
            deviceId: devicesList[0]?.id || "",
            parameter: "BOD",
            value: 35,
            threshold: 30,
            type: "high",
            timestamp: new Date(Date.now() - 45 * 60000), // 45 minutes ago
            status: "active",
          },
        ]

        setAlerts(mockAlerts)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching plant and devices:", err)
        setError("Failed to load plant information")
        setLoading(false)
      }
    }

    fetchPlantAndDevices()
  }, [user, clientId, plantId, selectedDevice])

  // Get plant type icon
  function getPlantTypeIcon(type: "STP" | "WTP" | "CEMS" | "OTHER") {
    switch (type) {
      case "STP":
        return <span className="text-green-500 text-xl mr-2">🟢</span>
      case "WTP":
        return <span className="text-blue-500 text-xl mr-2">💧</span>
      case "CEMS":
        return <span className="text-amber-500 text-xl mr-2">🏭</span>
      default:
        return <Factory className="h-5 w-5 mr-2" />
    }
  }

  // Get device health status
  function getDeviceHealthStatus(device: Device) {
    // Check if device is replaced
    if (device.isReplaced) {
      return {
        color: "bg-purple-500",
        label: "Replaced",
        description: `Replaced on ${device.replacedDate?.toLocaleDateString() || "unknown date"}`,
      }
    }

    // Check if device is offline (last ping > 10 minutes ago)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60000)
    if (device.status === "offline" || device.lastPing < tenMinutesAgo) {
      return {
        color: "bg-red-500",
        label: "Offline",
        description: `Last ping: ${device.lastPing.toLocaleString()}`,
      }
    }

    // Check if device is in maintenance
    if (device.status === "maintenance") {
      return {
        color: "bg-amber-500",
        label: "Maintenance",
        description: "Device is under maintenance",
      }
    }

    // Device is online
    return {
      color: "bg-green-500",
      label: "Online",
      description: `Last ping: ${device.lastPing.toLocaleString()}`,
    }
  }

  // Render dashboard based on plant type
  function renderDashboardByType() {
    switch (plantType) {
      case "STP":
        return <STPDashboard device={selectedDevice} />
      case "WTP":
        return <WTPDashboard device={selectedDevice} />
      case "CEMS":
        return <CEMSDashboard device={selectedDevice} />
      default:
        return <GenericDashboard device={selectedDevice} />
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium">Error Loading Plant</h3>
            <p className="text-sm text-gray-500 mt-2">{error}</p>
            <Button className="mt-6" onClick={() => router.push(`/clients/${clientId}`)}>
              Return to Client Overview
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center">
            {getPlantTypeIcon(plantType)}
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              {plantName}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <Button size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Configure
          </Button>
        </div>
      </div>

      {/* Alert Section */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertUI
              key={alert.id}
              variant="destructive"
              className="bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800"
            >
              <AlertTitle className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                {alert.parameter} {alert.type === "high" ? "High" : "Low"} Alert
              </AlertTitle>
              <AlertDescription className="flex justify-between items-center">
                <span>
                  Current: <strong>{alert.value}</strong> (Threshold: {alert.threshold})
                  <br />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Device: {devices.find((d) => d.id === alert.deviceId)?.name || alert.deviceId}
                  </span>
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-200 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/50"
                >
                  Acknowledge
                </Button>
              </AlertDescription>
            </AlertUI>
          ))}
        </div>
      )}

      {/* Device Selection */}
      <Card className="border-2 border-primary/20 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
          <div className="flex justify-between items-center">
            <CardTitle>Device Selection</CardTitle>
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <Select
            value={selectedDevice?.id || ""}
            onValueChange={(value) => setSelectedDevice(devices.find((d) => d.id === value) || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a device" />
            </SelectTrigger>
            <SelectContent>
              {devices.map((device) => {
                const health = getDeviceHealthStatus(device)
                return (
                  <SelectItem key={device.id} value={device.id}>
                    <div className="flex items-center">
                      <span className={`h-2 w-2 rounded-full ${health.color} mr-2`}></span>
                      {device.name} ({device.serialNumber})
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Device Health Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {devices.map((device) => {
          const health = getDeviceHealthStatus(device)
          return (
            <Card
              key={device.id}
              className={`border-2 ${device.id === selectedDevice?.id ? "border-primary shadow-lg" : "border-gray-200 dark:border-gray-800"} overflow-hidden cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => setSelectedDevice(device)}
            >
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center">
                    <Gauge className="h-4 w-4 mr-2" />
                    <span className="truncate">{device.name}</span>
                  </div>
                  <span className={`h-2 w-2 rounded-full ${health.color}`}></span>
                </CardTitle>
                <CardDescription className="text-xs">{device.serialNumber}</CardDescription>
              </CardHeader>
              <CardContent className="p-3">
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className="font-medium">{health.label}</span>
                  </div>
                  {device.isReplaced && device.oldDeviceId && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Old ID:</span>
                      <span className="font-medium">{device.oldDeviceId}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Ping:</span>
                    <span className="font-medium">{device.lastPing.toLocaleTimeString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Dynamic Dashboard based on Plant Type */}
      {selectedDevice ? (
        <div className="grid gap-6 md:grid-cols-12">
          <div className="md:col-span-12">{renderDashboardByType()}</div>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Gauge className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">No Device Selected</h3>
            <p className="text-sm text-gray-500 mt-2">Please select a device to view its dashboard</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// STP Dashboard Component
function STPDashboard({ device }: { device: Device | null }) {
  if (!device) return null

  return (
    <div className="space-y-6">
      <Card className="border-2 border-green-200 dark:border-green-800 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <div className="flex items-center">
            <span className="text-green-500 text-xl mr-2">🟢</span>
            <CardTitle>STP Dashboard - {device.name}</CardTitle>
          </div>
          <CardDescription>Sewage Treatment Plant Monitoring</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <LiveDataDisplay deviceId={device.id} />
        </CardContent>
      </Card>

      {/* Add AI Prediction Component */}
      <AIPredictionDisplay deviceId={device.id} />
    </div>
  )
}

// WTP Dashboard Component
function WTPDashboard({ device }: { device: Device | null }) {
  if (!device) return null

  return (
    <div className="space-y-6">
      <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <div className="flex items-center">
            <span className="text-blue-500 text-xl mr-2">💧</span>
            <CardTitle>WTP Dashboard - {device.name}</CardTitle>
          </div>
          <CardDescription>Water Treatment Plant Monitoring</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <LiveDataDisplay deviceId={device.id} />
        </CardContent>
      </Card>

      {/* Add AI Prediction Component */}
      <AIPredictionDisplay deviceId={device.id} />
    </div>
  )
}

// CEMS Dashboard Component
function CEMSDashboard({ device }: { device: Device | null }) {
  if (!device) return null

  return (
    <div className="space-y-6">
      <Card className="border-2 border-amber-200 dark:border-amber-800 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
          <div className="flex items-center">
            <span className="text-amber-500 text-xl mr-2">🏭</span>
            <CardTitle>CEMS Dashboard - {device.name}</CardTitle>
          </div>
          <CardDescription>Continuous Emission Monitoring System</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <LiveDataDisplay deviceId={device.id} />
        </CardContent>
      </Card>

      {/* Add AI Prediction Component */}
      <AIPredictionDisplay deviceId={device.id} />
    </div>
  )
}

// Generic Dashboard Component
function GenericDashboard({ device }: { device: Device | null }) {
  if (!device) return null

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
          <CardTitle>Device Dashboard - {device.name}</CardTitle>
          <CardDescription>Monitoring Dashboard</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <LiveDataDisplay deviceId={device.id} />
        </CardContent>
      </Card>

      {/* Add AI Prediction Component */}
      <AIPredictionDisplay deviceId={device.id} />
    </div>
  )
}
