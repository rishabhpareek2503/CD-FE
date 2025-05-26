"use client"

import { NotificationPreferences } from "@/components/notification-preferences"
import { UserProfileForm } from "@/components/user-profile-form"

export default function ProfilePage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <h1 className="text-3xl font-bold">Profile Settings</h1>
      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
        <UserProfileForm />
        <NotificationPreferences />
      </div>
    </div>
  )
}
