"use client"

import { useState, useEffect } from "react"
import { Bell, Mail, MessageSquare, Phone } from "lucide-react"
import { doc, getDoc, updateDoc } from "firebase/firestore"

import { useAuth } from "@/hooks/use-auth"
import { db } from "@/lib/firebase"
import { requestNotificationPermission } from "@/lib/firebase-messaging"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

export interface NotificationPreferences {
  pushEnabled: boolean
  emailEnabled: boolean
  smsEnabled: boolean
  whatsappEnabled: boolean
}

export function NotificationPreferences() {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    pushEnabled: false,
    emailEnabled: false,
    smsEnabled: false,
    whatsappEnabled: false,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return

      try {
        const userRef = doc(db, "users", user.uid)
        const userDoc = await getDoc(userRef)

        if (userDoc.exists() && userDoc.data().notificationPreferences) {
          setPreferences(userDoc.data().notificationPreferences)
        }
      } catch (error) {
        console.error("Error fetching notification preferences:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPreferences()
  }, [user])

  const handleToggle = async (key: keyof NotificationPreferences) => {
    if (!user) return

    // Special handling for push notifications
    if (key === "pushEnabled" && !preferences.pushEnabled) {
      // Request permission and get FCM token
      const token = await requestNotificationPermission(user.uid)
      if (!token) {
        toast({
          title: "Permission Denied",
          description: "Please allow notifications in your browser settings.",
          variant: "destructive",
        })
        return
      }
    }

    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    }

    setPreferences(newPreferences)

    try {
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        notificationPreferences: newPreferences,
      })

      toast({
        title: "Preferences Updated",
        description: "Your notification preferences have been updated.",
      })
    } catch (error) {
      console.error("Error updating notification preferences:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update notification preferences.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Loading your notification preferences...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Choose how you want to receive notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <Label htmlFor="push-notifications" className="flex flex-col space-y-1">
              <span>Push Notifications</span>
              <span className="text-xs text-muted-foreground">Receive alerts in your browser or mobile app</span>
            </Label>
          </div>
          <Switch
            id="push-notifications"
            checked={preferences.pushEnabled}
            onCheckedChange={() => handleToggle("pushEnabled")}
          />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
              <span>Email Notifications</span>
              <span className="text-xs text-muted-foreground">Receive alerts via email</span>
            </Label>
          </div>
          <Switch
            id="email-notifications"
            checked={preferences.emailEnabled}
            onCheckedChange={() => handleToggle("emailEnabled")}
          />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-2">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <Label htmlFor="sms-notifications" className="flex flex-col space-y-1">
              <span>SMS Notifications</span>
              <span className="text-xs text-muted-foreground">Receive alerts via SMS</span>
            </Label>
          </div>
          <Switch
            id="sms-notifications"
            checked={preferences.smsEnabled}
            onCheckedChange={() => handleToggle("smsEnabled")}
          />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <Label htmlFor="whatsapp-notifications" className="flex flex-col space-y-1">
              <span>WhatsApp Notifications</span>
              <span className="text-xs text-muted-foreground">Receive alerts via WhatsApp</span>
            </Label>
          </div>
          <Switch
            id="whatsapp-notifications"
            checked={preferences.whatsappEnabled}
            onCheckedChange={() => handleToggle("whatsappEnabled")}
          />
        </div>

        <div className="pt-4">
          <Button
            variant="outline"
            onClick={() => {
              if (user) {
                requestNotificationPermission(user.uid)
                  .then((token) => {
                    if (token) {
                      toast({
                        title: "Notifications Enabled",
                        description: "You will now receive push notifications.",
                      })
                    }
                  })
                  .catch((error) => {
                    console.error("Error requesting notification permission:", error)
                  })
              }
            }}
          >
            Test Notification
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
