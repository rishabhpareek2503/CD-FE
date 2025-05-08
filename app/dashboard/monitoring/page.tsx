"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Bell, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AutomatedFaultMonitoring } from "@/components/automated-fault-monitoring"
import { NotificationPreferences } from "@/components/notification-preferences"

export default function MonitoringPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"monitoring" | "notifications">("monitoring")

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent flex items-center">
            <Settings className="mr-2 h-6 w-6 text-blue-600 dark:text-blue-400" />
            Automated Monitoring
          </h1>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "monitoring" | "notifications")}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="monitoring">
            <Settings className="mr-2 h-4 w-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-6 mt-6">
          <AutomatedFaultMonitoring />

          <Card>
            <CardHeader>
              <CardTitle>Monitoring History</CardTitle>
              <CardDescription>Recent monitoring events and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Monitoring history will be displayed here. This feature is coming soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 mt-6">
          <NotificationPreferences />
        </TabsContent>
      </Tabs>
    </div>
  )
}
