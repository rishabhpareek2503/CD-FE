"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { useUserDevices } from "@/lib/user-device-access"
import { LiveDataDisplay } from "@/components/live-data-display"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { LogOut, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function UserSensorDashboard() {
  const { devices, loading: loadingDevices, error: devicesError } = useUserDevices()
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const router = useRouter()

  // Check authentication state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.email) {
        setUserEmail(user.email)
      } else {
        // Redirect to login if not authenticated
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  // Set the first device as selected when devices load
  useEffect(() => {
    if (devices.length > 0 && !selectedDevice) {
      setSelectedDevice(devices[0])
    }
  }, [devices, selectedDevice])

  // Handle logout
  const handleLogout = async () => {
    try {
      await auth.signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // Handle refresh
  const handleRefresh = () => {
    window.location.reload()
  }

  // Loading state
  if (loadingDevices) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-[500px] w-full" />
      </div>
    )
  }

  // Error state
  if (devicesError) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load your devices. Please try again later.</AlertDescription>
        </Alert>
      </div>
    )
  }

  // No devices state
  if (devices.length === 0) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Sensor Dashboard</h1>
          <div className="space-x-2">
            <Button onClick={handleRefresh} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleLogout} size="sm" variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>No Devices Found</CardTitle>
            <CardDescription>
              Your account ({userEmail}) doesn't have access to any sensor devices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Please contact your administrator to get access to sensor devices, or check if your email address is
              correctly associated with your devices.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sensor Dashboard</h1>
        <div className="space-x-2">
          <Button onClick={handleRefresh} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleLogout} size="sm" variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Sensor Devices</CardTitle>
          <CardDescription>
            Showing sensor data for {userEmail}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length > 1 ? (
            <Tabs defaultValue={selectedDevice || devices[0]} className="space-y-4">
              <TabsList className="w-full">
                {devices.map((deviceId) => (
                  <TabsTrigger
                    key={deviceId}
                    value={deviceId}
                    onClick={() => setSelectedDevice(deviceId)}
                    className="flex-1"
                  >
                    Device {deviceId}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {devices.map((deviceId) => (
                <TabsContent key={deviceId} value={deviceId} className="space-y-4">
                  <LiveDataDisplay deviceId={deviceId} />
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <LiveDataDisplay deviceId={devices[0]} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
