"use client"

import { useParams } from "next/navigation"
import { DeviceForm } from "@/components/device-management/device-form"

export default function EditDevicePage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
          Edit Device
        </h1>
        <p className="text-gray-500 mt-1">Update device information and settings</p>
      </div>

      <DeviceForm deviceId={id as string} />
    </div>
  )
}
