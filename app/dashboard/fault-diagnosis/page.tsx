"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, AlertCircle, Upload, Settings, Bell, Gauge } from "lucide-react"
import { ref, onValue } from "firebase/database"
import { useDevices } from "@/providers/device-provider"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { diagnoseFaults, type FaultDiagnosisResult } from "@/lib/fault-diagnosis-service"
import { realtimeDb } from "@/lib/firebase"
import NotificationService from "@/lib/notification-service"
import { toast } from "@/components/ui/use-toast"
// Add type for pump data
interface PumpData {
  "Current_(A)": number;
  "Current_(A)_Alarm": boolean;
  "Pressure_(bar)": number;
  "Pressure_(bar)_Alarm": boolean;
  "Flow_Rate_(m3/h)": number;
  "Flow_Rate_(m3/h)_Alarm": boolean;
  "Vibration_(mm/s)": number;
  "Vibration_(mm/s)_Alarm": boolean;
  "Temperature_(°C)": number;
  "Temperature_(°C)_Alarm": boolean;
}

// Add these types
interface SensorData {
  Current: number;
  Pressure: number;
  FlowRate: number;
  Vibration: number;
  Temperature: number;
}

interface Range {
  min: number;
  max: number;
}

// Add these constants at the top level, after interfaces
// Update these constants with the provided ranges
const normalRanges = {
  Current: { min: 25.04, max: 75.05 },     // Amperes
  Pressure: { min: 1.58, max: 4.59 },      // Bar
  FlowRate: { min: 20.27, max: 60.29 },    // m³/h
  Vibration: { min: 1.38, max: 3.89 },     // mm/s
  Temperature: { min: 20.06, max: 60.06 },  // °C
};

// Add these utility functions
const isAbnormal = (value: number, range: { min: number; max: number }) => {
  return value < range.min || value > range.max;
};

const getFaultPrediction = (param: string, value: number) => {
  switch (param) {
    case "Current":
      return value < normalRanges.Current.min 
        ? "⚡ Current too low — Possible underload or faulty sensor."
        : "⚡ Current too high — Possible overload or short circuit.";
    case "Pressure":
      return value < normalRanges.Pressure.min
        ? "🧯 Pressure too low — Could be a leak or suction issue."
        : "🧯 Pressure too high — May indicate clog or valve blockage.";
    case "FlowRate":
      // Only report high flow as a fault, low flow is considered normal
      return value > normalRanges.FlowRate.max
        ? `💧 Flow rate too high (${value.toFixed(2)} m³/h). Could suggest overflow or calibration issue.`
        : null; // Return null for low flow to indicate it's normal
    case "Vibration":
      return value < normalRanges.Vibration.min
        ? "📈 Vibration too low — Could mean sensor error or idle equipment."
        : "📈 Vibration too high — Likely imbalance or mechanical damage.";
    case "Temperature":
      return value < normalRanges.Temperature.min
        ? "🌡️ Temperature too low — Check ambient conditions or sensor issues."
        : "🌡️ Temperature too high — Check for cooling failure or overload.";
    default:
      return "Unknown Fault";
  }
};

// Add plantCapacity to your component state
export default function FaultDiagnosisPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { devices, loading: devicesLoading } = useDevices()
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("")
  const [deviceData, setDeviceData] = useState<any>(null)
  const [diagnosisMode, setDiagnosisMode] = useState<"device" | "manual" | "pump">("manual")
  const [manualData, setManualData] = useState({
    Current: 2.6,
    Pressure: 130,
    FlowRate: 25,
    Vibration: 0.3,
    Temperature: 70,
  })

  // Add these new states at the top level of the component
  const [ranges, setRanges] = useState<Record<string, Range>>({})
  const [sensorData, setSensorData] = useState<SensorData>({
    Current: 2.6,
    Pressure: 130,
    FlowRate: 25,
    Vibration: 0.3,
    Temperature: 70,
  })
  const [faults, setFaults] = useState<string[]>([])
  const [faultDiagnosis, setFaultDiagnosis] = useState<FaultDiagnosisResult | null>(null)
  const [notificationSent, setNotificationSent] = useState(false)

  const analyzePumpStatus = (sensorData: PumpData): string[] => {
    const faults = [];
  
    const {
      "Current_(A)": current,
      "Pressure_(bar)": pressure,
      "Flow_Rate_(m3/h)": flow,
      "Vibration_(mm/s)": vibration,
      "Temperature_(°C)": temperature,
    } = sensorData;
  
    // 1. Current Check
  if (current < 25.04) {
    faults.push("⚡ Current too low — Possible underload or faulty sensor.");
  } else if (current > 75.05) {
    faults.push("⚡ Current too high — Possible overload or short circuit.");
  }

  // 2. Pressure Check
  if (pressure < 1.58) {
    faults.push("🧯 Pressure too low — Could be a leak or suction issue.");
  } else if (pressure > 4.59) {
    faults.push("🧯 Pressure too high — May indicate clog or valve blockage.");
  }

  // In the diagnosePumpData function, update the flow rate check
  // 3. Flow Rate Check (dynamic based on plant capacity)
  const expectedFlow = plantCapacity / 20;
  const minFlow = expectedFlow * 0.9;
  const maxFlow = expectedFlow * 1.1;
  
  // Only check for high flow, low flow is considered normal
  if (flow > maxFlow) {
    faults.push(
      `💧 Flow rate too high (${flow.toFixed(2)} m³/h). Expected: ${expectedFlow.toFixed(2)} m³/h. Could suggest overflow or calibration issue.`
    );
  }

  // 4. Vibration Check
  if (vibration < 1.38) {
    faults.push("📈 Vibration too low — Could mean sensor error or idle equipment.");
  } else if (vibration > 3.89) {
    faults.push("📈 Vibration too high — Likely imbalance or mechanical damage.");
  }

  // 5. Temperature Check
  if (temperature < 20.06) {
    faults.push("🌡️ Temperature too low — Check ambient conditions or sensor issues.");
  } else if (temperature > 60.06) {
    faults.push("🌡️ Temperature too high — Check for cooling failure or overload.");
  }

  return faults;
};


  // Also update the checkForFaults function to use plant capacity
  const checkForFaults = () => {
    const detected: string[] = [];
    
    // Special handling for FlowRate based on plant capacity
    const expectedFlow = plantCapacity / 20;
    const minFlow = expectedFlow * 0.9;
    const maxFlow = expectedFlow * 1.1;
    
    Object.entries(sensorData).forEach(([key, value]) => {
      if (key === "FlowRate") {
        // Only check for high flow rate, low flow is considered normal
        if (value > maxFlow) {
          detected.push(
            `FlowRate: ${value.toFixed(2)} - 💧 Flow rate too high. Expected: ${expectedFlow.toFixed(2)} m³/h.`
          );
        }
      } else {
        const range = normalRanges[key as keyof typeof normalRanges];
        if (isAbnormal(value, range)) {
          const prediction = getFaultPrediction(key, value);
          if (prediction) { // Only add if prediction is not null
            detected.push(`${key}: ${value} - ${prediction}`);
          }
        }
      }
    });
    
    setFaults(detected);
  };

  const showNotificationToast = (severity: string) => {
    toast({
      title: "Notification Sent",
      description: `A ${severity} severity alert has been sent to registered devices`,
      variant: severity === "high" ? "destructive" : severity === "medium" ? "default" : undefined,
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

            const processParameters = {
              Current: data.Current || 50,
              Pressure: data.Pressure || 3,
              FlowRate: data.FlowRate || 40,
              Vibration: data.Vibration || 2.5,
              Temperature: data.Temperature || 40,
            }
            
            // Use diagnosePumpData instead of diagnoseFaults
            const faults = diagnosePumpData(processParameters, plantCapacity)
            
            // Create a diagnosis result object
            const diagnosisResult = {
              hasFault: faults.length > 0 && !faults[0].includes("normal"),
              severity: faults.length > 2 ? "high" : faults.length > 0 ? "medium" : "low",
              faults: faults,
            }
            
          

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

  const handleSensorDataChange = (key: keyof SensorData, value: number) => {
    setSensorData((prev) => ({
      ...prev,
      [key]: value,
    }))
    // Trigger fault check after updating sensor data
    checkForFaults()
  }

  // Add real-time simulation for the pump tab
  useEffect(() => {
    if (diagnosisMode === "pump") {
      const interval = setInterval(() => {
        const newData = {
          Current: +(Math.random() * 25).toFixed(1),
          Pressure: +(Math.random() * 6).toFixed(1),
          FlowRate: +(Math.random() * 120).toFixed(1),
          Vibration: +(Math.random() * 5).toFixed(1),
          Temperature: +(Math.random() * 80).toFixed(1),
        };
        setSensorData(newData);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [diagnosisMode]);

  // Add useEffect to check faults whenever sensorData changes
  useEffect(() => {
    checkForFaults();
  }, [sensorData]);

  const [plantCapacity, setPlantCapacity] = useState(1200);

  const handlePlantCapacityChange = (value: number) => {
    setPlantCapacity(value);
    checkForFaults(); // Recalculate faults with new capacity
  };

  // Fetch device data when selected device changes
  useEffect(() => {
    if (selectedDeviceId && diagnosisMode === 'device') {
      const deviceRef = ref(realtimeDb, `HMI_Sensor_Data/${selectedDeviceId}`)
      
      const unsubscribe = onValue(deviceRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val()
          setDeviceData(data)
          
          // Update sensor data state with device data
          setSensorData({
            Current: data.Current || 0,
            Pressure: data.Pressure || 0,
            FlowRate: data.FlowRate || 0,
            Vibration: data.Vibration || 0,
            Temperature: data.Temperature || 0,
          })
          
          // Update ranges based on device data
          setRanges({
            Current: { min: 0, max: 100 },
            Pressure: { min: 0, max: 10 },
            FlowRate: { min: 0, max: 150 },
            Vibration: { min: 0, max: 10 },
            Temperature: { min: 0, max: 100 },
          })
        } else {
          setDeviceData(null)
          // Reset to default values if no data
          setSensorData({
            Current: 0,
            Pressure: 0,
            FlowRate: 0,
            Vibration: 0,
            Temperature: 0,
          })
        }
      }, (error) => {
        console.error('Error fetching device data:', error)
        setDeviceData(null)
      })
      
      return () => unsubscribe()
    } else {
      setDeviceData(null)
    }
  }, [selectedDeviceId, diagnosisMode])

  // Update the TabsContent for pump status
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
          <Tabs value={diagnosisMode} onValueChange={(value) => setDiagnosisMode(value as "device" | "manual" | "pump")}>
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="device">
                <Settings className="mr-2 h-4 w-4" />
                Device Data
              </TabsTrigger>
              <TabsTrigger value="manual">
                <Upload className="mr-2 h-4 w-4" />
                Manual Input
              </TabsTrigger>
              <TabsTrigger value="pump">
                <Gauge className="mr-2 h-4 w-4" />
                Pump Status
              </TabsTrigger>
            </TabsList>
            <TabsContent value="device" className="pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Device</Label>
                  <Select 
                    value={selectedDeviceId} 
                    onValueChange={setSelectedDeviceId}
                    disabled={devicesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        devicesLoading ? "Loading devices..." : "Select a device"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {devicesLoading ? (
                        <div className="py-2 text-center text-sm text-muted-foreground">
                          Loading devices...
                        </div>
                      ) : (
                        devices.map((device) => (
                          <SelectItem key={device.id} value={device.id}>
                            {device.name} ({device.serialNumber})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {deviceData ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Device Status</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries({
                          'Current (A)': sensorData.Current?.toFixed(2) || 'N/A',
                          'Pressure (bar)': sensorData.Pressure?.toFixed(2) || 'N/A',
                          'Flow Rate (m³/h)': sensorData.FlowRate?.toFixed(2) || 'N/A',
                          'Vibration (mm/s)': sensorData.Vibration?.toFixed(2) || 'N/A',
                          'Temperature (°C)': sensorData.Temperature?.toFixed(2) || 'N/A'
                        }).map(([label, value]) => (
                          <div key={label} className="p-4 border rounded-lg bg-card">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-muted-foreground">
                                {label}
                              </span>
                              <span className="text-lg font-semibold">
                                {value}
                              </span>
                            </div>
                            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min(100, Math.max(0, parseFloat(value) || 0))}%`
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {faults.length > 0 && (
                      <Alert variant="destructive" className="animate-pulse">
                        <AlertCircle className="h-5 w-5" />
                        <AlertTitle>Potential Issues Detected</AlertTitle>
                        <AlertDescription className="space-y-2">
                          <ul className="list-disc pl-5 space-y-1">
                            {faults.map((fault, i) => (
                              <li key={i}>{fault}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {faults.length === 0 && (
                      <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                        <AlertCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <AlertTitle>Device Operating Normally</AlertTitle>
                        <AlertDescription>
                          All parameters are within normal operating ranges.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : selectedDeviceId ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <AlertCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">No Data Available</h3>
                    <p className="text-sm text-muted-foreground">
                      {devicesLoading ? 'Loading device data...' : 'No data received from this device yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <Settings className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">Select a Device</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose a device from the dropdown to view real-time data and diagnostics.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="manual" className="pt-4">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.keys(sensorData).map((key) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key}>{key}: {sensorData[key as keyof SensorData]}</Label>
                      <Slider
                        id={key}
                        min={ranges[key]?.min || 0}
                        max={ranges[key]?.max || 1000}
                        step={0.1}
                        value={[sensorData[key as keyof SensorData]]}
                        onValueChange={(value) => handleSensorDataChange(key as keyof SensorData, value[0])}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  {faults.length > 0 ? (
                    <Alert variant="destructive">
                      <AlertTitle>⚠️ Fault Detected in:</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc ml-5">
                          {faults.map((f) => (
                            <li key={f}>{f}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="default" className="bg-green-100 dark:bg-green-900">
                      <AlertTitle>✅ All Parameters Normal</AlertTitle>
                      <AlertDescription>No faults detected in the system</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="pump" className="pt-4">
              <div className="space-y-6">
                <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
                  <Label htmlFor="plantCapacity" className="text-lg font-semibold">
                    Plant Capacity (m³/day)
                  </Label>
                  <div className="flex gap-4 items-center mt-2">
                    <Slider
                      id="plantCapacity"
                      min={100}
                      max={5000}
                      step={100}
                      value={[plantCapacity]}
                      onValueChange={(value) => handlePlantCapacityChange(value[0])}
                    />
                    <span className="min-w-[80px] text-right">{plantCapacity}</span>
                  </div>
                </div>
            
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(sensorData).map(([key, value]) => (
                    <div key={key} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
                      <div className="flex justify-between items-center">
                        <Label className="text-lg font-semibold">{key}</Label>
                        <span className={isAbnormal(value, normalRanges[key as keyof typeof normalRanges]) 
                          ? "text-red-500 dark:text-red-400" 
                          : "text-green-500 dark:text-green-400"
                        }>
                          {value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
            
                <div className="mt-6">
                  {faults.length > 0 ? (
                    <Alert variant="destructive">
                      <AlertTitle>⚠️ Faults Detected:</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc ml-5 space-y-2">
                          {faults.map((fault, index) => (
                            <li key={index}>{fault}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="default" className="bg-green-100 dark:bg-green-900">
                      <AlertTitle>✅ System Status Normal</AlertTitle>
                      <AlertDescription>All parameters are within acceptable ranges</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// Move the diagnosePumpData function before the component
const diagnosePumpData = (data: SensorData, plantCapacity: number): string[] => {
  const faults = [];

  const current = parseFloat(data.Current.toString());
  const pressure = parseFloat(data.Pressure.toString());
  const flow = parseFloat(data.FlowRate.toString());
  const vibration = parseFloat(data.Vibration.toString());
  const temperature = parseFloat(data.Temperature.toString());

  // 1. Current Check
  if (current < 25.04) {
    faults.push("⚡ Current too low — Possible underload or faulty sensor.");
  } else if (current > 75.05) {
    faults.push("⚡ Current too high — Possible overload or short circuit.");
  }

  // 2. Pressure Check
  if (pressure < 1.58) {
    faults.push("🧯 Pressure too low — Could be a leak or suction issue.");
  } else if (pressure > 4.59) {
    faults.push("🧯 Pressure too high — May indicate clog or valve blockage.");
  }

  // 3. Flow Rate Check (dynamic based on plant capacity)
  const expectedFlow = plantCapacity / 20;
  const minFlow = expectedFlow * 0.9;
  const maxFlow = expectedFlow * 1.1;

  if (flow < minFlow) {
    faults.push(
      `💧 Flow rate too low (${flow.toFixed(2)} m³/h). Expected: ${expectedFlow.toFixed(2)} m³/h. May indicate blockage or low input.`
    );
  } else if (flow > maxFlow) {
    faults.push(
      `💧 Flow rate too high (${flow.toFixed(2)} m³/h). Expected: ${expectedFlow.toFixed(2)} m³/h. Could suggest overflow or calibration issue.`
    );
  }

  // 4. Vibration Check
  if (vibration < 1.38) {
    faults.push("📈 Vibration too low — Could mean sensor error or idle equipment.");
  } else if (vibration > 3.89) {
    faults.push("📈 Vibration too high — Likely imbalance or mechanical damage.");
  }

  // 5. Temperature Check
  if (temperature < 20.06) {
    faults.push("🌡️ Temperature too low — Check ambient conditions or sensor issues.");
  } else if (temperature > 60.06) {
    faults.push("🌡️ Temperature too high — Check for cooling failure or overload.");
  }

  return faults;
};