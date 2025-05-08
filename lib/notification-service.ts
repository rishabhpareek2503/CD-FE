// This service handles notifications through multiple channels: in-app, push, email, and WhatsApp/SMS

export type NotificationLevel = "info" | "warning" | "critical"

export interface Notification {
  id: string
  title: string
  message: string
  level: NotificationLevel
  timestamp: Date
  deviceId: string
  read: boolean
}

export interface NotificationPreferences {
  pushEnabled: boolean
  emailEnabled: boolean
  smsEnabled: boolean
  whatsappEnabled: boolean
}

class NotificationService {
  private static instance: NotificationService
  private notifications: Notification[] = []
  private subscribers: ((notifications: Notification[]) => void)[] = []
  private isPreviewEnvironment = false

  private constructor() {
    // Check if we're in a preview environment
    if (typeof window !== "undefined") {
      this.isPreviewEnvironment =
        window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("localhost")
    }

    // Initialize with some mock notifications
    this.notifications = [
      {
        id: "1",
        title: "High pH Level Alert",
        message: "Device WW-001 has reported pH levels above the acceptable range.",
        level: "critical",
        timestamp: new Date(Date.now() - 5 * 60000), // 5 minutes ago
        deviceId: "WW-001",
        read: false,
      },
      {
        id: "2",
        title: "Low Oxygen Level Alert",
        message: "Device WW-003 has reported oxygen levels below the acceptable range.",
        level: "warning",
        timestamp: new Date(Date.now() - 15 * 60000), // 15 minutes ago
        deviceId: "WW-003",
        read: false,
      },
      {
        id: "3",
        title: "Maintenance Required",
        message: "Device WW-002 is due for scheduled maintenance.",
        level: "info",
        timestamp: new Date(Date.now() - 60 * 60000), // 1 hour ago
        deviceId: "WW-002",
        read: false,
      },
    ]
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  public getNotifications(): Notification[] {
    return [...this.notifications]
  }

  public getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length
  }

  public markAsRead(id: string): void {
    this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    this.notifySubscribers()
  }

  public markAllAsRead(): void {
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }))
    this.notifySubscribers()
  }

  public addNotification(notification: Omit<Notification, "id" | "timestamp" | "read">): void {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    }

    this.notifications = [newNotification, ...this.notifications]

    // In a real application, this would trigger a push notification
    this.notifySubscribers()

    // For critical notifications, send push notification to mobile
    if (notification.level === "critical") {
      this.sendMultiChannelNotification(newNotification)
    }
  }

  public subscribe(callback: (notifications: Notification[]) => void): () => void {
    this.subscribers.push(callback)
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback)
    }
  }

  private notifySubscribers(): void {
    const notifications = this.getNotifications()
    this.subscribers.forEach((callback) => callback(notifications))
  }

  // Send notifications through multiple channels based on user preferences
  public async sendMultiChannelNotification(notification: Notification): Promise<void> {
    console.log("Sending multi-channel notification:", notification)

    // In a real application, you would:
    // 1. Get the list of users who should receive this notification
    // 2. Get their notification preferences
    // 3. Send notifications through the appropriate channels

    // For now, we'll just simulate sending notifications through all channels
    await this.sendPushNotification(notification)
    await this.sendEmailNotification(notification)
    await this.sendSMSNotification(notification)
    await this.sendWhatsAppNotification(notification)
  }

  // Send push notification via Firebase Cloud Messaging
  public async sendPushNotification(notification: Notification): Promise<void> {
    console.log("Sending push notification:", notification)

    // Skip actual API call in preview environments
    if (this.isPreviewEnvironment) {
      console.log("Push notification would be sent in production environment")
      return
    }

    // In a real application, this would call a server API endpoint that uses firebase-admin
    // to send push notifications to all registered devices
    try {
      const response = await fetch("/api/notifications/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: notification.title,
          body: notification.message,
          deviceId: notification.deviceId,
          level: notification.level,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send push notification")
      }

      console.log("Push notification sent successfully")
    } catch (error) {
      console.error("Error sending push notification:", error)
    }
  }

  // Send email notification
  public async sendEmailNotification(notification: Notification): Promise<void> {
    console.log("Sending email notification:", notification)

    // Skip actual API call in preview environments
    if (this.isPreviewEnvironment) {
      console.log("Email notification would be sent in production environment")
      return
    }

    // In a real application, this would call a server API endpoint that uses Nodemailer
    try {
      const response = await fetch("/api/notifications/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: notification.title,
          text: notification.message,
          deviceId: notification.deviceId,
          level: notification.level,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send email notification")
      }

      console.log("Email notification sent successfully")
    } catch (error) {
      console.error("Error sending email notification:", error)
    }
  }

  // Send SMS notification
  public async sendSMSNotification(notification: Notification): Promise<void> {
    console.log("Sending SMS notification:", notification)

    // Skip actual API call in preview environments
    if (this.isPreviewEnvironment) {
      console.log("SMS notification would be sent in production environment")
      return
    }

    // In a real application, this would call a server API endpoint that uses Twilio
    try {
      const response = await fetch("/api/notifications/sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `${notification.title}: ${notification.message}`,
          deviceId: notification.deviceId,
          level: notification.level,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send SMS notification")
      }

      console.log("SMS notification sent successfully")
    } catch (error) {
      console.error("Error sending SMS notification:", error)
    }
  }

  // Send WhatsApp notification
  public async sendWhatsAppNotification(notification: Notification): Promise<void> {
    console.log("Sending WhatsApp notification:", notification)

    // Skip actual API call in preview environments
    if (this.isPreviewEnvironment) {
      console.log("WhatsApp notification would be sent in production environment")
      return
    }

    // In a real application, this would call a server API endpoint that uses Twilio
    try {
      const response = await fetch("/api/notifications/whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `${notification.title}: ${notification.message}`,
          deviceId: notification.deviceId,
          level: notification.level,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send WhatsApp notification")
      }

      console.log("WhatsApp notification sent successfully")
    } catch (error) {
      console.error("Error sending WhatsApp notification:", error)
    }
  }
}

export default NotificationService
