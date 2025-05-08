"use client"

import { useState, useEffect } from "react"
import { CalendarIcon, WifiOff } from "lucide-react"

import { useSensorData } from "@/hooks/use-sensor-data"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { DeviceExportButton } from "@/components/device-export-button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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

export default function HistoryPage() {
  const [selectedDevice, setSelectedDevice] = useState<string>("")
  const [selectedParameter, setSelectedParameter] = useState("All Parameters")
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  })

  const { devices, historicalData, loading } = useSensorData(selectedDevice)

  // Set the first device as selected when devices are loaded
  useEffect(() => {
    if (devices.length > 0 && !selectedDevice) {
      setSelectedDevice(devices[0].id)
    }
  }, [devices, selectedDevice])

  // Filter data based on selections
  const filteredData = historicalData.filter((entry) => {
    const matchesDate =
      (!dateRange.from || entry.timestamp >= dateRange.from) && (!dateRange.to || entry.timestamp <= dateRange.to)

    return matchesDate
  })

  const formattedHistoricalData = filteredData.map((entry) => {
    const formattedEntry: { [key: string]: string | number | boolean } = {
      Timestamp: entry.timestamp.toLocaleString(),
    }

    parameters.forEach((param) => {
      formattedEntry[param.name] = entry[param.name.toLowerCase() as keyof typeof entry] as number
    })

    return formattedEntry
  })

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

  const selectedDeviceObj = devices.find((d) => d.id === selectedDevice) || null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Historical Data</h1>
        {selectedDeviceObj && (
          <DeviceExportButton
            device={selectedDeviceObj}
            data={formattedHistoricalData}
            dateRange={dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined}
            disabled={loading || !historicalData.length}
            type="history"
          />
        )}
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
                  {devices.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.id} - {device.location}
                    </SelectItem>
                  ))}
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

      <Tabs defaultValue="table" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="chart">Chart View</TabsTrigger>
        </TabsList>
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
                          <TableRow key={index} className={entry.isOffline ? "bg-red-50/30 dark:bg-red-950/30" : ""}>
                            <TableCell>
                              {entry.isOffline && <WifiOff className="h-3 w-3 text-red-500 inline mr-1" />}
                              {entry.timestamp.toLocaleString()}
                            </TableCell>
                            {selectedParameter === "All Parameters" ? (
                              parameters.map((param) => {
                                const value = entry[param.name.toLowerCase() as keyof typeof entry] as number
                                const isLow = value < param.min
                                const isHigh = value > param.max
                                const textColor = isLow ? "text-blue-600" : isHigh ? "text-red-600" : ""

                                return (
                                  <TableCell key={param.name} className={textColor}>
                                    {value}
                                  </TableCell>
                                )
                              })
                            ) : (
                              <TableCell>{entry[selectedParameter.toLowerCase() as keyof typeof entry]}</TableCell>
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
              <div className="h-[400px] w-full rounded-md border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                <p className="text-sm text-gray-500">Chart visualization would appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
