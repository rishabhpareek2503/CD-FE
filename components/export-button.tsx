"use client"

import { useState } from "react"
import { Download, FileText, FileSpreadsheet, FileCode, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DataExportService, type ExportFormat } from "@/lib/export-service"
import { toast } from "@/components/ui/use-toast"

interface ExportButtonProps {
  data: any[]
  filename?: string
  title?: string
  subtitle?: string
  orientation?: "portrait" | "landscape"
  disabled?: boolean
  variant?: "default" | "outline" | "secondary"
  size?: "default" | "sm" | "lg"
  className?: string
}

export function ExportButton({
  data,
  filename,
  title,
  subtitle,
  orientation = "portrait",
  disabled = false,
  variant = "outline",
  size = "default",
  className,
}: ExportButtonProps) {
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
      DataExportService.exportData(data, format, {
        filename,
        title,
        subtitle,
        orientation,
      })

      toast({
        title: "Export successful",
        description: `Data has been exported as ${format.toUpperCase()} file.`,
      })

      setLoading(false)
    } catch (error) {
      console.error("Error exporting data:", error)

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
          Export
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
