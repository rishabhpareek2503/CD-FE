"use client"

import { useState, useEffect, useRef } from "react"
import { CalendarIcon, FileText, Printer, Download, RefreshCw, Eye, AlertCircle } from "lucide-react"
import { Chart, type ChartData } from "chart.js/auto"

import { useSensorData } from "@/hooks/use-sensor-data"
import { useRealtimeHistory } from "@/hooks/use-realtime-history"

interface HistoricalReading {
  id: string
  BOD: number
  COD: number
  Flow: number
  PH: number
  TSS: number
  Timestamp: string
  timestamp: Date
}
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date() // Today
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
  const { historicalData, loading: historyLoading, error: historyError } = useRealtimeHistory({
    deviceId: selectedDevice === "all" ? "RPi001" : selectedDevice,
    startDate: dateRange.from,
    endDate: dateRange.to,
  })
  
  // Ensure historyData is always an array of HistoricalReading
  const historyData: HistoricalReading[] = Array.isArray(historicalData) ? historicalData : []

  // Format date for display with better error handling
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return 'N/A'
    try {
      const d = new Date(date)
      return isNaN(d.getTime()) ? 'N/A' : d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    } catch (error) {
      console.error('Error formatting date:', date, error)
      return 'N/A'
    }
  }

  // Load reports and historical data on mount
  useEffect(() => {
    loadReports()

    // Set default date range to last 7 days if not set
    if (!dateRange.from) {
      const from = new Date()
      from.setDate(from.getDate() - 7)
      setDateRange({
        from,
        to: new Date()
      })
    }
  }, [])

  // Update charts when report data changes
  useEffect(() => {
    if (reportData.length > 0) {
      createCharts(reportData)
    }
  }, [reportData])

  // Load reports from local storage
  const loadReports = () => {
    try {
      const savedReports = localStorage.getItem("wastewater_reports")
      if (!savedReports) return

      // Safely parse the saved reports
      const parsedReports = JSON.parse(savedReports)
      if (!Array.isArray(parsedReports)) return

      // Convert string dates back to Date objects with proper type safety
      const reportsWithDates = parsedReports.reduce<Report[]>((acc, item) => {
        try {
          // Skip if item is not an object
          if (!item || typeof item !== 'object' || Array.isArray(item)) return acc
          
          // Create a new report with default values
          const report: Report = {
            id: '',
            name: 'Unnamed Report',
            type: 'daily',
            deviceId: 'RPi001',
            status: 'completed',
            fileSize: '0 KB',
            createdAt: new Date(),
            data: [],
            ...item, // Spread the saved properties
          }
          
          // Ensure required fields have proper types
          if (typeof report.id !== 'string') report.id = `report-${Date.now()}`
          if (typeof report.name !== 'string') report.name = 'Unnamed Report'
          if (typeof report.type !== 'string') report.type = 'daily'
          if (typeof report.deviceId !== 'string') report.deviceId = 'RPi001'
          if (typeof report.status !== 'string') report.status = 'completed'
          if (typeof report.fileSize !== 'string') report.fileSize = '0 KB'
          
          // Parse dates
          if (typeof report.createdAt === 'string') {
            report.createdAt = new Date(report.createdAt)
          } else if (!(report.createdAt instanceof Date)) {
            report.createdAt = new Date()
          }
          
          // Ensure data is an array of objects with proper types
          if (!Array.isArray(report.data)) {
            report.data = []
          } else {
            report.data = report.data.map(dataItem => {
              if (!dataItem || typeof dataItem !== 'object' || Array.isArray(dataItem)) {
                return { Timestamp: new Date().toISOString() }
              }
              return {
                ...dataItem,
                Timestamp: typeof dataItem.Timestamp === 'string' 
                  ? dataItem.Timestamp 
                  : new Date().toISOString()
              }
            })
          }
          
          return [...acc, report]
        } catch (error) {
          console.error('Error processing report:', error)
          return acc
        }
      }, [])
      
      setReports(reportsWithDates)
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
      (!dateRange.from || (report.createdAt && new Date(report.createdAt) >= dateRange.from)) && 
      (!dateRange.to || (report.createdAt && new Date(report.createdAt) <= dateRange.to))

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
      const chartData = generateChartData(data)

      // Create line chart
      lineChartInstance.current = new Chart(lineChartRef.current, {
        type: "line",
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 0 // Disable animations
          },
          transitions: {
            active: {
              animation: {
                duration: 0 // Disable transitions
              }
            }
          },
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
              position: "top" as const,
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
        data: generateBarChartData(data),
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 0 // Disable animations
          },
          transitions: {
            active: {
              animation: {
                duration: 0 // Disable transitions
              }
            }
          },
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

  // Type definition for chart data
  interface ChartData {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      borderColor: string
      backgroundColor: string
      tension: number
      fill: boolean
    }>
  }

  // Generate chart data based on selected parameters and date range
  const generateChartData = (data: Record<string, unknown>[]): ChartData => {
    if (!data || data.length === 0) return { labels: [], datasets: [] }

    // Sort data by timestamp in ascending order
    const sortedData = [...data].sort((a, b) => {
      const timeA = new Date(a.Timestamp as string).getTime()
      const timeB = new Date(b.Timestamp as string).getTime()
      return timeA - timeB
    })

    // For better performance with large datasets, sample the data if needed
    const maxDataPoints = 100 // Maximum number of points to display
    let displayData = sortedData
    
    if (sortedData.length > maxDataPoints) {
      // Sample the data to show a representative set of points
      const step = Math.ceil(sortedData.length / maxDataPoints)
      displayData = sortedData.filter((_, index) => index % step === 0)
    }

    const labels = displayData.map((item) => {
      try {
        const date = new Date(item.Timestamp as string)
        return date.toLocaleTimeString() // Show time for better readability
      } catch (e) {
        return 'N/A'
      }
    })
    
    const datasets = selectedParameters.map((param) => {
      const paramConfig = parameters.find((p) => p.name === param)
      return {
        label: param,
        data: displayData.map((item) => {
          const value = Number(item[param])
          return isNaN(value) ? 0 : value
        }),
        borderColor: paramConfig?.color || "#1a4e7e",
        backgroundColor: `${paramConfig?.color || '#1a4e7e'}33`,
        borderWidth: 1.5,
        pointRadius: 1.5,
        tension: 0.1,
        fill: false,
      }
    })

    return { 
      labels, 
      datasets,
    }
  }

  // Generate bar chart data for parameter comparisons
  const generateBarChartData = (data: Record<string, unknown>[]): ChartData => {
    if (!data || data.length === 0) return { labels: [], datasets: [] }

    // Calculate averages for each parameter
    const averages = selectedParameters.map((param) => {
      const values = data
        .map((item) => {
          const value = item[param]
          return typeof value === 'number' ? value : null
        })
        .filter((val): val is number => val !== null)
      
      return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0
    })

    return {
      labels: selectedParameters,
      datasets: [
        {
          label: "Average Values",
          data: averages,
          backgroundColor: selectedParameters.map((param) => {
            const paramConfig = parameters.find((p) => p.name === param)
            return paramConfig?.color || "#1a4e7e"
          }),
          borderWidth: 1,
        },
      ],
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
      let generatedReportData: Array<{
        Timestamp: string
        BOD: number
        COD: number
        Flow: number
        PH: number
        TSS: number
      }> = []

      // Use history data from Firebase
      if (historyData && historyData.length > 0) {
        // Format the data for the report
        generatedReportData = historyData
          .filter(item => {
            if (!dateRange.from || !dateRange.to) return true;
            try {
              const itemDate = new Date(item.timestamp);
              return itemDate >= dateRange.from && itemDate <= dateRange.to;
            } catch (e) {
              console.error('Error processing date:', item.timestamp, e);
              return false;
            }
          })
          .sort((a, b) => {
            try {
              return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            } catch (e) {
              return 0;
            }
          })
          .map((item) => ({
            Timestamp: formatDate(item.timestamp || new Date()),
            BOD: typeof item.BOD === 'number' ? item.BOD : 0,
            COD: typeof item.COD === 'number' ? item.COD : 0,
            Flow: typeof item.Flow === 'number' ? item.Flow : 0,
            PH: typeof item.PH === 'number' ? item.PH : 0,
            TSS: typeof item.TSS === 'number' ? item.TSS : 0,
          }));

        if (generatedReportData.length === 0) {
          throw new Error("No data available for the selected date range");
        }
      } else {
        throw new Error("No historical data available");
      }

      // Calculate file size based on data length (rough estimate)
      const fileSizeInKB = Math.round(JSON.stringify(generatedReportData).length / 1024 * 100) / 100
      const fileSize = fileSizeInKB > 1024 
        ? `${(fileSizeInKB / 1024).toFixed(1)} MB` 
        : `${fileSizeInKB.toFixed(1)} KB`
      const newReport: Report = {
        id: `RPT-${Date.now()}`,
        name: `${reportTypeName} - ${new Date().toLocaleDateString()}`,
        type: selectedReportType,
        deviceId,
        createdAt: new Date(),
        status: "completed",
        fileSize,
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

  // Handle parameter selection change
  const handleParameterChange = (parameter: string, checked: boolean) => {
    if (checked) {
      setSelectedParameters([...selectedParameters, parameter])
    } else {
      setSelectedParameters(selectedParameters.filter((p) => p !== parameter))
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

      // Get the report type name
      const reportTypeName = reportTypes.find((type) => type.id === report.type)?.name || report.type

      // Export the report with simplified options
      DataExportService.exportReport(reportDataToUse, reportTypeName, format, {
        deviceId: report.deviceId,
        dateRange: {
          from: new Date(report.createdAt.getTime() - 30 * 24 * 60 * 60 * 1000),
          to: report.createdAt,
        }
      })

      toast({
        title: "Download Started",
        description: `Your report is being downloaded as ${format.toUpperCase()}.`,
        duration: 3000,
      })
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
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error Generating Report</AlertTitle>
                  <AlertDescription className="flex flex-col gap-2">
                    <span>{error}</span>
                    {historyLoading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Loading historical data...
                      </span>
                    ) : historyError ? (
                      <span className="text-sm">Failed to load historical data: {historyError}</span>
                    ) : null}
                  </AlertDescription>
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
