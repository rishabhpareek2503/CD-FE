"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, AlertCircle, Upload, Settings, Bell } from "lucide-react"
import { ref, onValue } from "firebase/database"

import { useDevices } from "@/providers/device-provider"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { diagnoseFaults, type FaultDiagnosisResult } from "@/lib/fault-diagnosis-service"
import { realtimeDb } from "@/lib/firebase"
import NotificationService from "@/lib/notification-service"
import { toast } from "@/components/ui/use-toast"

export default function FaultDiagnosisPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { devices, loading } = useDevices()
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("")
  const [diagnosisMode, setDiagnosisMode] = useState<"device" | "manual">("device")
  const [manualData, setManualData] = useState({
    pH: 7.0,
    temperature: 45,
    tss: 150,
    cod: 350,
    bod: 120,
    hardness: 200,
  })
  const [faultDiagnosis, setFaultDiagnosis] = useState<FaultDiagnosisResult | null>(null)
  const [notificationSent, setNotificationSent] = useState(false)

  const showNotificationToast = (severity: string) => {
    toast({
      title: "Notification Sent",
      description: `A ${severity} severity alert has been sent to registered devices`,
      variant: severity === "high" ? "destructive" : severity === "medium" ? "default" : "secondary",
      duration: 5000,
    })
  }

  const sendManualNotification = async () => {
    if (!faultDiagnosis || !faultDiagnosis.hasFault || !user) return

    const deviceName = selectedDeviceId
      ? devices.find((d) => d.id === selectedDeviceId)?.name || selectedDeviceId
      : "Manual Input"

    // Send notification
    const notificationService = NotificationService.getInstance()
    notificationService.addNotification({
      title: `${faultDiagnosis.severity.toUpperCase()} Fault Detected`,
      message: `${faultDiagnosis.faults.length} issue(s) found in ${deviceName}`,
      level:
        faultDiagnosis.severity === "high" ? "critical" : faultDiagnosis.severity === "medium" ? "warning" : "info",
      deviceId: selectedDeviceId || "manual",
    })

    // Show toast notification
    showNotificationToast(faultDiagnosis.severity)
    setNotificationSent(true)

    // Log notification
    console.log("Manual notification sent for fault diagnosis")
  }

  useEffect(() => {
    if (selectedDeviceId && diagnosisMode === "device") {
      // Reference to the device data in Realtime Database
      const deviceRef = ref(realtimeDb, `HMI_Sensor_Data/${selectedDeviceId}`)

      const unsubscribe = onValue(
        deviceRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            console.log("Device data for diagnosis:", data)

            // Convert to the format expected by diagnoseFaults
            const processParameters = {
              pH: data.PH || 7,
              temperature: data.Temperature || 45,
              tss: data.TSS || 150,
              cod: data.COD || 350,
              bod: data.BOD || 120,
              hardness: data.Hardness || 200,
            }

            // Run diagnosis
            const diagnosisResult = diagnoseFaults(processParameters)
            setFaultDiagnosis(diagnosisResult)
            setNotificationSent(false)

            // Send notification if faults are detected
            if (diagnosisResult.hasFault && diagnosisResult.severity === "high" && user) {
              const selectedDevice = devices.find((d) => d.id === selectedDeviceId)
              const deviceName = selectedDevice ? selectedDevice.name : selectedDeviceId

              // Send notification
              const notificationService = NotificationService.getInstance()
              notificationService.addNotification({
                title: "Critical Fault Detected",
                message: `${diagnosisResult.faults.length} critical issue(s) found in device ${deviceName}`,
                level: "critical",
                deviceId: selectedDeviceId,
              })

              // Show toast notification
              showNotificationToast(diagnosisResult.severity)
              setNotificationSent(true)

              console.log("Notification sent for critical fault")
            }
          } else {
            console.log("No data available for this device")
            setFaultDiagnosis(null)
          }
        },
        (error) => {
          console.error("Error fetching device data:", error)
        },
      )

      return () => unsubscribe()
    }
  }, [selectedDeviceId, diagnosisMode, devices, user])

  const handleManualInputChange = (key: string, value: number) => {
    setManualData((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleManualDiagnosis = () => {
    const diagnosisResult = diagnoseFaults(manualData)
    setFaultDiagnosis(diagnosisResult)
    setNotificationSent(false)
  }

  // Loading state
  if (loading && diagnosisMode === "device") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-[600px] w-full" />
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
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-red-600 to-amber-500 bg-clip-text text-transparent flex items-center">
            <AlertCircle className="mr-2 h-6 w-6 text-red-600 dark:text-red-400" />
            Fault Diagnosis
          </h1>
        </div>
      </div>

      <Card className="border-2 border-red-200 dark:border-red-800 shadow-md">
        <CardHeader className="bg-gradient-to-r from-red-50 to-amber-50 dark:from-red-950 dark:to-amber-950">
          <CardTitle>Diagnosis Mode</CardTitle>
          <CardDescription>Choose how you want to perform fault diagnosis</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <Tabs value={diagnosisMode} onValueChange={(value) => setDiagnosisMode(value as "device" | "manual")}>
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="device">
                <Settings className="mr-2 h-4 w-4" />
                Device Data
              </TabsTrigger>
              <TabsTrigger value="manual">
                <Upload className="mr-2 h-4 w-4" />
                Manual Input
              </TabsTrigger>
            </TabsList>
            <TabsContent value="device" className="pt-4">
              <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a device" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.name} ({device.serialNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TabsContent>
            <TabsContent value="manual" className="pt-4">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ph">Water pH: {manualData.pH}</Label>
                    <Slider
                      id="ph"
                      min={4}
                      max={10}
                      step={0.1}
                      value={[manualData.pH]}
                      onValueChange={(value) => handleManualInputChange("pH", value[0])}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hardness">Water Hardness (ppm): {manualData.hardness}</Label>
                    <Slider
                      id="hardness"
                      min={50}
                      max={500}
                      step={10}
                      value={[manualData.hardness]}
                      onValueChange={(value) => handleManualInputChange("hardness", value[0])}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperature (°C): {manualData.temperature}</Label>
                    <Slider
                      id="temperature"
                      min={20}
                      max={90}
                      step={1}
                      value={[manualData.temperature]}
                      onValueChange={(value) => handleManualInputChange("temperature", value[0])}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tss">TSS (mg/L): {manualData.tss}</Label>
                    <Slider
                      id="tss"
                      min={50}
                      max={300}
                      step={5}
                      value={[manualData.tss]}
                      onValueChange={(value) => handleManualInputChange("tss", value[0])}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cod">COD (mg/L): {manualData.cod}</Label>
                    <Slider
                      id="cod"
                      min={100}
                      max={600}
                      step={10}
                      value={[manualData.cod]}
                      onValueChange={(value) => handleManualInputChange("cod", value[0])}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bod">BOD (mg/L): {manualData.bod}</Label>
                    <Slider
                      id="bod"
                      min={30}
                      max={200}
                      step={5}
                      value={[manualData.bod]}
                      onValueChange={(value) => handleManualInputChange("bod", value[0])}
                    />
                  </div>
                </div>
                <Button onClick={handleManualDiagnosis} className="w-full bg-red-600 hover:bg-red-700 text-white">
                  Run Diagnosis
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {faultDiagnosis && (
        <Card className="border-2 border-amber-200 dark:border-amber-800 shadow-md">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950">
            <div className="flex justify-between items-center">
              <CardTitle>Diagnosis Results</CardTitle>
              <div className="flex items-center gap-2">
                {faultDiagnosis.hasFault && !notificationSent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={sendManualNotification}
                    className="flex items-center gap-1"
                  >
                    <Bell className="h-4 w-4" />
                    Send Alert
                  </Button>
                )}
                {notificationSent && (
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                  >
                    Alert Sent
                  </Badge>
                )}
                <Badge
                  variant={
                    faultDiagnosis.hasFault
                      ? faultDiagnosis.severity === "high"
                        ? "destructive"
                        : faultDiagnosis.severity === "medium"
                          ? "default"
                          : "outline"
                      : "success"
                  }
                  className={faultDiagnosis.hasFault ? "" : "bg-green-500 hover:bg-green-600"}
                >
                  {faultDiagnosis.hasFault
                    ? `${faultDiagnosis.severity.toUpperCase()} SEVERITY`
                    : "ALL PARAMETERS NORMAL"}
                </Badge>
              </div>
            </div>
            <CardDescription>
              {faultDiagnosis.hasFault ? `${faultDiagnosis.faults.length} issue(s) detected` : "No issues detected"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {faultDiagnosis.hasFault ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  {faultDiagnosis.faults.map((fault, index) => (
                    <Alert
                      key={index}
                      variant={
                        fault.severity === "high" ? "destructive" : fault.severity === "medium" ? "default" : "outline"
                      }
                      className={
                        fault.severity === "high"
                          ? "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800"
                          : fault.severity === "medium"
                            ? "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800"
                            : "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800"
                      }
                    >
                      <AlertTitle className="flex items-center gap-2">
                        {fault.parameter} Issue
                        <Badge
                          variant={
                            fault.severity === "high"
                              ? "destructive"
                              : fault.severity === "medium"
                                ? "default"
                                : "outline"
                          }
                        >
                          {fault.severity}
                        </Badge>
                      </AlertTitle>
                      <AlertDescription className="space-y-1">
                        <p>{fault.description}</p>
                        <p className="text-sm opacity-80">Impact: {fault.impact}</p>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 border border-amber-100 dark:border-amber-900">
                  <h4 className="font-medium text-amber-700 dark:text-amber-300 mb-2">Recommendations</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {faultDiagnosis.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-3 mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-600 dark:text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-700 dark:text-green-300 font-medium">All parameters within normal range</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No issues detected</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
