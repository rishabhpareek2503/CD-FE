"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from "firebase/firestore"
import { FileText, Trash2, RefreshCw, Database } from "lucide-react"

import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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

export function DatasetList({ onSelectDataset }: { onSelectDataset: (dataset: Dataset) => void }) {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [datasetToDelete, setDatasetToDelete] = useState<string | null>(null)

  useEffect(() => {
    const datasetsQuery = query(collection(db, "datasets"), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(
      datasetsQuery,
      (snapshot) => {
        const datasetsData: Dataset[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          datasetsData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
            updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
          } as Dataset)
        })
        setDatasets(datasetsData)
        setLoading(false)
      },
      (err) => {
        console.error("Error fetching datasets:", err)
        setError("Failed to load datasets")
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  const handleDeleteDataset = async () => {
    if (!datasetToDelete) return

    try {
      await deleteDoc(doc(db, "datasets", datasetToDelete))
      setDatasetToDelete(null)
    } catch (err) {
      console.error("Error deleting dataset:", err)
      setError("Failed to delete dataset")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "uploaded":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Uploaded
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Processing
          </Badge>
        )
      case "trained":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Trained
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Failed
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getDatasetTypeLabel = (type: string) => {
    switch (type) {
      case "chemical-dosing":
        return "Chemical Dosing"
      case "fault-diagnosis":
        return "Fault Diagnosis"
      case "efficiency-prediction":
        return "Efficiency Prediction"
      default:
        return type
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-48" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-full" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Datasets</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-primary/20 shadow-md">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Available Datasets
        </CardTitle>
        <CardDescription>Select a dataset to use for model training</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {datasets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">No Datasets Available</h3>
            <p className="text-sm text-gray-500 mt-2">Upload a dataset to get started with model training</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datasets.map((dataset) => (
                <TableRow
                  key={dataset.id}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                  onClick={() => onSelectDataset(dataset)}
                >
                  <TableCell className="font-medium">{dataset.name}</TableCell>
                  <TableCell>{getDatasetTypeLabel(dataset.type)}</TableCell>
                  <TableCell>{getStatusBadge(dataset.status)}</TableCell>
                  <TableCell>{formatFileSize(dataset.fileSize)}</TableCell>
                  <TableCell>{dataset.createdAt.toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDatasetToDelete(dataset.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the dataset "{dataset.name}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setDatasetToDelete(null)}>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteDataset} className="bg-red-600 hover:bg-red-700">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
