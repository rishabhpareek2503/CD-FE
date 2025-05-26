"use client"

import { AlertsDisplay } from "@/components/alerts-display"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { useDevices } from "@/providers/device-provider"
import { Skeleton } from "@/components/ui/skeleton"

export default function AlertsPage() {
  const [selectedDevice, setSelectedDevice] = useState<string | undefined>(undefined)
  const { devices, loading } = useDevices()

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">System Alerts</h1>

      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Devices</TabsTrigger>
          {loading ? (
            <TabsTrigger value="loading" disabled>
              <Skeleton className="h-4 w-20" />
            </TabsTrigger>
          ) : (
            devices.map((device) => (
              <TabsTrigger key={device.id} value={device.id} onClick={() => setSelectedDevice(device.id)}>
                {device.name}
              </TabsTrigger>
            ))
          )}
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <AlertsDisplay limit={20} />
        </TabsContent>

        {devices.map((device) => (
          <TabsContent key={device.id} value={device.id} className="mt-4">
            <AlertsDisplay deviceId={device.id} limit={20} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
