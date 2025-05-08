"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { doc, getDoc, collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore"
import { ArrowLeft, Settings, Wrench, ArrowRight, WifiOff } from "lucide-react"

import { db } from "@/lib/firebase"
import { useAuth } from "@/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { DeviceExportButton } from "@/components/device-export-button"

// Import the ChemicalInformationDisplay component
import { ChemicalInformationDisplay } from "@/components/chemical-information-display"

// Define parameter thresholds and units
const parameters = [
  { name: "pH", unit: "", min: 6.5, max: 8.5, color: "blue", description: "Acidity/Alkalinity" },
  { name: "BOD", unit: "mg/L", min: 0, max: 30, color: "green", description: "Biochemical Oxygen Demand" },
  { name: "COD", unit: "mg/L", min: 0, max: 250, color: "purple", description: "Chemical Oxygen Demand" },
  { name: "TSS", unit: "mg/L", min: 0, max: 30, color: "amber", description: "Total Suspended Solids" },
  { name: "flow", unit: "m³/h", min: 0, max: 100, color: "cyan", description: "Water Flow Rate" },
  { name: "temperature", unit: "°C", min: 15, max: 35, color: "red", description: "Water Temperature" },
  { name: "DO", unit: "mg/L", min: 4, max: 8, color: "teal", description: "Dissolved Oxygen" },
  { name: "conductivity", unit: "μS/cm", min: 500, max: 1500, color: "indigo", description: "Electrical Conductivity" },
  { name: "turbidity", unit: "NTU", min: 0, max: 5, color: "orange", description: "Water Clarity" },
]

interface Device {
  id: string
  name: string
  serialNumber: string
  location: string
  installationDate: Date
  lastMaintenance: Date
  status: "online" | "offline" | "maintenance"
  companyId: string
  userId: string
  configuration?: {
    sensorType: string
    communicationType: string
    samplingRate: string
    firmwareVersion: string
    calibrationDate: string
    alarmThresholds: {
      [key: string]: {
        min: number
        max: number
      }
    }
  }
}

interface SensorReading {
  id: string
  deviceId: string
  timestamp: Date
  pH: number
  BOD: number
  COD: number
  TSS: number
  flow: number
  temperature: number
  DO: number
  conductivity: number
  turbidity: number
  [key: string]: any
}

// Add this mock data for chemical information
const mockChemicalData = [
  {
    id: "chem1",
    name: "Aluminum Sulfate",
    formula: "Al2(SO4)3",
    currentDosage: 25.4,
    recommendedDosage: 24.0,
    unit: "mg/L",
    lastUpdated: "2023-06-15 14:30",
    status: "normal" as const,
  },
  {
    id: "chem2",
    name: "Chlorine",
    formula: "Cl2",
    currentDosage: 3.8,
    recommendedDosage: 2.5,
    unit: "mg/L",
    lastUpdated: "2023-06-15 14:30",
    status: "high" as const,
  },
  {
    id: "chem3",
    name: "Sodium Hydroxide",
    formula: "NaOH",
    currentDosage: 12.1,
    recommendedDosage: 12.0,
    unit: "mg/L",
    lastUpdated: "2023-06-15 14:30",
    status: "normal" as const,
  },
  {
    id: "chem4",
    name: "Ferric Chloride",
    formula: "FeCl3",
    currentDosage: 0.8,
    recommendedDosage: 1.5,
    unit: "mg/L",
    lastUpdated: "2023-06-15 14:30",
    status: "low" as const,
  },
]

export default function DeviceDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()

  const [device, setDevice] = useState<Device | null>(null)
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch device details
  useEffect(() => {
    if (!user || !id) return

    const fetchDevice = async () => {
      try {
        setLoading(true)

        const deviceDoc = await getDoc(doc(db, "devices", id as string))

        if (!deviceDoc.exists()) {
          setError("Device not found")
          setLoading(false)
          return
        }

        const data = deviceDoc.data()

        // Check if the device belongs to the current user
        if (data.userId !== user.uid) {
          setError("You do not have permission to view this device")
          setLoading(false)
          return
        }

        setDevice({
          id: deviceDoc.id,
          ...data,
          installationDate: data.installationDate ? new Date(data.installationDate) : new Date(),
          lastMaintenance: data.lastMaintenance ? new Date(data.lastMaintenance) : new Date(),
          // Mock configuration data
          configuration: {
            sensorType: "Advanced Multi-Parameter",
            communicationType: "4G LTE + WiFi",
            samplingRate: "5 minutes",
            firmwareVersion: "v2.3.1",
            calibrationDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            alarmThresholds: {
              pH: { min: 6.5, max: 8.5 },
              BOD: { min: 0, max: 30 },
              COD: { min: 0, max: 250 },
              TSS: { min: 0, max: 30 },
              flow: { min: 0, max: 100 },
              temperature: { min: 15, max: 35 },
              DO: { min: 4, max: 8 },
              conductivity: { min: 500, max: 1500 },
              turbidity: { min: 0, max: 5 },
            },
          },
        } as Device)

        setLoading(false)
      } catch (err) {
        console.error("Error fetching device:", err)
        setError("Failed to load device information")
        setLoading(false)
      }
    }

    fetchDevice()
  }, [user, id])

  // Fetch latest sensor reading
  useEffect(() => {
    if (!user || !id) return

    const readingsQuery = query(
      collection(db, "sensorReadings"),
      where("deviceId", "==", id),
      orderBy("timestamp", "desc"),
      limit(1),
    )

    const unsubscribe = onSnapshot(
      readingsQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0]
          const data = doc.data()

          setLatestReading({
            id: doc.id,
            ...data,
            timestamp: data.timestamp ? new Date(data.timestamp.toDate()) : new Date(),
          } as SensorReading)
        }
      },
      (error) => {
        console.error("Error fetching latest reading:", error)
      },
    )

    return () => unsubscribe()
  }, [user, id])

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
  if (error || !device) {
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
            <Settings className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">Error Loading Device</h3>
            <p className="text-sm text-gray-500 mt-2">
              {error || "Device not found or you do not have permission to view it"}
            </p>
            <Button className="mt-6" onClick={() => router.push("/dashboard")}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isOffline = device.status === "offline"

  // Prepare data for export
  const exportData = latestReading
    ? parameters.map((param) => {
        const paramKey = param.name.toLowerCase() as keyof typeof latestReading
        return {
          Parameter: param.name,
          Value: latestReading[paramKey] || 0,
          Unit: param.unit,
          Min: param.min,
          Max: param.max,
          Status:
            (latestReading[paramKey] || 0) < param.min
              ? "Low"
              : (latestReading[paramKey] || 0) > param.max
                ? "High"
                : "Normal",
        }
      })
    : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            {device.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <DeviceExportButton device={device} data={exportData} disabled={!latestReading} type="current" />
          <Button size="sm">
            <Wrench className="mr-2 h-4 w-4" />
            Configure
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2 border-primary/20 shadow-md">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
            <CardTitle>Device Information</CardTitle>
            <CardDescription>Details and specifications</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Device ID</p>
                  <p className="font-medium">{device.id}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Serial Number</p>
                  <p className="font-medium">{device.serialNumber}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="font-medium">{device.location}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="font-medium flex items-center">
                    <span
                      className={`mr-2 h-2 w-2 rounded-full ${
                        device.status === "online"
                          ? "bg-green-600"
                          : device.status === "offline"
                            ? "bg-red-600"
                            : "bg-amber-600"
                      }`}
                    ></span>
                    {device.status === "online" ? "Online" : device.status === "offline" ? "Offline" : "Maintenance"}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Device Configuration</h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-gray-500">Sensor Type</p>
                    <p>{device.configuration?.sensorType}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500">Communication</p>
                    <p>{device.configuration?.communicationType}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500">Sampling Rate</p>
                    <p>{device.configuration?.samplingRate}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500">Firmware Version</p>
                    <p>{device.configuration?.firmwareVersion}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500">Installation Date</p>
                    <p>{device.installationDate.toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500">Last Calibration</p>
                    <p>{device.configuration?.calibrationDate}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Maintenance Information</h3>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Last Maintenance</span>
                    <span>{device.lastMaintenance.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Next Scheduled Maintenance</span>
                    <span>
                      {new Date(device.lastMaintenance.getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Sensor Replacement Due</span>
                    <span>
                      {new Date(device.installationDate.getTime() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20 shadow-md">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
            <CardTitle>Current Readings</CardTitle>
            <CardDescription>Latest sensor data from {device.name}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="readings">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="readings">Readings</TabsTrigger>
                <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
              </TabsList>

              <TabsContent value="readings" className="space-y-6 pt-4">
                {latestReading ? (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-500">
                      {isOffline ? (
                        <div className="flex items-center text-red-500 mb-2">
                          <WifiOff className="h-4 w-4 mr-2" />
                          <span>Sensor Offline - Last data received: {latestReading.timestamp.toLocaleString()}</span>
                        </div>
                      ) : (
                        <>Last updated: {latestReading.timestamp.toLocaleString()}</>
                      )}
                    </div>

                    {parameters.map((param) => {
                      const value =
                        (latestReading[param.name.toLowerCase() as keyof typeof latestReading] as number) || 0
                      const isLow = value < param.min
                      const isHigh = value > param.max
                      const status = isLow ? "Low" : isHigh ? "High" : "Normal"
                      const statusColor = isLow ? "blue" : isHigh ? "red" : "green"

                      // Calculate percentage for progress bar
                      const range = param.max - param.min
                      const percentage = Math.min(100, Math.max(0, ((value - param.min) / range) * 100))

                      return (
                        <div key={param.name} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className={`font-medium text-${param.color}-700 dark:text-${param.color}-400`}>
                                {param.name}
                              </span>
                              <span className="text-gray-500 text-xs ml-2">({param.description})</span>
                            </div>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800 dark:bg-${statusColor}-900 dark:text-${statusColor}-300`}
                            >
                              {status}
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="w-16 text-right font-medium">
                              {value} {param.unit}
                            </div>
                            <div className="flex-1">
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span>
                                    {param.min} {param.unit}
                                  </span>
                                  <span>
                                    {param.max} {param.unit}
                                  </span>
                                </div>
                                <Progress
                                  value={percentage}
                                  className={`h-2 bg-${param.color}-100 dark:bg-${param.color}-900`}
                                  indicatorClassName={`bg-${param.color}-600 dark:bg-${param.color}-400`}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Settings className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium">No Readings Available</h3>
                    <p className="text-sm text-gray-500 mt-2">This device has not reported any sensor readings yet</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="thresholds" className="space-y-6 pt-4">
                <div className="space-y-4">
                  <div className="text-sm text-gray-500">Configure alarm thresholds for each parameter</div>

                  {parameters.map((param) => {
                    const thresholds = device.configuration?.alarmThresholds[param.name.toLowerCase()] || {
                      min: param.min,
                      max: param.max,
                    }

                    return (
                      <div key={param.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className={`font-medium text-${param.color}-700 dark:text-${param.color}-400`}>
                              {param.name}
                            </span>
                            <span className="text-gray-500 text-xs ml-2">({param.description})</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs text-gray-500">Minimum Threshold</label>
                            <div className="flex items-center">
                              <input
                                type="number"
                                className="w-full rounded-md border border-gray-300 px-3 py-1 text-sm"
                                value={thresholds.min}
                                readOnly
                              />
                              <span className="ml-2 text-xs">{param.unit}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs text-gray-500">Maximum Threshold</label>
                            <div className="flex items-center">
                              <input
                                type="number"
                                className="w-full rounded-md border border-gray-300 px-3 py-1 text-sm"
                                value={thresholds.max}
                                readOnly
                              />
                              <span className="ml-2 text-xs">{param.unit}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  <div className="flex justify-end pt-4">
                    <Button size="sm">
                      <Settings className="mr-2 h-4 w-4" />
                      Edit Thresholds
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
            <Button variant="outline" size="sm" className="w-full">
              View Historical Data
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
      <div className="grid gap-6 mt-6">
        <ChemicalInformationDisplay deviceId={id as string} chemicals={mockChemicalData} />
      </div>
    </div>
  )
}
