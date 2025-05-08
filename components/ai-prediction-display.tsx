"use client"

import { useEffect, useState, type FormEvent } from "react"
import { ref, onValue } from "firebase/database"
import {
  Brain,
  Beaker,
  AlertTriangle,
  Loader2,
  BarChart,
  FlaskRoundIcon as Flask,
  Droplets,
  Thermometer,
  Waves,
  Gauge,
} from "lucide-react"

import { realtimeDb } from "@/lib/firebase"
import { getPrediction } from "@/lib/ai-prediction-service"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Slider } from "@/components/ui/slider"

interface SensorData {
  pH: number
  BOD: number
  COD: number
  TSS: number
  Flow: number
  Temperature: number
  DO: number
  Conductivity: number
  Turbidity: number
}

interface Prediction {
  chemical: string
  quantity: number
  dosageUnit: string
  fault: string | null
  efficiency: number
  timestamp: string
}

interface AIPredictionDisplayProps {
  deviceId?: string
  mode?: "auto" | "manual"
}

export function AIPredictionDisplay({ deviceId = "RPi001", mode = "auto" }: AIPredictionDisplayProps) {
  const [sensorData, setSensorData] = useState<SensorData | null>(null)
  const [manualData, setManualData] = useState<SensorData>({
    pH: 7.0,
    BOD: 120,
    COD: 350,
    TSS: 150,
    Flow: 100,
    Temperature: 45,
    DO: 5,
    Conductivity: 500,
    Turbidity: 20,
  })
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Fetch sensor data when in auto mode
  useEffect(() => {
    if (mode !== "auto" || !deviceId) return

    // Reference to the device data in Realtime Database
    const deviceRef = ref(realtimeDb, `HMI_Sensor_Data/${deviceId}/Live`)
    console.log("Setting up AI prediction listener at path:", `HMI_Sensor_Data/${deviceId}/Live`)

    const unsubscribe = onValue(
      deviceRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val()
          console.log("Sensor data for prediction:", data)

          // Create a standardized sensor data object
          const sensorData: SensorData = {
            pH: Number.parseFloat(data.PH || "7"),
            BOD: Number.parseFloat(data.BOD || "120"),
            COD: Number.parseFloat(data.COD || "350"),
            TSS: Number.parseFloat(data.TSS || "150"),
            Flow: Number.parseFloat(data.Flow || "100"),
            Temperature: Number.parseFloat(data.Temperature || "45"),
            DO: Number.parseFloat(data.DO || "5"),
            Conductivity: Number.parseFloat(data.Conductivity || "500"),
            Turbidity: Number.parseFloat(data.Turbidity || "20"),
          }

          setSensorData(sensorData)
          setLastUpdated(new Date())

          // Send data to backend for prediction
          fetchPrediction(sensorData)
        } else {
          console.log("No data available for this device")
          setError("No sensor data available for this device")

          // Use default values for prediction
          const defaultData: SensorData = {
            pH: 7.0,
            BOD: 120,
            COD: 350,
            TSS: 150,
            Flow: 100,
            Temperature: 45,
            DO: 5,
            Conductivity: 500,
            Turbidity: 20,
          }

          setSensorData(defaultData)
          fetchPrediction(defaultData)
        }
      },
      (error) => {
        console.error("Error fetching sensor data:", error)
        setError("Failed to fetch sensor data: " + error.message)

        // Use default values for prediction
        const defaultData: SensorData = {
          pH: 7.0,
          BOD: 120,
          COD: 350,
          TSS: 150,
          Flow: 100,
          Temperature: 45,
          DO: 5,
          Conductivity: 500,
          Turbidity: 20,
        }

        setSensorData(defaultData)
        fetchPrediction(defaultData)
      },
    )

    return () => unsubscribe()
  }, [deviceId, mode])

  const fetchPrediction = async (data: SensorData) => {
    try {
      setLoading(true)
      setError(null)

      // Call the prediction service
      const result = await getPrediction(data)
      setPrediction(result)
      setLoading(false)

      toast({
        title: "Prediction Successful",
        description: `Recommended ${result.chemical} with dosage ${result.quantity.toFixed(2)} ${result.dosageUnit}`,
      })
    } catch (err: any) {
      console.error("Error fetching prediction:", err)
      setError("Failed to get AI prediction: " + (err.message || "Please try again."))
      setLoading(false)

      toast({
        title: "Prediction Failed",
        description: "Could not get prediction from the service. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleManualInputChange = (name: keyof SensorData, value: number) => {
    setManualData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleManualSubmit = (e: FormEvent) => {
    e.preventDefault()
    fetchPrediction(manualData)
  }

  // Loading state
  if (mode === "auto" && !sensorData && !error) {
    return (
      <Card className="border-2 border-primary/20 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950">
          <CardTitle className="flex items-center">
            <Brain className="mr-2 h-5 w-5 text-purple-600 dark:text-purple-400" />
            AI Prediction
          </CardTitle>
          <CardDescription>Loading sensor data...</CardDescription>
        </CardHeader>
        <CardContent className="p-6 flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error && mode === "auto" && !sensorData) {
    return (
      <Card className="border-2 border-red-200 dark:border-red-800 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
          <CardTitle className="flex items-center text-red-700 dark:text-red-400">
            <AlertTriangle className="mr-2 h-5 w-5" />
            AI Prediction Error
          </CardTitle>
          <CardDescription className="text-red-600 dark:text-red-400">Could not generate prediction</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
          <Button onClick={() => setError(null)} variant="outline" className="w-full">
            Try Again
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <Brain className="mr-2 h-5 w-5 text-purple-600 dark:text-purple-400" />
              AI Wastewater Treatment Analysis
            </CardTitle>
            <CardDescription>
              {mode === "auto"
                ? `Based on real-time sensor data from ${new Date(lastUpdated).toLocaleTimeString()}`
                : "Based on manually entered parameters"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 text-purple-600 dark:text-purple-400 animate-spin mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Analyzing data...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {mode === "manual" && (
              <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-6 border border-purple-100 dark:border-purple-900">
                <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-4 flex items-center">
                  <Flask className="mr-2 h-5 w-5" />
                  Enter Wastewater Parameters
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Adjust the sliders below to set your wastewater parameters and generate a chemical dosage prediction.
                </p>

                <form onSubmit={handleManualSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* pH Parameter */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pH" className="text-sm font-medium flex items-center">
                          <Droplets className="h-4 w-4 mr-2 text-blue-500" />
                          Water pH
                        </Label>
                        <span className="text-sm font-bold bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded-md">
                          {manualData.pH.toFixed(1)}
                        </span>
                      </div>
                      <Slider
                        id="pH"
                        min={0}
                        max={14}
                        step={0.1}
                        value={[manualData.pH]}
                        onValueChange={(values) => handleManualInputChange("pH", values[0])}
                        className="py-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Acidic (0)</span>
                        <span>Neutral (7)</span>
                        <span>Alkaline (14)</span>
                      </div>
                    </div>

                    {/* Temperature Parameter */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="Temperature" className="text-sm font-medium flex items-center">
                          <Thermometer className="h-4 w-4 mr-2 text-red-500" />
                          Temperature (°C)
                        </Label>
                        <span className="text-sm font-bold bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded-md">
                          {manualData.Temperature.toFixed(1)} °C
                        </span>
                      </div>
                      <Slider
                        id="Temperature"
                        min={10}
                        max={80}
                        step={0.5}
                        value={[manualData.Temperature]}
                        onValueChange={(values) => handleManualInputChange("Temperature", values[0])}
                        className="py-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>10°C</span>
                        <span>45°C</span>
                        <span>80°C</span>
                      </div>
                    </div>

                    {/* BOD Parameter */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="BOD" className="text-sm font-medium flex items-center">
                          <Beaker className="h-4 w-4 mr-2 text-green-500" />
                          BOD (mg/L)
                        </Label>
                        <span className="text-sm font-bold bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded-md">
                          {manualData.BOD.toFixed(0)} mg/L
                        </span>
                      </div>
                      <Slider
                        id="BOD"
                        min={10}
                        max={500}
                        step={5}
                        value={[manualData.BOD]}
                        onValueChange={(values) => handleManualInputChange("BOD", values[0])}
                        className="py-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Low (10)</span>
                        <span>Medium (250)</span>
                        <span>High (500)</span>
                      </div>
                    </div>

                    {/* COD Parameter */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="COD" className="text-sm font-medium flex items-center">
                          <Beaker className="h-4 w-4 mr-2 text-yellow-500" />
                          COD (mg/L)
                        </Label>
                        <span className="text-sm font-bold bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded-md">
                          {manualData.COD.toFixed(0)} mg/L
                        </span>
                      </div>
                      <Slider
                        id="COD"
                        min={50}
                        max={1000}
                        step={10}
                        value={[manualData.COD]}
                        onValueChange={(values) => handleManualInputChange("COD", values[0])}
                        className="py-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Low (50)</span>
                        <span>Medium (500)</span>
                        <span>High (1000)</span>
                      </div>
                    </div>

                    {/* TSS Parameter */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="TSS" className="text-sm font-medium flex items-center">
                          <Waves className="h-4 w-4 mr-2 text-gray-500" />
                          TSS (mg/L)
                        </Label>
                        <span className="text-sm font-bold bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded-md">
                          {manualData.TSS.toFixed(0)} mg/L
                        </span>
                      </div>
                      <Slider
                        id="TSS"
                        min={10}
                        max={500}
                        step={5}
                        value={[manualData.TSS]}
                        onValueChange={(values) => handleManualInputChange("TSS", values[0])}
                        className="py-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Low (10)</span>
                        <span>Medium (250)</span>
                        <span>High (500)</span>
                      </div>
                    </div>

                    {/* Flow Parameter */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="Flow" className="text-sm font-medium flex items-center">
                          <Gauge className="h-4 w-4 mr-2 text-blue-500" />
                          Flow Rate (m³/hr)
                        </Label>
                        <span className="text-sm font-bold bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded-md">
                          {manualData.Flow.toFixed(0)} m³/hr
                        </span>
                      </div>
                      <Slider
                        id="Flow"
                        min={10}
                        max={500}
                        step={5}
                        value={[manualData.Flow]}
                        onValueChange={(values) => handleManualInputChange("Flow", values[0])}
                        className="py-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Low (10)</span>
                        <span>Medium (250)</span>
                        <span>High (500)</span>
                      </div>
                    </div>

                    {/* Advanced Parameters Section */}
                    <div className="col-span-1 md:col-span-2 pt-4 border-t border-purple-100 dark:border-purple-800">
                      <details className="group">
                        <summary className="flex items-center cursor-pointer text-sm font-medium text-purple-700 dark:text-purple-300">
                          <span className="mr-2">Advanced Parameters</span>
                          <svg
                            className="h-4 w-4 transition-transform group-open:rotate-180"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </summary>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* DO Parameter */}
                          <div className="space-y-2">
                            <Label htmlFor="DO" className="text-sm font-medium">
                              Dissolved Oxygen (mg/L)
                            </Label>
                            <Input
                              id="DO"
                              type="number"
                              step="0.1"
                              min="0"
                              max="20"
                              value={manualData.DO}
                              onChange={(e) => handleManualInputChange("DO", Number.parseFloat(e.target.value) || 0)}
                              className="border-purple-200 dark:border-purple-800"
                            />
                          </div>

                          {/* Conductivity Parameter */}
                          <div className="space-y-2">
                            <Label htmlFor="Conductivity" className="text-sm font-medium">
                              Conductivity (μS/cm)
                            </Label>
                            <Input
                              id="Conductivity"
                              type="number"
                              step="10"
                              min="0"
                              max="5000"
                              value={manualData.Conductivity}
                              onChange={(e) =>
                                handleManualInputChange("Conductivity", Number.parseFloat(e.target.value) || 0)
                              }
                              className="border-purple-200 dark:border-purple-800"
                            />
                          </div>

                          {/* Turbidity Parameter */}
                          <div className="space-y-2">
                            <Label htmlFor="Turbidity" className="text-sm font-medium">
                              Turbidity (NTU)
                            </Label>
                            <Input
                              id="Turbidity"
                              type="number"
                              step="1"
                              min="0"
                              max="1000"
                              value={manualData.Turbidity}
                              onChange={(e) =>
                                handleManualInputChange("Turbidity", Number.parseFloat(e.target.value) || 0)
                              }
                              className="border-purple-200 dark:border-purple-800"
                            />
                          </div>
                        </div>
                      </details>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-4 w-4" />
                        Generate Prediction
                      </>
                    )}
                  </Button>
                </form>
              </div>
            )}

            {prediction && (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300 flex items-center">
                    <Beaker className="mr-2 h-5 w-5" />
                    Chemical Dosing Recommendation
                  </h3>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-100 dark:border-purple-900">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Recommended Chemical</p>
                        <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{prediction.chemical}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Dosage Quantity</p>
                        <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                          {prediction.quantity.toFixed(2)} {prediction.dosageUnit}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Expected Efficiency</p>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={prediction.efficiency}
                            className="h-2 bg-purple-100 dark:bg-purple-900"
                            indicatorClassName="bg-purple-600 dark:bg-purple-400"
                          />
                          <span className="text-sm font-medium">{prediction.efficiency.toFixed(1)}%</span>
                        </div>
                      </div>
                      {prediction.fault && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Potential Issues</p>
                          <Alert className="mt-1 bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{prediction.fault}</AlertDescription>
                          </Alert>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300 flex items-center">
                    <BarChart className="mr-2 h-5 w-5" />
                    Process Parameters
                  </h3>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-100 dark:border-purple-900">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Water pH</p>
                        <p className="font-medium">
                          {mode === "auto" ? sensorData?.pH.toFixed(1) : manualData.pH.toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Temperature</p>
                        <p className="font-medium">
                          {mode === "auto" ? sensorData?.Temperature.toFixed(1) : manualData.Temperature.toFixed(1)} °C
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">TSS</p>
                        <p className="font-medium">
                          {mode === "auto" ? sensorData?.TSS.toFixed(0) : manualData.TSS.toFixed(0)} mg/L
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">COD</p>
                        <p className="font-medium">
                          {mode === "auto" ? sensorData?.COD.toFixed(0) : manualData.COD.toFixed(0)} mg/L
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">BOD</p>
                        <p className="font-medium">
                          {mode === "auto" ? sensorData?.BOD.toFixed(0) : manualData.BOD.toFixed(0)} mg/L
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Flow Rate</p>
                        <p className="font-medium">
                          {mode === "auto" ? sensorData?.Flow.toFixed(0) : manualData.Flow.toFixed(0)} m³/hr
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 text-xs text-gray-500 dark:text-gray-400">
        Last updated: {new Date(lastUpdated).toLocaleString()}
      </CardFooter>
    </Card>
  )
}
