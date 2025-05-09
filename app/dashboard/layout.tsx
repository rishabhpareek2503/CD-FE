"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { Bell, LogOut, Settings, User } from "lucide-react"

import { useAuth } from "@/hooks/use-auth"
import { DeviceProvider } from "@/providers/device-provider"
import { SidebarNavigation } from "@/components/sidebar-navigation"
import OnboardingForm from "@/components/onboarding-form"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { initFirebaseMessaging } from "@/lib/init-firebase-messaging"
import { useNotifications } from "@/hooks/use-notifications"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, userProfile, loading, needsOnboarding, setOnboardingComplete, logout } = useAuth()
  const { notifications, unreadCount } = useNotifications()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (needsOnboarding && pathname !== "/dashboard/onboarding") {
        router.push("/dashboard/onboarding")
      }
    }
  }, [user, loading, needsOnboarding, router, pathname])

  // Initialize Firebase Messaging with error handling
  useEffect(() => {
    if (user) {
      try {
        initFirebaseMessaging()
      } catch (error) {
        console.error("Error initializing Firebase Messaging:", error)
        console.log("Falling back to in-app notifications only")
      }
    }
  }, [user])

  const handleLogout = async () => {
    try {
      await logout()
      // Force navigation to login page after logout
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleOnboardingComplete = async () => {
    await setOnboardingComplete()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 w-[300px]">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Show onboarding form if needed
  if (needsOnboarding) {
    return <OnboardingForm onComplete={handleOnboardingComplete} />
  }

  return (
    <DeviceProvider>
      <SidebarProvider>
        <div className="flex min-h-screen flex-col bg-background">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur px-4 md:px-6">
            <SidebarTrigger />
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <div className="relative h-8 w-8">
                <Image src="/images/heepl-logo.png" alt="HEEPL Logo" fill className="object-contain" />
              </div>
              <span className="hidden text-lg bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Hitesh Enviro Engineers
              </span>
              <span className="md:hidden text-lg bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                HEEPL
              </span>
            </Link>
            <div className="ml-auto flex items-center gap-4">
              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                        {unreadCount}
                      </span>
                    )}
                    <span className="sr-only">Toggle notification menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notification) => (
                      <DropdownMenuItem key={notification.id} className="flex flex-col items-start">
                        <span className="font-medium">{notification.title}</span>
                        <span className="text-xs text-gray-500">
                          Device ID: {notification.deviceId} • {new Date(notification.timestamp).toLocaleTimeString()}
                        </span>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem>No notifications</DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="justify-center text-blue-600"
                    onClick={() => router.push("/dashboard/notifications")}
                  >
                    View all notifications
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar>
                      <AvatarImage src="/placeholder-user.jpg" alt="User" />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                        {userProfile?.name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{userProfile?.name || user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <div className="flex flex-1">
            <SidebarNavigation />
            <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </DeviceProvider>
  )
}
