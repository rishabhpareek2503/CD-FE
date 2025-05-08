"use client"

import { useEffect, useState } from "react"

import NotificationService, { type Notification } from "@/lib/notification-service"

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const service = NotificationService.getInstance()

    // Initial load
    setNotifications(service.getNotifications())
    setUnreadCount(service.getUnreadCount())

    // Subscribe to updates
    const unsubscribe = service.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications)
      setUnreadCount(service.getUnreadCount())
    })

    return unsubscribe
  }, [])

  const markAsRead = (id: string) => {
    const service = NotificationService.getInstance()
    service.markAsRead(id)
  }

  const markAllAsRead = () => {
    const service = NotificationService.getInstance()
    service.markAllAsRead()
  }

  const addNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const service = NotificationService.getInstance()
    service.addNotification(notification)
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
  }
}
