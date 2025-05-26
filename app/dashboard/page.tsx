"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/providers/auth-provider"
import { useDeviceSelection } from "@/hooks/use-device-selection"
import { DeviceSelector } from "@/components/device-selector"
import { LiveDataDisplay } from "@/components/live-data-display"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Activity,
  BarChart3,
  Droplet,
  Factory,
  FileText,
  LayoutDashboard,
  RefreshCw,
  Settings,
  Thermometer,
  TestTube,
} from "lucide-react"
import { initDataVerification } from "@/lib/init-data-verification"
import { useLiveData } from "@/hooks/use-live-data"
import { createTestDataForDevice, createTestDataForAllDevices } from "@/lib/test-data-generator"

interface AlertType {
  id: string
  deviceId: string
  parameter: string
  value: number
  threshold: number
  type: "high" | "low"
  timestamp: Date
  status: "active" | "acknowledged" | "resolved"
}

interface PlantStats {
  total: number
  active: number
  inactive: number
  delayed: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { selectedDeviceId, selectedDevice, availableDevices, selectDevice } = useDeviceSelection()

  const [alerts, setAlerts] = useState<AlertType[]>([])
  const [plantStats, setPlantStats] = useState<PlantStats>({ total: 0, active: 0, inactive: 0, delayed: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [generatingTestData, setGeneratingTestData] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // Initialize data verification once on client
  useEffect(() => {
    if (!initialized && typeof window !== "undefined") {
      initDataVerification()
      setInitialized(true)
    }
  }, [initialized])

  // Fetch plant statistics
  useEffect(() => {
    if (!user) return

    const fetchPlantStats = async () => {
      try {
        // Calculate stats based on available devices
        const onlineDevices = availableDevices.filter((device) => device.status === "online").length
        const offlineDevices = availableDevices.filter((device) => device.status === "offline").length
        const maintenanceDevices = availableDevices.filter((device) => device.status === "maintenance").length

        setPlantStats({
          total: availableDevices.length,
          active: onlineDevices,
          inactive: offlineDevices,
          delayed: maintenanceDevices,
        })
        setLoading(false)
      } catch (err) {
        console.error("Error fetching plant statistics:", err)
        setLoading(false)
      }
    }

    fetchPlantStats()
  }, [user, availableDevices])

  // Handle manual refresh - this will just refresh the UI, not generate test data
  const handleRefresh = () => {
    setRefreshing(true)
    // Just refresh the UI components, don't generate test data
    setTimeout(() => setRefreshing(false), 1000)
  }

  // Handle test data generation separately
  const handleGenerateTestData = async () => {
    setGeneratingTestData(true)
    try {
      await createTestDataForAllDevices()
      console.log("Test data generated for all devices")
    } catch (error) {
      console.error("Error generating test data:", error)
    } finally {
      setTimeout(() => setGeneratingTestData(false), 1000)
    }
  }

  // Handle test data generation for selected device only
  const handleGenerateTestDataForDevice = async (deviceId: string) => {
    setGeneratingTestData(true)
    try {
      await createTestDataForDevice(deviceId)
      console.log(`Test data generated for device ${deviceId}`)
    } catch (error) {
      console.error("Error generating test data:", error)
    } finally {
      setTimeout(() => setGeneratingTestData(false), 1000)
    }
  }

  // Loading state
  if (loading && !plantStats.total) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold tracking-tight">Wastewater Monitoring Dashboard</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Wastewater Monitoring Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Real-time monitoring of wastewater treatment parameters</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateTestData}
            disabled={generatingTestData}
            className="bg-amber-50 hover:bg-amber-100 border-amber-200"
          >
            <TestTube className={`mr-2 h-4 w-4 ${generatingTestData ? "animate-spin" : ""}`} />
            {generatingTestData ? "Generating..." : "Generate Test Data"}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/devices">
              <Settings className="mr-2 h-4 w-4" />
              Manage Devices
            </Link>
          </Button>
        </div>
      </div>

      {/* Device Selection */}
      <div className="mb-6">
        <DeviceSelector
          selectedDeviceId={selectedDeviceId}
          availableDevices={availableDevices}
          onDeviceSelect={selectDevice}
          selectedDevice={selectedDevice}
        />
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-3 md:w-[400px]">
          <TabsTrigger value="overview">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="parameters">
            <Activity className="h-4 w-4 mr-2" />
            Parameters
          </TabsTrigger>
          <TabsTrigger value="devices">
            <Factory className="h-4 w-4 mr-2" />
            All Devices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Factory className="h-4 w-4 mr-2 text-blue-500" />
                  Total Devices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{plantStats.total}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-green-500" />
                  Active Devices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{plantStats.active}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950 border-red-200 dark:border-red-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-red-500" />
                  Inactive Devices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{plantStats.inactive}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-amber-500" />
                  Maintenance Due
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{plantStats.delayed}</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main sensor data for selected device */}
            <div className="lg:col-span-2">
              <Card className="border-2 border-primary/20 shadow-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
                      Live Sensor Readings - {selectedDevice?.name}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateTestDataForDevice(selectedDeviceId)}
                      disabled={generatingTestData}
                      className="bg-amber-50 hover:bg-amber-100 border-amber-200"
                    >
                      <TestTube className={`mr-1 h-3 w-3 ${generatingTestData ? "animate-spin" : ""}`} />
                      Test Data
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Real-time monitoring of key wastewater parameters from {selectedDevice?.location}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <ParameterCard
                      deviceId={selectedDeviceId}
                      parameter="pH"
                      icon={<Droplet className="h-5 w-5 text-blue-500" />}
                    />
                    <ParameterCard
                      deviceId={selectedDeviceId}
                      parameter="BOD"
                      icon={<Activity className="h-5 w-5 text-green-500" />}
                    />
                    <ParameterCard
                      deviceId={selectedDeviceId}
                      parameter="COD"
                      icon={<Activity className="h-5 w-5 text-orange-500" />}
                    />
                    <ParameterCard
                      deviceId={selectedDeviceId}
                      parameter="TSS"
                      icon={<BarChart3 className="h-5 w-5 text-purple-500" />}
                    />
                    <ParameterCard
                      deviceId={selectedDeviceId}
                      parameter="flow"
                      icon={<Thermometer className="h-5 w-5 text-red-500" />}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Device status */}
            <div>
              <Card className="border-2 border-primary/20 shadow-md overflow-hidden h-full">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
                  <CardTitle className="flex items-center">
                    <Factory className="h-5 w-5 mr-2 text-blue-500" />
                    Device Status
                  </CardTitle>
                  <CardDescription>Current status of all monitoring devices</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {availableDevices.map((device) => (
                    <div key={device.id} className="mb-4">
                      <Card
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                          selectedDeviceId === device.id ? "ring-2 ring-blue-500" : ""
                        }`}
                        onClick={() => selectDevice(device.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-medium">{device.name}</h3>
                              <p className="text-sm text-gray-500">ID: {device.id}</p>
                              <p className="text-xs text-gray-400">{device.location}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="flex items-center">
                                <span
                                  className={`inline-block w-3 h-3 rounded-full mr-2 ${
                                    device.status === "online"
                                      ? "bg-green-500"
                                      : device.status === "offline"
                                        ? "bg-red-500"
                                        : "bg-amber-500"
                                  }`}
                                ></span>
                                <span
                                  className={`text-sm font-medium ${
                                    device.status === "online"
                                      ? "text-green-500"
                                      : device.status === "offline"
                                        ? "text-red-500"
                                        : "text-amber-500"
                                  }`}
                                >
                                  {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                                </span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleGenerateTestDataForDevice(device.id)
                                }}
                                disabled={generatingTestData}
                                className="text-xs px-2 py-1 h-6"
                              >
                                <TestTube className="h-3 w-3 mr-1" />
                                Test
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                  <Button className="w-full mt-4" variant="outline" asChild>
                    <Link href="/dashboard/devices">View All Devices</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="parameters" className="mt-6">
          <LiveDataDisplay
            deviceId={selectedDeviceId}
            title={`${selectedDevice?.name} - Live Data`}
            className="h-full"
            showDeviceInfo={true}
          />
        </TabsContent>

        <TabsContent value="devices" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableDevices.map((device) => (
              <Card key={device.id} className="border-2 border-primary/20 shadow-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
                  <CardTitle>{device.name}</CardTitle>
                  <CardDescription>Device ID: {device.id}</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <p
                          className={`font-medium ${
                            device.status === "online"
                              ? "text-green-500"
                              : device.status === "offline"
                                ? "text-red-500"
                                : "text-amber-500"
                          }`}
                        >
                          {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium">{device.location}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Last Maintenance</p>
                        <p className="font-medium">{new Date(device.lastMaintenance).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Installation Date</p>
                        <p className="font-medium">{new Date(device.installationDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => selectDevice(device.id)}>
                        Select Device
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateTestDataForDevice(device.id)}
                        disabled={generatingTestData}
                        className="bg-amber-50 hover:bg-amber-100 border-amber-200"
                      >
                        <TestTube className="h-3 w-3 mr-1" />
                        Test Data
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/devices/${device.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Parameter Card Component
function ParameterCard({ deviceId, parameter, icon }: { deviceId: string; parameter: string; icon: React.ReactNode }) {
  const { liveReading, loading, error } = useLiveData(deviceId)

  // Get parameter value
  const value = liveReading && typeof liveReading[parameter] === "number" ? (liveReading[parameter] as number) : null

  // Get parameter label
  const getLabel = () => {
    switch (parameter) {
      case "pH":
        return "pH"
      case "BOD":
        return "BOD (mg/L)"
      case "COD":
        return "COD (mg/L)"
      case "TSS":
        return "TSS (mg/L)"
      case "flow":
        return "Flow Rate (m³/h)"
      case "temperature":
        return "Temperature (°C)"
      default:
        return parameter
    }
  }

  // Get status color
  const getStatusColor = () => {
    if (value === null) return "bg-gray-200 dark:bg-gray-700"

    switch (parameter) {
      case "pH":
        return value < 6.5 || value > 8.5 ? "bg-red-500" : "bg-green-500"
      case "BOD":
        return value > 30 ? "bg-red-500" : "bg-green-500"
      case "COD":
        return value > 250 ? "bg-red-500" : "bg-green-500"
      case "TSS":
        return value > 100 ? "bg-red-500" : "bg-green-500"
      case "temperature":
        return value < 15 || value > 35 ? "bg-red-500" : "bg-green-500"
      default:
        return "bg-blue-500"
    }
  }

  // Format value
  const formattedValue = value !== null ? (parameter === "pH" ? value.toFixed(1) : Math.round(value).toString()) : "N/A"

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          {icon}
          <h3 className="font-medium ml-2">{getLabel()}</h3>
        </div>
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
      </div>

      {loading ? (
        <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
      ) : error ? (
        <div className="text-red-500 text-sm">Error loading data</div>
      ) : (
        <div className="text-2xl font-bold">{formattedValue}</div>
      )}
    </div>
  )
}
