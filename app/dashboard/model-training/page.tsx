"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Brain, FileSpreadsheet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TextileModelTrainer } from "@/components/model-training/textile-model-trainer"
import { DatasetUploader } from "@/components/model-training/dataset-uploader"
import { DatasetList } from "@/components/model-training/dataset-list"

export default function ModelTrainingPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("textile")

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent flex items-center">
            <Brain className="mr-2 h-6 w-6 text-blue-600 dark:text-blue-400" />
            AI Model Training
          </h1>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="textile" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Textile Model</span>
          </TabsTrigger>
          <TabsTrigger value="datasets" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Datasets</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Upload</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="textile" className="space-y-6 mt-6">
          <TextileModelTrainer />
        </TabsContent>

        <TabsContent value="datasets" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Datasets</CardTitle>
              <CardDescription>View and manage your uploaded datasets</CardDescription>
            </CardHeader>
            <CardContent>
              <DatasetList onSelectDataset={() => {}} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Dataset</CardTitle>
              <CardDescription>Upload a new dataset for model training</CardDescription>
            </CardHeader>
            <CardContent>
              <DatasetUploader onUploadComplete={() => setActiveTab("datasets")} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
