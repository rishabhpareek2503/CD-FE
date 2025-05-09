"use client"

import { useState } from "react"
import { CalendarIcon, ChevronDown, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"

import { useRealtimeHistory } from "@/hooks/use-realtime-history"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

// Define parameter thresholds and units
const parameters = [
  { name: "PH", unit: "", min: 6.5, max: 8.5, key: "PH" },
  { name: "BOD", unit: "mg/L", min: 0, max: 30, key: "BOD" },
  { name: "COD", unit: "mg/L", min: 0, max: 250, key: "COD" },
  { name: "TSS", unit: "mg/L", min: 0, max: 30, key: "TSS" },
  { name: "Flow", unit: "m³/h", min: 0, max: 100, key: "Flow" },
]

// Chart colors for different parameters
const chartColors = {
  PH: "rgb(255, 99, 132)",
  BOD: "rgb(54, 162, 235)",
  COD: "rgb(255, 206, 86)",
  TSS: "rgb(75, 192, 192)",
  Flow: "rgb(153, 102, 255)",
}

// Helper function to safely format dates
const formatDate = (date: Date | string | undefined | null): string => {
  if (!date) return "N/A"
  if (date instanceof Date) {
    return date.toLocaleString()
  }
  if (typeof date === "string") {
    return date
  }
  return String(date)
}

export default function HistoryPage() {
  const [selectedDevice, setSelectedDevice] = useState<string>("RPi001")
  const [selectedParameter, setSelectedParameter] = useState("All Parameters")
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  })
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  const { historicalData, loading, error } = useRealtimeHistory(selectedDevice)

  // Filter data based on selections
  const filteredData = historicalData.filter((entry) => {
    const entryDate = entry.timestamp
    const matchesDate =
      (!dateRange.from || (entryDate && entryDate >= dateRange.from)) &&
      (!dateRange.to || (entryDate && entryDate <= dateRange.to))

    return matchesDate
  })

  // Prepare chart data
  const prepareChartData = () => {
    if (filteredData.length === 0) return null

    // Sort data by timestamp
    const sortedData = [...filteredData].sort((a, b) => {
      const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : 0
      const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : 0
      return aTime - bTime
    })

    // Prepare labels (timestamps)
    const labels = sortedData.map((entry) => {
      if (entry.timestamp instanceof Date) {
        return format(entry.timestamp, "yyyy-MM-dd HH:mm:ss")
      }
      return String(entry.Timestamp || "Unknown")
    })

    // If a specific parameter is selected
    if (selectedParameter !== "All Parameters") {
      const paramKey = parameters.find((p) => p.name === selectedParameter)?.key || selectedParameter
      const paramData = sortedData.map((entry) => {
        const value = entry[paramKey as keyof typeof entry]
        return typeof value === "number" ? value : 0
      })

      return {
        labels,
        datasets: [
          {
            label: selectedParameter,
            data: paramData,
            borderColor: chartColors[paramKey as keyof typeof chartColors] || "rgb(75, 192, 192)",
            backgroundColor: `${chartColors[paramKey as keyof typeof chartColors] || "rgb(75, 192, 192)"}33`,
            tension: 0.1,
          },
        ],
      }
    }

    // For all parameters
    const datasets = parameters.map((param) => {
      return {
        label: param.name,
        data: sortedData.map((entry) => {
          const value = entry[param.key as keyof typeof entry]
          return typeof value === "number" ? value : 0
        }),
        borderColor: chartColors[param.key as keyof typeof chartColors] || "rgb(75, 192, 192)",
        backgroundColor: `${chartColors[param.key as keyof typeof chartColors] || "rgb(75, 192, 192)"}33`,
        tension: 0.1,
      }
    })

    return {
      labels,
      datasets,
    }
  }

  const chartData = prepareChartData()

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: `Sensor Data History - ${selectedParameter}`,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  }

  // Loading state
  if (loading && historicalData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold tracking-tight">Historical Data</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Data Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Historical Data Records</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Historical Data</h1>
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Historical Data</h1>
        <Button
          variant="outline"
          onClick={() => {
            // Refresh data by forcing a re-render
            setSelectedDevice((prev) => prev)
          }}
        >
          Refresh Data
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Filters</CardTitle>
          <CardDescription>Select filters to view historical data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="device-filter">Device</Label>
              <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                <SelectTrigger id="device-filter">
                  <SelectValue placeholder="Select device" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RPi001">RPi001</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parameter-filter">Parameter</Label>
              <Select value={selectedParameter} onValueChange={setSelectedParameter}>
                <SelectTrigger id="parameter-filter">
                  <SelectValue placeholder="Select parameter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Parameters">All Parameters</SelectItem>
                  {parameters.map((param) => (
                    <SelectItem key={param.name} value={param.name}>
                      {param.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="chart">Chart View</TabsTrigger>
        </TabsList>

        {/* List View - Similar to the screenshots provided */}
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Historical Data List</CardTitle>
              <CardDescription>
                Showing {filteredData.length} records for {selectedDevice}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredData.length === 0 ? (
                <Alert>
                  <AlertTitle>No data available</AlertTitle>
                  <AlertDescription>
                    No historical data found for the selected device and date range. Try adjusting your filters.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {filteredData.map((entry, index) => {
                    const entryId = entry.id
                    const isExpanded = expandedItem === entryId

                    return (
                      <Collapsible
                        key={index}
                        open={isExpanded}
                        onOpenChange={() => setExpandedItem(isExpanded ? null : entryId)}
                        className="border rounded-md"
                      >
                        <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                          <div className="flex items-center">
                            <span>{entry.id}</span>
                          </div>
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="border-t p-4">
                          <div className="grid gap-2 pl-6 border-l-2 border-gray-200 dark:border-gray-700">
                            {parameters.map((param) => {
                              const value = entry[param.key as keyof typeof entry]
                              const numValue = typeof value === "number" ? value : 0
                              const isLow = numValue < param.min
                              const isHigh = numValue > param.max
                              const textColor = isLow ? "text-blue-600" : isHigh ? "text-red-600" : ""

                              return (
                                <div key={param.name} className="flex justify-between">
                                  <span>{param.name}:</span>
                                  <span className={textColor}>{numValue}</span>
                                </div>
                              )
                            })}
                            <div className="flex justify-between">
                              <span>Timestamp:</span>
                              <span>{formatDate(entry.Timestamp)}</span>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Historical Data Records</CardTitle>
              <CardDescription>
                Showing {filteredData.length} records for {selectedDevice}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredData.length === 0 ? (
                <Alert>
                  <AlertTitle>No data available</AlertTitle>
                  <AlertDescription>
                    No historical data found for the selected device and date range. Try adjusting your filters.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          {selectedParameter === "All Parameters" ? (
                            parameters.map((param) => (
                              <TableHead key={param.name}>
                                {param.name} ({param.unit})
                              </TableHead>
                            ))
                          ) : (
                            <TableHead>
                              {selectedParameter} ({parameters.find((p) => p.name === selectedParameter)?.unit || ""})
                            </TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData.slice(0, 10).map((entry, index) => (
                          <TableRow key={index}>
                            <TableCell>{formatDate(entry.timestamp)}</TableCell>
                            {selectedParameter === "All Parameters" ? (
                              parameters.map((param) => {
                                const value = entry[param.key as keyof typeof entry]
                                const numValue = typeof value === "number" ? value : 0
                                const isLow = numValue < param.min
                                const isHigh = numValue > param.max
                                const textColor = isLow ? "text-blue-600" : isHigh ? "text-red-600" : ""

                                return (
                                  <TableCell key={param.name} className={textColor}>
                                    {numValue}
                                  </TableCell>
                                )
                              })
                            ) : (
                              <TableCell>
                                {(() => {
                                  const paramKey = parameters.find((p) => p.name === selectedParameter)?.key
                                  if (!paramKey) return 0
                                  const value = entry[paramKey as keyof typeof entry]
                                  return typeof value === "number" ? value : 0
                                })()}
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-end space-x-2 py-4">
                    <Button variant="outline" size="sm" disabled>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm">
                      Next
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Historical Data Chart</CardTitle>
              <CardDescription>Visual representation of historical data</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData ? (
                <div className="h-[400px] w-full">
                  <Line data={chartData} options={chartOptions} />
                </div>
              ) : (
                <Alert>
                  <AlertTitle>No data available</AlertTitle>
                  <AlertDescription>
                    No historical data found for the selected device and date range. Try adjusting your filters.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
