"use client"

import { useState, useEffect } from "react"
import { Brain, AlertCircle, CheckCircle, FileSpreadsheet, Table, Loader2 } from "lucide-react"
import { doc, updateDoc, serverTimestamp, collection, addDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"
import { fetchTextileDataset, type TextileDataPoint } from "@/lib/textile-data-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export function TextileModelTrainer() {
  const [activeTab, setActiveTab] = useState("dataset")
  const [modelName, setModelName] = useState("Textile_Chemical_Dosing_Model")
  const [epochs, setEpochs] = useState(50)
  const [testSplit, setTestSplit] = useState(0.2)
  const [learningRate, setLearningRate] = useState(0.001)
  const [batchSize, setBatchSize] = useState(32)
  const [useEarlyStopping, setUseEarlyStopping] = useState(true)
  const [patience, setPatience] = useState(10)
  const [targetFeature, setTargetFeature] = useState("Chemical Dosage (kg/m³)")
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [textileData, setTextileData] = useState<TextileDataPoint[]>([])
  const [datasetSummary, setDatasetSummary] = useState<{
    rowCount: number
    columns: string[]
    chemicalTypes: string[]
  } | null>(null)

  useEffect(() => {
    // Load the textile dataset when component mounts
    loadTextileDataset()
  }, [])

  const loadTextileDataset = async () => {
    try {
      setDataLoading(true)
      const data = await fetchTextileDataset()
      setTextileData(data)

      // Generate dataset summary
      if (data.length > 0) {
        const columns = Object.keys(data[0])
        const chemicalTypes = Array.from(new Set(data.map((d) => d["Chemical Type"])))

        setDatasetSummary({
          rowCount: data.length,
          columns,
          chemicalTypes,
        })
      }

      setDataLoading(false)
    } catch (err) {
      console.error("Error loading textile dataset:", err)
      setError("Failed to load textile dataset")
      setDataLoading(false)
    }
  }

  const handleStartTraining = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      setTrainingProgress(0)
      setActiveTab("training")

      // Simulate training progress
      const progressInterval = setInterval(() => {
        setTrainingProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 1
        })
      }, epochs * 2)

      // Create a new model document
      const modelRef = await addDoc(collection(db, "models"), {
        name: modelName,
        type: "textile",
        status: "training",
        config: {
          epochs,
          testSplit,
          learningRate,
          batchSize,
          useEarlyStopping,
          patience,
          targetFeature,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // Simulate model training
      await new Promise((resolve) => setTimeout(resolve, epochs * 100))

      // Generate mock metrics
      const accuracy = 0.85 + Math.random() * 0.1
      const precision = 0.82 + Math.random() * 0.1
      const recall = 0.84 + Math.random() * 0.1
      const f1Score = (2 * (precision * recall)) / (precision + recall)
      const mse = 0.1 - Math.random() * 0.05
      const mae = 0.08 - Math.random() * 0.03

      clearInterval(progressInterval)
      setTrainingProgress(100)

      // Update model document with results
      await updateDoc(doc(db, "models", modelRef.id), {
        status: "trained",
        metrics: {
          accuracy,
          precision,
          recall,
          f1Score,
          mse,
          mae,
        },
        modelPath: `/models/${modelRef.id}`,
        updatedAt: serverTimestamp(),
      })

      setSuccess("Model trained successfully! You can now use it for predictions.")
    } catch (err) {
      console.error("Error training model:", err)
      setError("Failed to train model. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-2 border-primary/20 shadow-md">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Textile Chemical Dosing Model
        </CardTitle>
        <CardDescription>Train a model to predict optimal chemical dosing for textile processing</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="dataset" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Dataset</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Table className="h-4 w-4" />
              <span className="hidden sm:inline">Configuration</span>
            </TabsTrigger>
            <TabsTrigger value="training" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Training</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dataset">
            {dataLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : datasetSummary ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium">Dataset Size</h3>
                    <p className="text-sm text-gray-500">{datasetSummary.rowCount} records</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Chemical Types</h3>
                    <p className="text-sm text-gray-500">{datasetSummary.chemicalTypes.length} unique chemicals</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Dataset Preview</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300 dark:border-gray-700">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-800">
                          {[
                            "Batch ID",
                            "Chemical Type",
                            "Chemical Dosage (kg/m³)",
                            "Water pH",
                            "COD (mg/L)",
                            "BOD (mg/L)",
                          ].map((col) => (
                            <th key={col} className="border px-4 py-2 text-left text-xs font-medium">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {textileData.slice(0, 5).map((row, idx) => (
                          <tr key={idx}>
                            <td className="border px-4 py-2 text-xs">{row["Batch ID"]}</td>
                            <td className="border px-4 py-2 text-xs">{row["Chemical Type"]}</td>
                            <td className="border px-4 py-2 text-xs">{row["Chemical Dosage (kg/m³)"]}</td>
                            <td className="border px-4 py-2 text-xs">{row["Water pH"]}</td>
                            <td className="border px-4 py-2 text-xs">{row["COD (mg/L)"]}</td>
                            <td className="border px-4 py-2 text-xs">{row["BOD (mg/L)"]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Chemical Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {datasetSummary.chemicalTypes.map((chemical) => (
                      <div key={chemical} className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-md text-xs">
                        {chemical}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="h-8 w-8 text-yellow-500" />
                <p className="mt-2 text-center text-gray-500">No dataset information available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="config">
            <div className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="modelName">Model Name</Label>
                  <Input
                    id="modelName"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="border-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetFeature">Target Feature (What to Predict)</Label>
                  <Select value={targetFeature} onValueChange={setTargetFeature}>
                    <SelectTrigger id="targetFeature" className="border-primary/20">
                      <SelectValue placeholder="Select target feature" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Chemical Type">Chemical Type</SelectItem>
                      <SelectItem value="Chemical Dosage (kg/m³)">Chemical Dosage (kg/m³)</SelectItem>
                      <SelectItem value="Chemical Efficiency (%)">Chemical Efficiency (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="epochs">Training Epochs: {epochs}</Label>
                  </div>
                  <Slider
                    id="epochs"
                    min={10}
                    max={200}
                    step={10}
                    value={[epochs]}
                    onValueChange={(value) => setEpochs(value[0])}
                    className="py-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="testSplit">Test Split: {testSplit * 100}%</Label>
                  </div>
                  <Slider
                    id="testSplit"
                    min={0.1}
                    max={0.5}
                    step={0.05}
                    value={[testSplit]}
                    onValueChange={(value) => setTestSplit(value[0])}
                    className="py-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="learningRate">Learning Rate: {learningRate}</Label>
                  </div>
                  <Slider
                    id="learningRate"
                    min={0.0001}
                    max={0.01}
                    step={0.0001}
                    value={[learningRate]}
                    onValueChange={(value) => setLearningRate(value[0])}
                    className="py-2"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="earlyStop" checked={useEarlyStopping} onCheckedChange={setUseEarlyStopping} />
                  <Label htmlFor="earlyStop">Use Early Stopping</Label>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="training">
            <div className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Training Progress</span>
                    <span>{trainingProgress}%</span>
                  </div>
                  <Progress value={trainingProgress} className="h-2" />
                </div>

                {trainingProgress > 0 && trainingProgress < 100 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Training Status</h3>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">
                        {trainingProgress < 20
                          ? "Initializing model..."
                          : trainingProgress < 40
                            ? "Preprocessing data..."
                            : trainingProgress < 60
                              ? "Training model..."
                              : trainingProgress < 80
                                ? "Optimizing model..."
                                : "Finalizing model..."}
                      </p>
                      <p className="text-xs text-gray-500">
                        Epoch: {Math.floor((trainingProgress / 100) * epochs)}/{epochs}
                      </p>
                    </div>
                  </div>
                )}

                {trainingProgress === 100 && success && (
                  <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <h3 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
                      Model Training Complete
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Accuracy</p>
                        <p className="font-medium">85.7%</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Precision</p>
                        <p className="font-medium">83.2%</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Recall</p>
                        <p className="font-medium">84.6%</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">F1 Score</p>
                        <p className="font-medium">83.9%</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
        {activeTab === "config" && (
          <Button onClick={handleStartTraining} disabled={loading || !modelName} className="w-full">
            <Brain className="mr-2 h-4 w-4" />
            {loading ? "Preparing..." : "Start Training"}
          </Button>
        )}
        {activeTab === "dataset" && (
          <Button onClick={() => setActiveTab("config")} className="w-full">
            Continue to Configuration
          </Button>
        )}
        {activeTab === "training" && trainingProgress === 100 && success && (
          <Button onClick={() => setActiveTab("dataset")} className="w-full bg-green-600 hover:bg-green-700">
            <CheckCircle className="mr-2 h-4 w-4" />
            Complete
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
