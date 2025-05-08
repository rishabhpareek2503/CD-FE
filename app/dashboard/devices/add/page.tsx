"use client"

import { DeviceForm } from "@/components/device-management/device-form"

export default function AddDevicePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
          Add New Device
        </h1>
        <p className="text-gray-500 mt-1">Register a new wastewater monitoring device</p>
      </div>

      <DeviceForm />
    </div>
  )
}
