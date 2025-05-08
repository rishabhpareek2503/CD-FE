"use client"

import { useState } from "react"
import { Download, FileText, FileSpreadsheet, FileCode, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DataExportService, type ExportFormat } from "@/lib/export-service"
import { toast } from "@/components/ui/use-toast"

interface DeviceExportButtonProps {
  device: any
  data: any[]
  dateRange?: { from: Date; to: Date }
  disabled?: boolean
  variant?: "default" | "outline" | "secondary"
  size?: "default" | "sm" | "lg"
  className?: string
  type?: "current" | "history"
}

export function DeviceExportButton({
  device,
  data,
  dateRange,
  disabled = false,
  variant = "outline",
  size = "default",
  className,
  type = "current",
}: DeviceExportButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = async (format: ExportFormat) => {
    try {
      if (data.length === 0) {
        toast({
          title: "No data to export",
          description: "There is no data available to export.",
          variant: "destructive",
        })
        return
      }

      setLoading(true)

      // Export the data using the export service
      if (type === "current") {
        DataExportService.exportSensorData(data, device, format)
      } else {
        DataExportService.exportDeviceHistory(data, device, format, dateRange)
      }

      toast({
        title: "Export successful",
        description: `Device data has been exported as ${format.toUpperCase()} file.`,
      })

      setLoading(false)
    } catch (error) {
      console.error("Error exporting device data:", error)

      toast({
        title: "Export failed",
        description: "An error occurred while exporting the data. Please try again.",
        variant: "destructive",
      })

      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={disabled || loading} className={className}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Export Data
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
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
  )
}
