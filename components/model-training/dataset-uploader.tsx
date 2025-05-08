"use client"

import type React from "react"

import { useState } from "react"
import { Upload, FileText, AlertCircle, CheckCircle, HelpCircle } from "lucide-react"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

import { storage, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const datasetTypes = [
  { id: "chemical-dosing", name: "Chemical Dosing" },
  { id: "fault-diagnosis", name: "Fault Diagnosis" },
  { id: "efficiency-prediction", name: "Efficiency Prediction" },
]

export function DatasetUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [datasetName, setDatasetName] = useState("")
  const [datasetType, setDatasetType] = useState("")
  const [description, setDescription] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]

      // Validate file type (CSV or Excel)
      if (
        !selectedFile.name.endsWith(".csv") &&
        !selectedFile.name.endsWith(".xlsx") &&
        !selectedFile.name.endsWith(".xls")
      ) {
        setError("Please upload a CSV or Excel file")
        setFile(null)
        return
      }

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size should be less than 10MB")
        setFile(null)
        return
      }

      setFile(selectedFile)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file || !datasetName || !datasetType) {
      setError("Please fill all required fields and select a file")
      return
    }

    try {
      setUploading(true)
      setError(null)
      setSuccess(null)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 5
        })
      }, 200)

      // Upload file to Firebase Storage
      const storageRef = ref(storage, `datasets/${datasetType}/${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)

      // Add dataset metadata to Firestore
      await addDoc(collection(db, "datasets"), {
        name: datasetName,
        type: datasetType,
        description: description || "",
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileUrl: downloadURL,
        status: "uploaded", // uploaded, processing, trained, failed
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      clearInterval(progressInterval)
      setUploadProgress(100)
      setSuccess("Dataset uploaded successfully! It's now ready for training.")

      // Reset form after successful upload
      setTimeout(() => {
        setFile(null)
        setDatasetName("")
        setDescription("")
        setUploadProgress(0)
        setUploading(false)
      }, 2000)
    } catch (err) {
      console.error("Error uploading dataset:", err)
      setError("Failed to upload dataset. Please try again.")
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Card className="border-2 border-primary/20 shadow-md">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload Training Dataset
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full ml-2">
                <HelpCircle className="h-4 w-4" />
                <span className="sr-only">Help</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Excel File Format Guidelines</DialogTitle>
                <DialogDescription>
                  For successful model training, please ensure your Excel file follows these guidelines:
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <h4 className="font-medium">Required Format:</h4>
                <ul className="list-disc pl-5 space-y-2">
                  <li>First row must contain column headers (feature names)</li>
                  <li>Each subsequent row should contain one data point</li>
                  <li>Include both input features and target values in the same file</li>
                  <li>Numeric values should be properly formatted (avoid text in numeric columns)</li>
                  <li>No missing values or use consistent representation for missing values</li>
                </ul>

                <h4 className="font-medium mt-4">Example Structure:</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300 dark:border-gray-700">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="border px-4 py-2">timestamp</th>
                        <th className="border px-4 py-2">pH</th>
                        <th className="border px-4 py-2">temperature</th>
                        <th className="border px-4 py-2">turbidity</th>
                        <th className="border px-4 py-2">chemical_dosage</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border px-4 py-2">2023-01-01 08:00</td>
                        <td className="border px-4 py-2">7.2</td>
                        <td className="border px-4 py-2">25.3</td>
                        <td className="border px-4 py-2">12.5</td>
                        <td className="border px-4 py-2">45.2</td>
                      </tr>
                      <tr>
                        <td className="border px-4 py-2">2023-01-01 09:00</td>
                        <td className="border px-4 py-2">7.4</td>
                        <td className="border px-4 py-2">26.1</td>
                        <td className="border px-4 py-2">13.2</td>
                        <td className="border px-4 py-2">47.8</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          Upload CSV or Excel files containing sensor data and chemical dosing information
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
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

        <div className="space-y-2">
          <Label htmlFor="datasetName">Dataset Name</Label>
          <Input
            id="datasetName"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
            placeholder="e.g., STP Plant A - Jan 2023"
            disabled={uploading}
            className="border-primary/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="datasetType">Dataset Type</Label>
          <Select value={datasetType} onValueChange={setDatasetType} disabled={uploading}>
            <SelectTrigger id="datasetType" className="border-primary/20">
              <SelectValue placeholder="Select dataset type" />
            </SelectTrigger>
            <SelectContent>
              {datasetTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the dataset"
            disabled={uploading}
            className="border-primary/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="file">Upload File (CSV or Excel)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              accept=".csv,.xlsx,.xls"
              disabled={uploading}
              className="border-primary/20"
            />
          </div>
          <p className="text-xs text-gray-500">Max file size: 10MB. Supported formats: CSV, Excel (.xlsx, .xls)</p>
        </div>

        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
        <Button onClick={handleUpload} disabled={!file || uploading || !datasetName || !datasetType} className="w-full">
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Uploading..." : "Upload Dataset"}
        </Button>
      </CardFooter>
    </Card>
  )
}
