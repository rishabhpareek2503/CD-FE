"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, X } from "lucide-react"
import { DataExportService } from "@/lib/export-service"

interface ReportPreviewProps {
  data: any[]
  reportType: string
  deviceId?: string
  dateRange?: { from: Date; to: Date }
  parameters?: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReportPreview({
  data,
  reportType,
  deviceId,
  dateRange,
  parameters,
  open,
  onOpenChange,
}: ReportPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && data.length > 0) {
      generatePreview()
    }

    return () => {
      // Clean up the URL when the component unmounts
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [open, data])

  const generatePreview = () => {
    try {
      setLoading(true)
      setError(null)

      // Generate PDF preview
      const pdfBlob = DataExportService.generatePDFPreview(data, {
        title: `${reportType} Report`,
        subtitle: `Generated on ${new Date().toLocaleString()}\n${deviceId ? `Device ID: ${deviceId}` : ""}`,
        orientation: reportType.includes("Compliance") ? "portrait" : "landscape",
        companyInfo: {
          name: "HEEPL Wastewater Monitoring",
          address: "HEEPL Headquarters, Industrial Area, Phase 1",
          contact: "Phone: +91-XXX-XXX-XXXX | Email: info@heepl.com",
          website: "www.heepl.com",
        },
      })

      // Create a URL for the blob
      const url = URL.createObjectURL(pdfBlob)
      setPreviewUrl(url)
      setLoading(false)
    } catch (error) {
      console.error("Error generating preview:", error)
      setError("Failed to generate preview")
      setLoading(false)
    }
  }

  const handleDownload = () => {
    try {
      DataExportService.exportReport(data, reportType, "pdf", {
        deviceId,
        dateRange,
        parameters,
      })
    } catch (error) {
      console.error("Error downloading report:", error)
      setError("Failed to download report")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>{reportType} Report Preview</DialogTitle>
        </DialogHeader>

        <div className="w-full h-full overflow-auto">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a4e7e]"></div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-red-500">{error}</div>
            </div>
          )}

          {!loading && !error && previewUrl && (
            <iframe src={previewUrl} className="w-full h-full border-0" title="Report Preview" />
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
          <Button onClick={handleDownload} disabled={loading || !!error}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
