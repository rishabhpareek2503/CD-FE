"use client"

import { useState, useEffect, useRef } from "react"
import { CalendarIcon, FileText, Printer, Download, RefreshCw, Eye } from "lucide-react"
import { Chart, type ChartData } from "chart.js/auto"

import { useSensorData } from "@/hooks/use-sensor-data"
import { useRealtimeHistory } from "@/hooks/use-realtime-history"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DataExportService } from "@/lib/export-service"

// Define parameter thresholds and units
const parameters = [
  { name: "pH", unit: "", min: 6.5, max: 8.5, color: "#4e79a7" },
  { name: "BOD", unit: "mg/L", min: 0, max: 30, color: "#f28e2c" },
  { name: "COD", unit: "mg/L", min: 0, max: 250, color: "#e15759" },
  { name: "TSS", unit: "mg/L", min: 0, max: 30, color: "#76b7b2" },
  { name: "Flow", unit: "m³/h", min: 0, max: 100, color: "#59a14f" },
  { name: "Temperature", unit: "°C", min: 15, max: 35, color: "#edc949" },
  { name: "DO", unit: "mg/L", min: 4, max: 8, color: "#af7aa1" },
  { name: "Conductivity", unit: "μS/cm", min: 500, max: 1500, color: "#ff9da7" },
  { name: "Turbidity", unit: "NTU", min: 0, max: 5, color: "#9c755f" },
]

const reportTypes = [
  { id: "daily", name: "Daily Report" },
  { id: "weekly", name: "Weekly Performance Summary" },
  { id: "monthly", name: "Monthly Compliance Report" },
  { id: "compliance", name: "Compliance Report" },
  { id: "incident", name: "Incident Report" },
  { id: "maintenance", name: "Maintenance Report" },
]

interface Report {
  id: string
  name: string
  type: string
  deviceId: string
  createdAt: Date
  status: string
  fileSize: string
  url?: string
  data?: Record<string, unknown>[]
}

interface ToastOptions {
  title: string
  description: string
  variant?: "default" | "destructive"
  duration?: number
}

interface HistoryDataItem {
  timestamp: string | Date
  [key: string]: unknown
}

export default function ReportsPage() {
  const [selectedDevice, setSelectedDevice] = useState("all")
  const [selectedReportType, setSelectedReportType] = useState("daily")
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  })
  const [selectedParameters, setSelectedParameters] = useState<string[]>(["pH", "BOD", "COD", "TSS", "Flow"])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [reports, setReports] = useState<Report[]>([])
  const [previewReport, setPreviewReport] = useState<Report | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [reportData, setReportData] = useState<Record<string, unknown>[]>([])

  // Chart references
  const lineChartRef = useRef<HTMLCanvasElement>(null)
  const barChartRef = useRef<HTMLCanvasElement>(null)
  const lineChartInstance = useRef<Chart | null>(null)
  const barChartInstance = useRef<Chart | null>(null)

  const { devices } = useSensorData()
  const { data: historyData, loading: historyLoading, error: historyError } = useRealtimeHistory("RPi001")

  // Load reports on mount
  useEffect(() => {
    loadReports()
  }, [])

  // Update charts when report data changes
  useEffect(() => {
    if (reportData.length > 0) {
      createCharts(reportData)
    }
  }, [reportData])

  // Load reports from local storage or generate mock data
  const loadReports = () => {
    try {
      const savedReports = localStorage.getItem("wastewater_reports")
      if (savedReports) {
        const parsedReports = JSON.parse(savedReports)
        // Convert string dates back to Date objects
        const reportsWithDates = parsedReports.map((report: Record<string, unknown>) => ({
          ...report,
          createdAt: new Date(report.createdAt as string),
        }))
        setReports(reportsWithDates as Report[])
      } else {
        // Generate mock reports if none exist
        const mockReports: Report[] = [
          {
            id: "RPT-001",
            name: "Daily Operations Report",
            type: "daily",
            deviceId: "RPi001",
            createdAt: new Date(2025, 3, 30, 12, 33, 21),
            status: "completed",
            fileSize: "1.2 MB",
          },
          {
            id: "RPT-002",
            name: "Weekly Performance Summary",
            type: "weekly",
            deviceId: "RPi001",
            createdAt: new Date(2025, 3, 30, 12, 39, 23),
            status: "completed",
            fileSize: "3.5 MB",
          },
          {
            id: "RPT-003",
            name: "Monthly Compliance Report",
            type: "compliance",
            deviceId: "RPi001",
            createdAt: new Date(2025, 3, 30, 14, 40, 35),
            status: "completed",
            fileSize: "5.8 MB",
          },
          {
            id: "RPT-004",
            name: "pH Exceedance Incident Report",
            type: "incident",
            deviceId: "RPi001",
            createdAt: new Date(2025, 3, 30, 14, 46, 38),
            status: "completed",
            fileSize: "2.1 MB",
          },
        ]
        setReports(mockReports)
        localStorage.setItem("wastewater_reports", JSON.stringify(mockReports))
      }
    } catch (error) {
      console.error("Error loading reports:", error)
      setError("Failed to load reports")
    }
  }

  // Filter reports based on selections
  const filteredReports = reports.filter((report) => {
    const matchesDevice = selectedDevice === "all" || report.deviceId === selectedDevice
    const matchesType = selectedReportType === "all" || report.type === selectedReportType
    const matchesDate =
      (!dateRange.from || report.createdAt >= dateRange.from) && (!dateRange.to || report.createdAt <= dateRange.to)

    return matchesDevice && matchesType && matchesDate
  })

  // Create charts from report data
  const createCharts = (data: Record<string, unknown>[]) => {
    try {
      // Destroy previous chart instances if they exist
      if (lineChartInstance.current) {
        lineChartInstance.current.destroy()
      }
      if (barChartInstance.current) {
        barChartInstance.current.destroy()
      }

      if (!lineChartRef.current || !barChartRef.current) return

      // Prepare data for charts
      const timestamps = data
        .map((item) => item.Timestamp as string)
        .slice(0, 10)
        .reverse()

      // Line chart for parameters over time
      const lineChartData: ChartData = {
        labels: timestamps,
        datasets: selectedParameters.map((param) => {
          const paramInfo = parameters.find((p) => p.name === param)
          return {
            label: param,
            data: data
              .map((item) => item[param])
              .slice(0, 10)
              .reverse(),
            borderColor: paramInfo?.color || "#1a4e7e",
            backgroundColor: (paramInfo?.color || "#1a4e7e") + "33", // Add transparency
            tension: 0.3,
            fill: false,
          }
        }),
      }

      // Bar chart for average values
      const barChartData: ChartData = {
        labels: selectedParameters,
        datasets: [
          {
            label: "Average Values",
            data: selectedParameters.map((param) => {
              const values = data.map((item) => Number.parseFloat(item[param] as string)).filter((val) => !isNaN(val))
              return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0
            }),
            backgroundColor: selectedParameters.map((param) => {
              const paramInfo = parameters.find((p) => p.name === param)
              return paramInfo?.color || "#1a4e7e"
            }),
            borderWidth: 1,
          },
        ],
      }

      // Create line chart
      lineChartInstance.current = new Chart(lineChartRef.current, {
        type: "line",
        data: lineChartData,
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: "Parameter Trends Over Time",
              font: {
                size: 16,
                weight: "bold",
              },
            },
            legend: {
              position: "top",
            },
          },
          scales: {
            y: {
              beginAtZero: false,
              title: {
                display: true,
                text: "Value",
              },
            },
            x: {
              title: {
                display: true,
                text: "Time",
              },
            },
          },
        },
      })

      // Create bar chart
      barChartInstance.current = new Chart(barChartRef.current, {
        type: "bar",
        data: barChartData,
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: "Average Parameter Values",
              font: {
                size: 16,
                weight: "bold",
              },
            },
            legend: {
              display: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Average Value",
              },
            },
            x: {
              title: {
                display: true,
                text: "Parameter",
              },
            },
          },
        },
      })
    } catch (error) {
      console.error("Error creating charts:", error)
    }
  }

  // Generate a new report
  const handleGenerateReport = async () => {
    try {
      setGenerating(true)
      setError(null)

      // Get the report type name
      const reportTypeName = reportTypes.find((type) => type.id === selectedReportType)?.name || selectedReportType

      // Get the device ID
      const deviceId = selectedDevice === "all" ? "RPi001" : selectedDevice

      // Prepare the report data
      let generatedReportData: Record<string, unknown>[] = []

      // Use history data if available
      if (historyData && historyData.length > 0) {
        // Filter by date range if provided
        const filteredData = historyData.filter((item: HistoryDataItem) => {
          const itemDate = new Date(item.timestamp)
          return (!dateRange.from || itemDate >= dateRange.from) && (!dateRange.to || itemDate <= dateRange.to)
        })

        // Format the data for the report
        generatedReportData = filteredData.map((item: HistoryDataItem) => {
          const formattedItem: Record<string, unknown> = {
            Timestamp:
              typeof item.timestamp === "string"
                ? new Date(item.timestamp).toLocaleString()
                : (item.timestamp as Date).toLocaleString(),
          }

          // Add selected parameters
          selectedParameters.forEach((param) => {
            const paramKey = param.toLowerCase()
            formattedItem[param] = item[paramKey] !== undefined ? item[paramKey] : "N/A"
          })

          return formattedItem
        })
      } else {
        // Generate mock data if no history data
        generatedReportData = Array.from({ length: 20 }, (_, i) => {
          const date = new Date()
          date.setHours(date.getHours() - i)

          const item: Record<string, unknown> = {
            Timestamp: date.toLocaleString(),
          }

          selectedParameters.forEach((param) => {
            const paramInfo = parameters.find((p) => p.name === param)
            if (paramInfo) {
              const min = paramInfo.min
              const max = paramInfo.max
              item[param] = (min + Math.random() * (max - min)).toFixed(1)
            }
          })

          return item
        })
      }

      // Create a new report
      const newReport: Report = {
        id: `RPT-${reports.length + 1}`.padStart(7, "0"),
        name: `${reportTypeName} - ${new Date().toLocaleDateString()}`,
        type: selectedReportType,
        deviceId,
        createdAt: new Date(),
        status: "completed",
        fileSize: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
        data: generatedReportData,
      }

      // Add the report to the list
      const updatedReports = [newReport, ...reports]
      setReports(updatedReports)

      // Save to local storage
      localStorage.setItem("wastewater_reports", JSON.stringify(updatedReports))

      // Set the report data for preview
      setReportData(generatedReportData)

      setGenerating(false)
      toast({
        title: "Report Generated Successfully",
        description: "Your report is now available in the Report History tab.",
        duration: 5000,
      })
    } catch (error) {
      console.error("Error generating report:", error)
      setError("Failed to generate report. Please try again.")
      setGenerating(false)
    }
  }

  // Handle parameter checkbox change
  const handleParameterChange = (param: string, checked: boolean) => {
    if (checked) {
      setSelectedParameters([...selectedParameters, param])
    } else {
      setSelectedParameters(selectedParameters.filter((p) => p !== param))
    }
  }

  // Preview a report
  const handlePreviewReport = (report: Report) => {
    setPreviewReport(report)

    // If report has data, use it, otherwise generate mock data
    const reportDataToUse: Record<string, unknown>[] =
      report.data ||
      Array.from({ length: 20 }, (_, i) => {
        const date = new Date(report.createdAt)
        date.setHours(date.getHours() - i)

        const item: Record<string, unknown> = {
          Timestamp: date.toLocaleString(),
        }

        parameters.forEach((param) => {
          const min = param.min
          const max = param.max
          item[param.name] = (min + Math.random() * (max - min)).toFixed(1)
        })

        return item
      })

    // Set report data to create charts
    setReportData(reportDataToUse)

    // Generate PDF preview after a short delay to ensure charts are rendered
    setTimeout(() => {
      try {
        const reportTypeName = reportTypes.find((type) => type.id === report.type)?.name || report.type

        // Get chart canvases
        const chartData = []

        if (lineChartRef.current) {
          chartData.push({
            canvas: lineChartRef.current,
            title: "Parameter Trends Over Time",
            description: "This chart shows how parameter values change over time.",
          })
        }

        if (barChartRef.current) {
          chartData.push({
            canvas: barChartRef.current,
            title: "Average Parameter Values",
            description: "This chart shows the average value for each parameter.",
          })
        }

        const pdfBlob = DataExportService.generatePDFPreview(reportDataToUse, {
          title: `${reportTypeName}`,
          subtitle: `Generated on ${report.createdAt.toLocaleString()}\nDevice ID: ${report.deviceId}`,
          orientation: report.type.includes("compliance") ? "portrait" : "landscape",
          companyInfo: {
            name: "HEEPL Wastewater Monitoring",
            address: "HEEPL Headquarters, Industrial Area, Phase 1",
            contact: "Phone: +91-XXX-XXX-XXXX | Email: info@heepl.com",
            website: "www.heepl.com",
          },
          chartData,
        })

        // Create a URL for the blob
        const url = URL.createObjectURL(pdfBlob)
        setPreviewUrl(url)
        setPreviewOpen(true)
      } catch (error) {
        console.error("Error generating preview:", error)
        toast({
          title: "Preview Failed",
          description: "Failed to generate report preview. Please try again.",
          variant: "destructive",
          duration: 3000,
        })
      }
    }, 500) // Short delay to ensure charts are rendered
  }

  // Handle direct PDF download for a report
  const handleDownloadReport = (report: Report, format: "pdf" | "excel" | "csv") => {
    try {
      // If report has data, use it, otherwise generate mock data
      const reportDataToUse: Record<string, unknown>[] =
        report.data ||
        Array.from({ length: 20 }, (_, i) => {
          const date = new Date(report.createdAt)
          date.setHours(date.getHours() - i)

          const item: Record<string, unknown> = {
            Timestamp: date.toLocaleString(),
          }

          parameters.forEach((param) => {
            const min = param.min
            const max = param.max
            item[param.name] = (min + Math.random() * (max - min)).toFixed(1)
          })

          return item
        })

      // Set report data to create charts
      setReportData(reportDataToUse)

      // Download after a short delay to ensure charts are rendered
      setTimeout(() => {
        try {
          const reportTypeName = reportTypes.find((type) => type.id === report.type)?.name || report.type

          // Get chart canvases
          const chartData = []

          if (lineChartRef.current) {
            chartData.push({
              canvas: lineChartRef.current,
              title: "Parameter Trends Over Time",
              description: "This chart shows how parameter values change over time.",
            })
          }

          if (barChartRef.current) {
            chartData.push({
              canvas: barChartRef.current,
              title: "Average Parameter Values",
              description: "This chart shows the average value for each parameter.",
            })
          }

          // Export the report
          DataExportService.exportReport(reportDataToUse, reportTypeName, format, {
            deviceId: report.deviceId,
            dateRange: {
              from: new Date(report.createdAt.getTime() - 30 * 24 * 60 * 60 * 1000),
              to: report.createdAt,
            },
            chartData,
          })

          toast({
            title: "Download Started",
            description: `Your report is being downloaded as ${format.toUpperCase()}.`,
            duration: 3000,
          })
        } catch (error) {
          console.error("Error downloading report:", error)
          toast({
            title: "Download Failed",
            description: "Failed to download report. Please try again.",
            variant: "destructive",
            duration: 3000,
          })
        }
      }, 500) // Short delay to ensure charts are rendered
    } catch (error) {
      console.error("Error preparing report data:", error)
      toast({
        title: "Download Failed",
        description: "Failed to prepare report data. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadReports} className="mr-2">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleGenerateReport} disabled={generating} className="bg-[#1a4e7e] hover:bg-[#153d62]">
            <FileText className="mr-2 h-4 w-4" />
            {generating ? "Generating..." : "Generate Report"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate Report</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
        </TabsList>
        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Generate New Report</CardTitle>
              <CardDescription>Configure and generate a new report based on your requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="report-type">Report Type</Label>
                  <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                    <SelectTrigger id="report-type">
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Report Types</SelectItem>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="device-select">Device</Label>
                  <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                    <SelectTrigger id="device-select">
                      <SelectValue placeholder="Select device" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Devices</SelectItem>
                      {devices.map((device) => (
                        <SelectItem key={device.id} value={device.id}>
                          {device.id} - {device.location || "Unknown Location"}
                        </SelectItem>
                      ))}
                      <SelectItem value="RPi001">RPi001 - Wastewater Plant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                          </>
                        ) : (
                          dateRange.from.toLocaleDateString()
                        )
                      ) : (
                        "Select date range"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{
                        from: dateRange.from || new Date(),
                        to: dateRange.to || new Date(),
                      }}
                      onSelect={setDateRange as any}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Parameters to Include</Label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {parameters.map((param) => (
                    <div key={param.name} className="flex items-center space-x-2">
                      <Checkbox
                        id={`param-${param.name}`}
                        checked={selectedParameters.includes(param.name)}
                        onCheckedChange={(checked) => handleParameterChange(param.name, checked === true)}
                      />
                      <Label htmlFor={`param-${param.name}`} className="text-sm">
                        {param.name} {param.unit ? `(${param.unit})` : ""}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Report Format</Label>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <input type="radio" id="format-pdf" name="format" className="h-4 w-4" defaultChecked />
                    <Label htmlFor="format-pdf" className="text-sm">
                      PDF
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="radio" id="format-excel" name="format" className="h-4 w-4" />
                    <Label htmlFor="format-excel" className="text-sm">
                      Excel
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="radio" id="format-csv" name="format" className="h-4 w-4" />
                    <Label htmlFor="format-csv" className="text-sm">
                      CSV
                    </Label>
                  </div>
                </div>
              </div>

              {/* Charts */}
              {reportData.length > 0 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Parameter Trends</Label>
                    <div className="border rounded-md p-4 bg-white">
                      <canvas ref={lineChartRef} height="250"></canvas>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Parameter Averages</Label>
                    <div className="border rounded-md p-4 bg-white">
                      <canvas ref={barChartRef} height="250"></canvas>
                    </div>
                  </div>
                </div>
              )}

              {/* Report Preview */}
              {reportData.length > 0 && (
                <div className="space-y-2">
                  <Label>Data Preview</Label>
                  <div className="border rounded-md p-4 max-h-60 overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(reportData[0]).map((header) => (
                            <th
                              key={header}
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.slice(0, 5).map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {Object.values(row).map((value, valueIndex) => (
                              <td key={valueIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {reportData.length > 5 && (
                      <div className="text-center text-sm text-gray-500 mt-2">
                        Showing 5 of {reportData.length} rows
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedParameters(["pH", "BOD", "COD", "TSS", "Flow"])
                  setDateRange({
                    from: new Date(new Date().setDate(new Date().getDate() - 30)),
                    to: new Date(),
                  })
                  setSelectedReportType("daily")
                  setSelectedDevice("all")
                  setReportData([])
                }}
              >
                Reset
              </Button>
              <div className="flex space-x-2">
                {reportData.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      try {
                        const reportTypeName =
                          reportTypes.find((type) => type.id === selectedReportType)?.name || selectedReportType

                        // Get chart canvases
                        const chartData = []

                        if (lineChartRef.current) {
                          chartData.push({
                            canvas: lineChartRef.current,
                            title: "Parameter Trends Over Time",
                            description: "This chart shows how parameter values change over time.",
                          })
                        }

                        if (barChartRef.current) {
                          chartData.push({
                            canvas: barChartRef.current,
                            title: "Average Parameter Values",
                            description: "This chart shows the average value for each parameter.",
                          })
                        }

                        DataExportService.exportReport(reportData, reportTypeName, "pdf", {
                          deviceId: selectedDevice === "all" ? "All Devices" : selectedDevice,
                          dateRange:
                            dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined,
                          parameters: selectedParameters,
                          chartData,
                        })
                        toast({
                          title: "Export Successful",
                          description: "Report has been exported as PDF.",
                          duration: 3000,
                        })
                      } catch (error) {
                        console.error("Error exporting report:", error)
                        toast({
                          title: "Export Failed",
                          description: "Failed to export report. Please try again.",
                          variant: "destructive",
                          duration: 3000,
                        })
                      }
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                )}
                <Button
                  onClick={handleGenerateReport}
                  disabled={generating}
                  className="bg-[#1a4e7e] hover:bg-[#153d62]"
                >
                  {generating ? "Generating..." : "Generate Report"}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Report History</CardTitle>
              <CardDescription>View and download previously generated reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredReports.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No reports found matching your criteria</div>
                ) : (
                  filteredReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <FileText className="mr-2 h-5 w-5 text-blue-600" />
                          <span className="font-medium">{report.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {reportTypes.find((type) => type.id === report.type)?.name || report.type}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          {report.id} • {report.deviceId} • {report.createdAt.toLocaleDateString()}{" "}
                          {report.createdAt.toLocaleTimeString()}
                        </div>
                        <div className="text-xs text-gray-400">{report.fileSize}</div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handlePreviewReport(report)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </Button>
                        <Button variant="outline" size="sm">
                          <Printer className="mr-2 h-4 w-4" />
                          Print
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDownloadReport(report, "pdf")}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
            <CardFooter>
              <div className="text-xs text-gray-500">
                Showing {filteredReports.length} of {reports.length} reports
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report Preview Dialog */}
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
            {previewReport && (
              <Button
                onClick={() => {
                  if (previewReport) {
                    handleDownloadReport(previewReport, "pdf")
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden charts for PDF generation */}
      <div className="hidden">
        <canvas ref={lineChartRef} width="800" height="400"></canvas>
        <canvas ref={barChartRef} width="800" height="400"></canvas>
      </div>
    </div>
  )
}

// Helper function for toast notifications
function toast(options: ToastOptions): void {
  const { title, description, variant = "default", duration = 3000 } = options

  // This is a simple implementation - in a real app, you would use a proper toast library
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
