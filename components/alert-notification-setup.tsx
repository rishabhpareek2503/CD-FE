"use client"

import { useState, useEffect } from "react"
import { Bell, AlertTriangle, CheckCircle, XCircle, Info, Bug, Database } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import {
  requestNotificationPermission,
  sendTestNotification,
  sendLocalTestNotification,
  createTestUserIfNeeded,
} from "@/lib/firebase-messaging"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { isSupported } from "firebase/messaging"
import { Input } from "@/components/ui/input"

export function AlertNotificationSetup() {
  const { user } = useAuth()
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [setupStatus, setSetupStatus] = useState<"idle" | "success" | "error" | "config-error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<"unknown" | "ok" | "error">("unknown")
  const [isMessagingSupported, setIsMessagingSupported] = useState(false)
  const [testUserId, setTestUserId] = useState("")

  // Check if notifications are supported
  const notificationsSupported =
    typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator

  // Check if VAPID key is configured
  const vapidKeyConfigured = !!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

  useEffect(() => {
    // Set initial test user ID from the authenticated user if available
    if (user && !testUserId) {
      setTestUserId(user.uid)
    }

    // Check if notifications are already enabled
    if (notificationsSupported && Notification.permission === "granted") {
      setNotificationsEnabled(true)
    }

    // Check if VAPID key is configured
    if (!vapidKeyConfigured) {
      setSetupStatus("config-error")
      setErrorMessage("NEXT_PUBLIC_FIREBASE_VAPID_KEY environment variable is not set")
    }

    // Check if API is reachable
    checkApiStatus()

    const checkMessagingSupport = async () => {
      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        try {
          const supported = await isSupported()
          setIsMessagingSupported(supported)
        } catch (error) {
          console.error("Error checking messaging support:", error)
          setIsMessagingSupported(false)
        }
      } else {
        setIsMessagingSupported(false)
      }
    }

    checkMessagingSupport()
  }, [notificationsSupported, vapidKeyConfigured, user, testUserId])

  const checkApiStatus = async () => {
    try {
      const response = await fetch("/api/test")
      if (response.ok) {
        setApiStatus("ok")
      } else {
        setApiStatus("error")
      }
    } catch (error) {
      console.error("Error checking API status:", error)
      setApiStatus("error")
    }
  }

  const handleEnableNotifications = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to enable notifications",
        variant: "destructive",
      })
      return
    }

    if (!vapidKeyConfigured) {
      toast({
        title: "Configuration Error",
        description: "Notification system is not properly configured. Please contact support.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setSetupStatus("idle")
    setDebugInfo(null)

    try {
      const token = await requestNotificationPermission(user.uid)

      if (token) {
        setNotificationsEnabled(true)
        setSetupStatus("success")
        toast({
          title: "Notifications Enabled",
          description: "You will now receive real-time alerts on your device",
        })
      } else {
        setSetupStatus("error")
        toast({
          title: "Notification Setup Failed",
          description: "Please check your browser settings and try again",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error setting up notifications:", error)
      setSetupStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Unknown error")
      toast({
        title: "Notification Setup Failed",
        description: "An error occurred while setting up notifications",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestNotification = async () => {
    if (!user && !testUserId) {
      toast({
        title: "User ID Required",
        description: "Please log in or enter a test user ID",
        variant: "destructive",
      })
      return
    }

    const userId = testUserId || user?.uid

    setIsLoading(true)
    setDebugInfo(null)

    try {
      if (apiStatus === "ok") {
        await sendTestNotification(userId)
        toast({
          title: "Test Notification Sent",
          description: "You should receive a notification shortly",
        })
      } else {
        // Fallback to local notification if API is not available
        await sendLocalTestNotification()
        toast({
          title: "Local Test Notification Sent",
          description: "A browser notification was displayed as a fallback",
        })
      }
    } catch (error) {
      console.error("Error sending test notification:", error)

      // Set detailed error message for debugging
      const errorMessage = error instanceof Error ? error.message : String(error)
      setDebugInfo(errorMessage)

      toast({
        title: "Test Failed",
        description: "Failed to send test notification. See details below.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTestUser = async () => {
    if (!testUserId) {
      toast({
        title: "User ID Required",
        description: "Please enter a test user ID",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await createTestUserIfNeeded(testUserId)
      toast({
        title: "Test User Created",
        description: "Test user document created or verified in Firestore",
      })
    } catch (error) {
      console.error("Error creating test user:", error)
      toast({
        title: "Error Creating Test User",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!notificationsSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mobile Alerts</CardTitle>
          <CardDescription>Receive real-time alerts on your device</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Not Supported</AlertTitle>
            <AlertDescription>
              Push notifications are not supported in your browser. Please use a modern browser like Chrome, Firefox, or
              Edge.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="setup">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="setup">Notification Setup</TabsTrigger>
        <TabsTrigger value="debug">Debug Info</TabsTrigger>
      </TabsList>

      <TabsContent value="setup">
        <Card>
          <CardHeader>
            <CardTitle>Mobile Alerts</CardTitle>
            <CardDescription>Receive real-time alerts on your device</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {setupStatus === "config-error" && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Configuration Error</AlertTitle>
                <AlertDescription>
                  <p>The notification system is not properly configured.</p>
                  <p className="mt-2 text-sm">Error: {errorMessage}</p>
                  <p className="mt-2 text-sm">
                    Please make sure the NEXT_PUBLIC_FIREBASE_VAPID_KEY environment variable is set.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {setupStatus === "success" && (
              <Alert variant="success" className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Notifications Enabled</AlertTitle>
                <AlertDescription className="text-green-700">
                  You will now receive real-time alerts on your device when critical issues are detected.
                </AlertDescription>
              </Alert>
            )}

            {setupStatus === "error" && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Setup Failed</AlertTitle>
                <AlertDescription>
                  <p>We couldn't enable notifications. Please check your browser settings and try again.</p>
                  {errorMessage && <p className="mt-2 text-sm">Error: {errorMessage}</p>}
                </AlertDescription>
              </Alert>
            )}

            {apiStatus === "error" && (
              <Alert>
                <Bug className="h-4 w-4" />
                <AlertTitle>API Connectivity Issue</AlertTitle>
                <AlertDescription>
                  <p>We're having trouble connecting to the notification service.</p>
                  <p className="mt-2 text-sm">Local notifications will be used as a fallback.</p>
                </AlertDescription>
              </Alert>
            )}

            {debugInfo && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Debug Information</AlertTitle>
                <AlertDescription>
                  <p className="text-sm font-mono break-all">{debugInfo}</p>
                </AlertDescription>
              </Alert>
            )}

            {!vapidKeyConfigured && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Developer Note</AlertTitle>
                <AlertDescription>
                  <p>The NEXT_PUBLIC_FIREBASE_VAPID_KEY environment variable is not set.</p>
                  <p className="mt-2 text-sm">
                    You need to add this environment variable to enable push notifications.
                  </p>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                    NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here
                  </pre>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <Label htmlFor="push-notifications" className="flex flex-col space-y-1">
                  <span>Push Notifications</span>
                  <span className="text-xs text-muted-foreground">
                    Get instant alerts when critical issues are detected
                  </span>
                </Label>
              </div>
              <Switch
                id="push-notifications"
                checked={notificationsEnabled}
                onCheckedChange={() => {
                  if (!notificationsEnabled) {
                    handleEnableNotifications()
                  } else {
                    toast({
                      title: "Notifications Already Enabled",
                      description: "To disable notifications, use your browser settings",
                    })
                  }
                }}
                disabled={isLoading || !vapidKeyConfigured}
              />
            </div>

            <div className="pt-2 text-sm text-muted-foreground">
              <p>You'll receive alerts for:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Critical parameter thresholds exceeded</li>
                <li>Equipment malfunctions</li>
                <li>System maintenance requirements</li>
                <li>Compliance issues</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button
              variant="outline"
              onClick={handleTestNotification}
              disabled={!notificationsEnabled || isLoading || !vapidKeyConfigured}
              className="w-full"
            >
              {isLoading ? "Processing..." : "Send Test Notification"}
            </Button>

            {user && (
              <div className="text-xs text-muted-foreground w-full text-center">
                User ID: {user.uid.substring(0, 8)}...
              </div>
            )}
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="debug">
        <Card>
          <CardHeader>
            <CardTitle>Notification System Debug</CardTitle>
            <CardDescription>Technical information for troubleshooting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">System Status</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">Browser Notifications:</div>
                <div>{notificationsSupported ? "Supported" : "Not Supported"}</div>

                <div className="font-medium">Permission Status:</div>
                <div>{typeof Notification !== "undefined" ? Notification.permission : "N/A"}</div>

                <div className="font-medium">VAPID Key:</div>
                <div>{vapidKeyConfigured ? "Configured" : "Not Configured"}</div>

                <div className="font-medium">API Status:</div>
                <div
                  className={
                    apiStatus === "ok" ? "text-green-600" : apiStatus === "error" ? "text-red-600" : "text-yellow-600"
                  }
                >
                  {apiStatus === "ok" ? "Connected" : apiStatus === "error" ? "Error" : "Unknown"}
                </div>

                <div className="font-medium">User Authenticated:</div>
                <div>{user ? "Yes" : "No"}</div>

                <div className="font-medium">Messaging Supported:</div>
                <div>{isMessagingSupported ? "Yes" : "No"}</div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Test User Setup</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Enter test user ID"
                    value={testUserId}
                    onChange={(e) => setTestUserId(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleCreateTestUser} disabled={isLoading || !testUserId}>
                    <Database className="h-4 w-4 mr-1" />
                    Create
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This will create a test user document in Firestore with a dummy FCM token for testing
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Actions</h3>
              <div className="flex flex-col space-y-2">
                <Button size="sm" variant="outline" onClick={checkApiStatus}>
                  Test API Connectivity
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await sendLocalTestNotification()
                      toast({
                        title: "Local Notification Sent",
                        description: "Check if you received a browser notification",
                      })
                    } catch (error) {
                      toast({
                        title: "Local Notification Failed",
                        description: error instanceof Error ? error.message : "Unknown error",
                        variant: "destructive",
                      })
                    }
                  }}
                  disabled={Notification.permission !== "granted"}
                >
                  Test Local Notification
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestNotification}
                  disabled={isLoading || !testUserId}
                >
                  Test API Notification
                </Button>
              </div>
            </div>

            {debugInfo && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Last Error</h3>
                <pre className="p-2 bg-gray-100 rounded text-xs overflow-x-auto whitespace-pre-wrap">{debugInfo}</pre>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Environment</h3>
              <pre className="p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                {`Browser: ${typeof window !== "undefined" ? window.navigator.userAgent : "SSR"}
Firebase Messaging: ${isMessagingSupported ? "Initialized" : "Not Initialized"}
API Base URL: ${typeof window !== "undefined" ? window.location.origin : "SSR"}`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
