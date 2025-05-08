import { doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore"
import * as XLSX from "xlsx"
import { db } from "@/lib/firebase"

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

interface ModelConfig {
  epochs: number
  testSplit: number
  learningRate: number
  batchSize: number
  useEarlyStopping: boolean
  patience: number
  useFeatureSelection: boolean
}

interface TrainingResult {
  success: boolean
  metrics?: {
    accuracy: number
    precision: number
    recall: number
    f1Score: number
    mse: number
    mae: number
  }
  error?: string
  modelPath?: string
}

export async function processDataset(datasetId: string): Promise<boolean> {
  try {
    // Update dataset status to processing
    await updateDoc(doc(db, "datasets", datasetId), {
      status: "processing",
      updatedAt: serverTimestamp(),
    })

    // Get the dataset document
    const datasetDoc = await getDoc(doc(db, "datasets", datasetId))
    if (!datasetDoc.exists()) {
      throw new Error("Dataset not found")
    }

    const dataset = datasetDoc.data() as Omit<Dataset, "id">

    // In a real application, you would process the dataset here
    // For now, we'll simulate processing with a delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Update dataset status to processed
    await updateDoc(doc(db, "datasets", datasetId), {
      status: "uploaded", // Ready for training
      updatedAt: serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error processing dataset:", error)

    // Update dataset status to failed
    await updateDoc(doc(db, "datasets", datasetId), {
      status: "failed",
      updatedAt: serverTimestamp(),
    })

    return false
  }
}

export async function trainModel(datasetId: string, modelId: string, config: ModelConfig): Promise<TrainingResult> {
  try {
    // Get the dataset document
    const datasetDoc = await getDoc(doc(db, "datasets", datasetId))
    if (!datasetDoc.exists()) {
      throw new Error("Dataset not found")
    }

    const dataset = datasetDoc.data() as Omit<Dataset, "id">

    // Load the dataset
    const data = await loadDatasetFromStorage(dataset.fileUrl)

    // In a real application, you would:
    // 1. Preprocess the data
    // 2. Split into training and testing sets
    // 3. Train the model using TensorFlow.js or a backend API
    // 4. Evaluate the model
    // 5. Save the model and update the database

    // For this example, we'll simulate training with a delay
    await new Promise((resolve) => setTimeout(resolve, config.epochs * 100))

    // Generate mock metrics based on config
    const accuracy = 0.85 + Math.random() * 0.1
    const precision = 0.82 + Math.random() * 0.1
    const recall = 0.84 + Math.random() * 0.1
    const f1Score = (2 * (precision * recall)) / (precision + recall)
    const mse = 0.1 - Math.random() * 0.05
    const mae = 0.08 - Math.random() * 0.03

    return {
      success: true,
      metrics: {
        accuracy,
        precision,
        recall,
        f1Score,
        mse,
        mae,
      },
      modelPath: `/models/${modelId}`,
    }
  } catch (error) {
    console.error("Error training model:", error)
    return {
      success: false,
      error: "Failed to train model. Please try again.",
    }
  }
}

export async function loadDatasetFromStorage(datasetUrl: string): Promise<any[]> {
  try {
    // Fetch the file from Firebase Storage
    const response = await fetch(datasetUrl)
    const arrayBuffer = await response.arrayBuffer()

    // Parse the file based on its type
    if (datasetUrl.endsWith(".csv")) {
      // Parse CSV
      const text = new TextDecoder().decode(arrayBuffer)
      const rows = text.split("\n")
      const headers = rows[0].split(",")

      return rows
        .slice(1)
        .map((row) => {
          const values = row.split(",")
          const obj: Record<string, string> = {}

          headers.forEach((header, index) => {
            obj[header.trim()] = values[index]?.trim() || ""
          })

          return obj
        })
        .filter((row) => Object.values(row).some((val) => val))
    } else if (datasetUrl.endsWith(".xlsx") || datasetUrl.endsWith(".xls")) {
      // Parse Excel
      const workbook = XLSX.read(arrayBuffer)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      // Convert Excel data to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      // Log the first few rows for debugging
      console.log("Excel data loaded:", jsonData.slice(0, 3))

      return jsonData
    }

    throw new Error("Unsupported file format")
  } catch (error) {
    console.error("Error loading dataset:", error)
    throw error
  }
}

// Helper function to analyze dataset structure
export async function analyzeDataset(datasetId: string): Promise<{
  columns: string[]
  rowCount: number
  sampleData: any[]
  dataTypes: Record<string, string>
}> {
  try {
    // Get the dataset document
    const datasetDoc = await getDoc(doc(db, "datasets", datasetId))
    if (!datasetDoc.exists()) {
      throw new Error("Dataset not found")
    }

    const dataset = datasetDoc.data() as Omit<Dataset, "id">

    // Load the dataset
    const data = await loadDatasetFromStorage(dataset.fileUrl)

    if (!data || data.length === 0) {
      throw new Error("Dataset is empty")
    }

    // Get columns from the first row
    const columns = Object.keys(data[0])

    // Get data types for each column
    const dataTypes: Record<string, string> = {}
    columns.forEach((column) => {
      const sampleValue = data[0][column]
      if (typeof sampleValue === "number") {
        dataTypes[column] = "number"
      } else if (!isNaN(Date.parse(sampleValue))) {
        dataTypes[column] = "date"
      } else {
        dataTypes[column] = "string"
      }
    })

    return {
      columns,
      rowCount: data.length,
      sampleData: data.slice(0, 5),
      dataTypes,
    }
  } catch (error) {
    console.error("Error analyzing dataset:", error)
    throw error
  }
}
