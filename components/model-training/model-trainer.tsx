"use client"

import { useState, useEffect } from "react"
import { Brain, AlertCircle, CheckCircle, FileSpreadsheet, Table } from "lucide-react"
import { doc, updateDoc, serverTimestamp, collection, addDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"
import { trainModel, analyzeDataset } from "@/lib/model-training-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Dataset {
  id: string
  name: string
  type: string
  description: string
  fileName: string
  fileSize: number
  fileType: string
  fileUrl: string
  status: "uploaded" | "processing" | "trained" | "failed"
  createdAt: any
  updatedAt: any
}

interface ModelTrainerProps {
  selectedDataset: Dataset | null
  onTrainingComplete: () => void
}

export function ModelTrainer({ selectedDataset, onTrainingComplete }: ModelTrainerProps) {
  const [activeTab, setActiveTab] = useState("config")
  const [epochs, setEpochs] = useState(50)
  const [testSplit, setTestSplit] = useState(0.2)
  const [learningRate, setLearningRate] = useState(0.001)
  const [batchSize, setBatchSize] = useState(32)
  const [useEarlyStopping, setUseEarlyStopping] = useState(true)
  const [patience, setPatience] = useState(10)
  const [useFeatureSelection, setUseFeatureSelection] = useState(false)
  const [targetColumn, setTargetColumn] = useState("")
  const [loading, setLoading] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [datasetAnalysis, setDatasetAnalysis] = useState<{
    columns: string[]
    rowCount: number
    sampleData: any[]
    dataTypes: Record<string, string>
  } | null>(null)

  useEffect(() => {
    if (selectedDataset) {
      // Reset state when a new dataset is selected
      setActiveTab("config")
      setError(null)
      setSuccess(null)
      setTrainingProgress(0)

      // Analyze the dataset
      analyzeSelectedDataset()
    }
  }, [selectedDataset])

  const analyzeSelectedDataset = async () => {
    if (!selectedDataset) return

    try {
      setLoading(true)
      const analysis = await analyzeDataset(selectedDataset.id)
      setDatasetAnalysis(analysis)

      // Set default target column (last column)
      if (analysis.columns.length > 0) {
        setTargetColumn(analysis.columns[analysis.columns.length - 1])
      }
    } catch (err) {
      console.error("Error analyzing dataset:", err)
      setError("Failed to analyze dataset. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleStartTraining = async () => {
    if (!selectedDataset) {
      setError("No dataset selected")
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      setTrainingProgress(0)
      setActiveTab("progress")

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
        name: `${selectedDataset.name} Model`,
        datasetId: selectedDataset.id,
        datasetName: selectedDataset.name,
        status: "training",
        config: {
          epochs,
          testSplit,
          learningRate,
          batchSize,
          useEarlyStopping,
          patience,
          useFeatureSelection,
          targetColumn,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // Train the model
      const result = await trainModel(selectedDataset.id, modelRef.id, {
        epochs,
        testSplit,
        learningRate,
        batchSize,
        useEarlyStopping,
        patience,
        useFeatureSelection,
      })

      clearInterval(progressInterval)
      setTrainingProgress(100)

      if (result.success) {
        // Update model document with results
        await updateDoc(doc(db, "models", modelRef.id), {
          status: "trained",
          metrics: result.metrics,
          modelPath: result.modelPath,
          updatedAt: serverTimestamp(),
        })

        setSuccess("Model trained successfully! You can now use it for predictions.")
        setTimeout(onTrainingComplete, 3000)
      } else {
        // Update model document with error
        await updateDoc(doc(db, "models", modelRef.id), {
          status: "failed",
          error: result.error,
          updatedAt: serverTimestamp(),
        })

        setError(result.error || "Failed to train model. Please try again.")
      }
    } catch (err) {
      console.error("Error training model:", err)
      setError("Failed to train model. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!selectedDataset) {
    return (
      <Card className="border-2 border-primary/20 shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Model Training
          </CardTitle>
          <CardDescription>Select a dataset to start training a model</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12">
            <FileSpreadsheet className="h-16 w-16 text-gray-300 dark:text-gray-600" />
            <p className="mt-4 text-center text-gray-500">
              No dataset selected. Please select a dataset from the Datasets tab.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-primary/20 shadow-md">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Train Model: {selectedDataset.name}
        </CardTitle>
        <CardDescription>Configure and train a model using the selected dataset</CardDescription>
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
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Training</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dataset">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Dataset Name</h3>
                  <p className="text-sm text-gray-500">{selectedDataset.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">File Type</h3>
                  <p className="text-sm text-gray-500">{selectedDataset.fileName.split(".").pop()?.toUpperCase()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Dataset Type</h3>
                  <p className="text-sm text-gray-500">{selectedDataset.type}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">File Size</h3>
                  <p className="text-sm text-gray-500">{(selectedDataset.fileSize / 1024).toFixed(2)} KB</p>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : datasetAnalysis ? (
                <div className="space-y-4 mt-4">
                  <div>
                    <h3 className="text-sm font-medium">Dataset Summary</h3>
                    <p className="text-sm text-gray-500">
                      {datasetAnalysis.rowCount} rows, {datasetAnalysis.columns.length} columns
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium">Columns</h3>
                    <div className="mt-2 overflow-x-auto">
                      <table className="min-w-full border border-gray-300 dark:border-gray-700">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-800">
                            <th className="border px-4 py-2 text-left text-xs font-medium">Column Name</th>
                            <th className="border px-4 py-2 text-left text-xs font-medium">Data Type</th>
                            <th className="border px-4 py-2 text-left text-xs font-medium">Sample Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {datasetAnalysis.columns.map((column) => (
                            <tr key={column}>
                              <td className="border px-4 py-2 text-xs">{column}</td>
                              <td className="border px-4 py-2 text-xs">{datasetAnalysis.dataTypes[column]}</td>
                              <td className="border px-4 py-2 text-xs">
                                {datasetAnalysis.sampleData[0]?.[column]?.toString() || "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium">Sample Data</h3>
                    <div className="mt-2 overflow-x-auto">
                      <table className="min-w-full border border-gray-300 dark:border-gray-700">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-800">
                            {datasetAnalysis.columns.map((column) => (
                              <th key={column} className="border px-4 py-2 text-left text-xs font-medium">
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {datasetAnalysis.sampleData.map((row, index) => (
                            <tr key={index}>
                              {datasetAnalysis.columns.map((column) => (
                                <td key={column} className="border px-4 py-2 text-xs">
                                  {row[column]?.toString() || "N/A"}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <AlertCircle className="h-8 w-8 text-yellow-500" />
                  <p className="mt-2 text-center text-gray-500">Failed to analyze dataset. Please try again.</p>
                </div>
              )}
            </div>
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

              {datasetAnalysis && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetColumn">Target Column (What to Predict)</Label>
                    <Select value={targetColumn} onValueChange={setTargetColumn}>
                      <SelectTrigger id="targetColumn" className="border-primary/20">
                        <SelectValue placeholder="Select target column" />
                      </SelectTrigger>
                      <SelectContent>
                        {datasetAnalysis.columns.map((column) => (
                          <SelectItem key={column} value={column}>
                            {column}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Select the column that contains the values you want to predict
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
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
                  <p className="text-xs text-gray-500">Number of complete passes through the training dataset</p>
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
                  <p className="text-xs text-gray-500">Percentage of data to use for testing the model</p>
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
                  <p className="text-xs text-gray-500">Controls how quickly the model adapts to the problem</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="batchSize">Batch Size: {batchSize}</Label>
                  </div>
                  <Slider
                    id="batchSize"
                    min={8}
                    max={128}
                    step={8}
                    value={[batchSize]}
                    onValueChange={(value) => setBatchSize(value[0])}
                    className="py-2"
                  />
                  <p className="text-xs text-gray-500">Number of samples processed before the model is updated</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="earlyStop" checked={useEarlyStopping} onCheckedChange={setUseEarlyStopping} />
                  <Label htmlFor="earlyStop">Use Early Stopping</Label>
                </div>

                {useEarlyStopping && (
                  <div className="space-y-2 pl-6">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="patience">Patience: {patience}</Label>
                    </div>
                    <Slider
                      id="patience"
                      min={1}
                      max={20}
                      step={1}
                      value={[patience]}
                      onValueChange={(value) => setPatience(value[0])}
                      className="py-2"
                    />
                    <p className="text-xs text-gray-500">Number of epochs with no improvement before stopping</p>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="featureSelection"
                    checked={useFeatureSelection}
                    onCheckedChange={setUseFeatureSelection}
                  />
                  <Label htmlFor="featureSelection">Use Feature Selection</Label>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="progress">
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
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
        {activeTab === "config" && (
          <Button onClick={handleStartTraining} disabled={loading || !targetColumn} className="w-full">
            <Brain className="mr-2 h-4 w-4" />
            {loading ? "Preparing..." : "Start Training"}
          </Button>
        )}
        {activeTab === "dataset" && (
          <Button onClick={() => setActiveTab("config")} className="w-full">
            Continue to Configuration
          </Button>
        )}
        {activeTab === "progress" && trainingProgress === 100 && success && (
          <Button onClick={onTrainingComplete} className="w-full bg-green-600 hover:bg-green-700">
            <CheckCircle className="mr-2 h-4 w-4" />
            Complete
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
