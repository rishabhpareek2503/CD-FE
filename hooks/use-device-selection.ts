"use client"

import { useState, useEffect } from "react"
import { AVAILABLE_DEVICES, type DeviceConfig } from "@/lib/device-config"

export function useDeviceSelection() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("RPi001")
  const [availableDevices] = useState<DeviceConfig[]>(AVAILABLE_DEVICES)

  const selectedDevice = availableDevices.find((device) => device.id === selectedDeviceId)

  const selectDevice = (deviceId: string) => {
    if (availableDevices.some((device) => device.id === deviceId)) {
      setSelectedDeviceId(deviceId)
      // Store selection in localStorage for persistence
      localStorage.setItem("selectedDeviceId", deviceId)
    }
  }

  // Load saved device selection on mount
  useEffect(() => {
    const savedDeviceId = localStorage.getItem("selectedDeviceId")
    if (savedDeviceId && availableDevices.some((device) => device.id === savedDeviceId)) {
      setSelectedDeviceId(savedDeviceId)
    }
  }, [availableDevices])

  return {
    selectedDeviceId,
    selectedDevice,
    availableDevices,
    selectDevice,
  }
}
