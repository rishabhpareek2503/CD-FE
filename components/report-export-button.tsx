"use client"

import { useState } from "react"
import { Download, FileText, FileSpreadsheet, FileCode, Loader2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DataExportService, type ExportFormat } from "@/lib/export-service"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ReportExportButtonProps {
  data: Record<string, unknown>[]
  reportType: string
  deviceId?: string
  dateRange?: { from: Date; to: Date }
  parameters?: string[]
  disabled?: boolean
  variant?: "default" | "outline" | "secondary"
  size?: "default" | "sm" | "lg"
  className?: string
  onPreview?: () => void
}

interface ToastOptions {
  title: string
  description: string
  variant?: "default" | "destructive"
  duration?: number
}

export function ReportExportButton({
  data,
  reportType,
  deviceId,
  dateRange,
  parameters,
  disabled = false,
  variant = "outline",
  size = "default",
  className,
  onPreview,
}: ReportExportButtonProps) {
  const [loading, setLoading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleExport = async (format: ExportFormat) => {
    try {
      if (data.length === 0) {
        showToast({
          title: "No data to export",
          description: "There is no data available to export.",
          variant: "destructive",
        })
        return
      }

      setLoading(true)

      // Export the data using the export service
      DataExportService.exportReport(data, reportType, format, {
        deviceId,
        dateRange,
        parameters,
      })

      showToast({
        title: "Export successful",
        description: `Report has been exported as ${format.toUpperCase()} file.`,
      })

      setLoading(false)
    } catch (error) {
      console.error("Error exporting report:", error)

      showToast({
        title: "Export failed",
        description: "An error occurred while exporting the report. Please try again.",
        variant: "destructive",
      })

      setLoading(false)
    }
  }

  const handlePreview = () => {
    try {
      if (data.length === 0) {
        showToast({
          title: "No data to preview",
          description: "There is no data available to preview.",
          variant: "destructive",
        })
        return
      }

      setLoading(true)

      // If custom preview handler is provided, use it
      if (onPreview) {
        onPreview()
        setLoading(false)
        return
      }

      try {
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
        setPreviewOpen(true)
      } catch (error) {
        console.error("Error generating PDF preview:", error)
        showToast({
          title: "Preview generation failed",
          description: "Failed to generate PDF preview. Please try again.",
          variant: "destructive",
        })
      }

      setLoading(false)
    } catch (error) {
      console.error("Error previewing report:", error)

      showToast({
        title: "Preview failed",
        description: "An error occurred while generating the preview. Please try again.",
        variant: "destructive",
      })

      setLoading(false)
    }
  }

  // Simple toast function to avoid dependency on external toast component
  const showToast = ({ title, description, variant = "default", duration = 3000 }: ToastOptions): void => {
    console.log(`[${variant.toUpperCase()}] ${title}: ${description}`)

    // Create a toast element
    const toastEl = document.createElement("div")
    toastEl.className = `fixed bottom-4 right-4 p-4 rounded-md shadow-lg z-50 ${
      variant === "destructive" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
    }`
    toastEl.innerHTML = `
      <div class="font-bold">${title}</div>
      <div class="text-sm">${description}</div>
    `

    // Add to document
    document.body.appendChild(toastEl)

    // Remove after duration
    setTimeout(() => {
      document.body.removeChild(toastEl)
    }, duration)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} disabled={disabled || loading} className={className}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export Report
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handlePreview}>
            <Eye className="mr-2 h-4 w-4" />
            Preview Report
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("pdf")}>
            <FileText className="mr-2 h-4 w-4" />
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("excel")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export as Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("csv")}>
            <FileCode className="mr-2 h-4 w-4" />
            Export as CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Report Preview</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="w-full h-full overflow-auto">
              <iframe src={previewUrl} className="w-full h-full border-0" title="Report Preview" />
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            <Button onClick={() => handleExport("pdf")}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
