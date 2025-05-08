"use client"

import { useState } from "react"
import { CalendarIcon, FileText, Printer } from "lucide-react"

import { useSensorData } from "@/hooks/use-sensor-data"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ReportExportButton } from "@/components/report-export-button"
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Define parameter thresholds and units
const parameters = [
  { name: "pH", unit: "", min: 6.5, max: 8.5 },
  { name: "BOD", unit: "mg/L", min: 0, max: 30 },
  { name: "COD", unit: "mg/L", min: 0, max: 250 },
  { name: "TSS", unit: "mg/L", min: 0, max: 30 },
  { name: "flow", unit: "m³/h", min: 0, max: 100 },
  { name: "temperature", unit: "°C", min: 15, max: 35 },
  { name: "DO", unit: "mg/L", min: 4, max: 8 },
  { name: "conductivity", unit: "μS/cm", min: 500, max: 1500 },
  { name: "turbidity", unit: "NTU", min: 0, max: 5 },
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
}

export default function ReportsPage() {
  const [selectedDevice, setSelectedDevice] = useState("all")
  const [selectedReportType, setSelectedReportType] = useState("all")
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  })
  const [selectedParameters, setSelectedParameters] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const { devices } = useSensorData()

  // Mock reports data
  const reports: Report[] = [
    {
      id: "RPT-001",
      name: "Daily Operations Report",
      type: "daily",
      deviceId: "WW-001",
      createdAt: new Date(2023, 5, 15),
      status: "completed",
      fileSize: "1.2 MB",
    },
    {
      id: "RPT-002",
      name: "Weekly Performance Summary",
      type: "weekly",
      deviceId: "WW-002",
      createdAt: new Date(2023, 5, 10),
      status: "completed",
      fileSize: "3.5 MB",
    },
    {
      id: "RPT-003",
      name: "Monthly Compliance Report",
      type: "compliance",
      deviceId: "WW-001",
      createdAt: new Date(2023, 4, 30),
      status: "completed",
      fileSize: "5.8 MB",
    },
    {
      id: "RPT-004",
      name: "pH Exceedance Incident Report",
      type: "incident",
      deviceId: "WW-003",
      createdAt: new Date(2023, 5, 5),
      status: "completed",
      fileSize: "2.1 MB",
    },
  ]

  // Filter reports based on selections
  const filteredReports = reports.filter((report) => {
    const matchesDevice = selectedDevice === "all" || report.deviceId === selectedDevice
    const matchesType = selectedReportType === "all" || report.type === selectedReportType
    const matchesDate =
      (!dateRange.from || report.createdAt >= dateRange.from) && (!dateRange.to || report.createdAt <= dateRange.to)

    return matchesDevice && matchesType && matchesDate
  })

  // Generate a new report
  const handleGenerateReport = () => {
    setGenerating(true)
    setError(null)

    // In a real app, this would trigger a Firebase Cloud Function to generate the report
    setTimeout(() => {
      setGenerating(false)
      toast({
        title: "Report Generation Started",
        description: "You will be notified when the report is ready.",
        duration: 5000,
      })
    }, 2000)
  }

  const getDeviceDetails = async (deviceId: string) => {
    try {
      const deviceRef = doc(db, "devices", deviceId)
      const deviceSnap = await getDoc(deviceRef)

      if (deviceSnap.exists()) {
        return deviceSnap.data()
      } else {
        console.log("No such document!")
        return null
      }
    } catch (error) {
      console.error("Error fetching device details:", error)
      return null
    }
  }

  const handleExportReport = async (report: Report, format: "pdf" | "excel" | "csv") => {
    try {
      setLoading(true)

      // For a real implementation, fetch the actual report data
      // Here we'll simulate fetching data for the report
      const deviceId = report.deviceId

      // Get device details
      const deviceDoc = await getDeviceDetails(deviceId)

      // Fetch sensor readings for the device
      const readingsQuery = query(
        collection(db, "deviceReadings"),
        where("deviceId", "==", deviceId),
        orderBy("timestamp", "desc"),
        limit(100), // Limit to last 100 readings
      )

      const readingsSnapshot = await getDocs(readingsQuery)
      const readings: any[] = []

      readingsSnapshot.forEach((doc) => {
        readings.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      // Format the data for export
      const formattedData = readings.map((reading) => {
        const formattedReading: Record<string, any> = {
          Timestamp:
            reading.timestamp instanceof Date
              ? reading.timestamp.toLocaleString()
              : new Date(reading.timestamp).toLocaleString(),
        }

        parameters.forEach((param) => {
          formattedReading[param.name] = reading[param.name.toLowerCase()] || 0
        })

        return formattedReading
      })

      // Export the report using the ReportExportButton component
      const reportExportButton = document.createElement("div")
      document.body.appendChild(reportExportButton)

      // Create a ReportExportButton instance and trigger the export
      const reportType = reportTypes.find((type) => type.id === report.type)?.name || report.type

      // Use the DataExportService directly
      import("@/lib/export-service")
        .then(({ DataExportService }) => {
          DataExportService.exportReport(
            formattedData.length > 0 ? formattedData : [{ "No Data": "No data available for this report" }],
            reportType,
            format,
            {
              deviceId,
              dateRange: {
                from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                to: new Date(),
              },
            },
          )

          setLoading(false)
          toast({
            title: "Export Successful",
            description: `Report exported as ${format.toUpperCase()}`,
            duration: 3000,
          })
        })
        .catch((err) => {
          console.error("Error importing export service:", err)
          setLoading(false)
          setError("Failed to export report")
        })

      document.body.removeChild(reportExportButton)
    } catch (error) {
      console.error("Error exporting report:", error)
      setError("Failed to export report. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <div className="flex items-center gap-2">
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
                          {device.id} - {device.location}
                        </SelectItem>
                      ))}
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
                    <Calendar mode="range" selected={dateRange} onSelect={setDateRange as any} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Parameters to Include</Label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {parameters.map((param) => (
                    <div key={param.name} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`param-${param.name}`}
                        className="h-4 w-4 rounded border-gray-300"
                        checked={selectedParameters.includes(param.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedParameters([...selectedParameters, param.name])
                          } else {
                            setSelectedParameters(selectedParameters.filter((p) => p !== param.name))
                          }
                        }}
                      />
                      <Label htmlFor={`param-${param.name}`} className="text-sm">
                        {param.name}
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
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Reset</Button>
              <Button onClick={handleGenerateReport} disabled={generating} className="bg-[#1a4e7e] hover:bg-[#153d62]">
                {generating ? "Generating..." : "Generate Report"}
              </Button>
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
                {filteredReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <FileText className="mr-2 h-5 w-5 text-blue-600" />
                        <span className="font-medium">{report.name}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {report.id} • {report.deviceId} • {report.createdAt.toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400">{report.fileSize}</div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                      </Button>
                      <ReportExportButton
                        data={[{ Sample: "Data" }]} // This would be actual report data in a real implementation
                        reportType={reportTypes.find((type) => type.id === report.type)?.name || report.type}
                        deviceId={report.deviceId}
                        dateRange={{
                          from: new Date(report.createdAt.getTime() - 30 * 24 * 60 * 60 * 1000),
                          to: report.createdAt,
                        }}
                        size="sm"
                      />
                    </div>
                  </div>
                ))}
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
    </div>
  )
}

// Helper function for toast notifications
function toast({ title, description, variant = "default", duration = 3000 }) {
  // This is a simple implementation - in a real app, you would use a proper toast library
  console.log(`[${variant.toUpperCase()}] ${title}: ${description}`)

  // Create a toast element
  const toastEl = document.createElement("div")
  toastEl.className = `fixed bottom-4 right-4 p-4 rounded-md shadow-lg ${
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
