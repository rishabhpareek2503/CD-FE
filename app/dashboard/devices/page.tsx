"use client"

import { useState } from "react"
import Link from "next/link"
import { useDeviceSelection } from "@/hooks/use-device-selection"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Cpu, Factory, MapPin, Plus, Search, Settings } from "lucide-react"
import { createTestDataForAllDevices, createRandomTestData } from "@/lib/test-data-generator"

export default function DevicesPage() {
  const { availableDevices, selectDevice, selectedDeviceId } = useDeviceSelection()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isGeneratingData, setIsGeneratingData] = useState(false)

  // Filter devices based on search and status
  const filteredDevices = availableDevices.filter((device) => {
    const matchesSearch =
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.location.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || device.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleGenerateTestData = async (deviceId?: string) => {
    setIsGeneratingData(true)
    try {
      if (deviceId) {
        await createRandomTestData(deviceId)
      } else {
        await createTestDataForAllDevices()
      }
    } catch (error) {
      console.error("Error generating test data:", error)
    } finally {
      setIsGeneratingData(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Device Management
          </h1>
          <p className="text-gray-500 mt-1">Monitor and manage your wastewater treatment devices</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleGenerateTestData()} disabled={isGeneratingData}>
            {isGeneratingData ? "Generating..." : "Generate Test Data"}
          </Button>
          <Button asChild>
            <Link href="/dashboard/devices/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Device
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search devices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDevices.map((device) => (
              <Card
                key={device.id}
                className={`border-2 shadow-md overflow-hidden transition-all hover:shadow-lg ${
                  selectedDeviceId === device.id ? "border-blue-500 ring-2 ring-blue-200" : "border-primary/20"
                }`}
              >
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center">
                        <Cpu className="h-5 w-5 mr-2 text-blue-500" />
                        {device.name}
                      </CardTitle>
                      <CardDescription>ID: {device.id}</CardDescription>
                    </div>
                    <Badge
                      variant={
                        device.status === "online"
                          ? "default"
                          : device.status === "offline"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Location</p>
                          <p className="text-sm">{device.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Factory className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Type</p>
                          <p className="text-sm">{device.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Last Maintenance</p>
                          <p className="text-sm">{new Date(device.lastMaintenance).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => selectDevice(device.id)}
                        className={selectedDeviceId === device.id ? "bg-blue-50" : ""}
                      >
                        {selectedDeviceId === device.id ? "Selected" : "Select"}
                      </Button>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateTestData(device.id)}
                          disabled={isGeneratingData}
                        >
                          Test Data
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/devices/${device.id}`}>
                            <Settings className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Device List</CardTitle>
              <CardDescription>
                Showing {filteredDevices.length} of {availableDevices.length} devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredDevices.map((device) => (
                  <div
                    key={device.id}
                    className={`flex items-center justify-between p-4 border rounded-lg transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      selectedDeviceId === device.id ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Cpu className="h-5 w-5 text-blue-500" />
                        <div>
                          <h3 className="font-medium">{device.name}</h3>
                          <p className="text-sm text-gray-500">
                            {device.id} • {device.location}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <Badge
                        variant={
                          device.status === "online"
                            ? "default"
                            : device.status === "offline"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                      </Badge>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => selectDevice(device.id)}
                          className={selectedDeviceId === device.id ? "bg-blue-50" : ""}
                        >
                          {selectedDeviceId === device.id ? "Selected" : "Select"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateTestData(device.id)}
                          disabled={isGeneratingData}
                        >
                          Test Data
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/devices/${device.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
