"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Factory, MapPin, Calendar, Settings } from "lucide-react"
import type { DeviceConfig } from "@/lib/device-config"

interface DeviceSelectorProps {
  selectedDeviceId: string
  availableDevices: DeviceConfig[]
  onDeviceSelect: (deviceId: string) => void
  selectedDevice?: DeviceConfig
}

export function DeviceSelector({
  selectedDeviceId,
  availableDevices,
  onDeviceSelect,
  selectedDevice,
}: DeviceSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Select Device</label>
          <Select value={selectedDeviceId} onValueChange={onDeviceSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a device" />
            </SelectTrigger>
            <SelectContent>
              {availableDevices.map((device) => (
                <SelectItem key={device.id} value={device.id}>
                  <div className="flex items-center gap-2">
                    <Factory className="h-4 w-4" />
                    <span>{device.name}</span>
                    <Badge variant={device.status === "online" ? "default" : "secondary"} className="ml-2">
                      {device.status}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedDevice && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-blue-500" />
              {selectedDevice.name}
            </CardTitle>
            <CardDescription>Device ID: {selectedDevice.id}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-gray-600">{selectedDevice.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium">Type</p>
                  <p className="text-gray-600">{selectedDevice.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium">Installed</p>
                  <p className="text-gray-600">{new Date(selectedDevice.installationDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium">Last Maintenance</p>
                  <p className="text-gray-600">{new Date(selectedDevice.lastMaintenance).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
