"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { Cpu, Save, X, AlertCircle, CheckCircle } from "lucide-react"

import { db } from "@/lib/firebase"
import { useAuth } from "@/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DeviceFormProps {
  deviceId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

interface Company {
  id: string
  name: string
}

export function DeviceForm({ deviceId, onSuccess, onCancel }: DeviceFormProps) {
  const { user } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [loadingDevice, setLoadingDevice] = useState(!!deviceId)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])

  // Form state
  const [deviceData, setDeviceData] = useState({
    deviceId: "",
    serialNumber: "",
    name: "",
    location: "",
    companyId: "",
    installationDate: new Date().toISOString().split("T")[0],
    status: "online",
  })

  // Fetch device data if editing
  useEffect(() => {
    if (!deviceId || !user) return

    const fetchDevice = async () => {
      try {
        setLoadingDevice(true)
        const deviceDoc = await getDoc(doc(db, "devices", deviceId))

        if (!deviceDoc.exists()) {
          setError("Device not found")
          setLoadingDevice(false)
          return
        }

        const data = deviceDoc.data()

        // Check if the device belongs to the current user
        if (data.userId !== user.uid) {
          setError("You do not have permission to edit this device")
          setLoadingDevice(false)
          return
        }

        setDeviceData({
          deviceId: deviceDoc.id,
          serialNumber: data.serialNumber || "",
          name: data.name || "",
          location: data.location || "",
          companyId: data.companyId || "",
          installationDate: data.installationDate
            ? new Date(data.installationDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          status: data.status || "online",
        })

        setLoadingDevice(false)
      } catch (err) {
        console.error("Error fetching device:", err)
        setError("Failed to load device information")
        setLoadingDevice(false)
      }
    }

    fetchDevice()
  }, [deviceId, user])

  // Fetch companies
  useEffect(() => {
    if (!user) return

    const fetchCompanies = async () => {
      try {
        // In a real app, you would fetch the user's companies
        // For now, we'll create a mock company if the user doesn't have one
        const companyId = `company-${user.uid}`
        const companyDoc = await getDoc(doc(db, "companies", companyId))

        if (companyDoc.exists()) {
          setCompanies([
            {
              id: companyDoc.id,
              name: companyDoc.data().name,
            },
          ])

          // Set default company if none selected
          if (!deviceData.companyId) {
            setDeviceData((prev) => ({ ...prev, companyId }))
          }
        } else {
          // Create a default company if none exists
          await setDoc(doc(db, "companies", companyId), {
            name: "My Company",
            userId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })

          setCompanies([
            {
              id: companyId,
              name: "My Company",
            },
          ])

          setDeviceData((prev) => ({ ...prev, companyId }))
        }
      } catch (err) {
        console.error("Error fetching companies:", err)
      }
    }

    fetchCompanies()
  }, [user, deviceData.companyId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setDeviceData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setDeviceData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { deviceId: formDeviceId, ...deviceDataToSave } = deviceData

      // Use provided deviceId for editing, or form deviceId for new device
      const finalDeviceId = deviceId || formDeviceId

      if (!finalDeviceId) {
        setError("Device ID is required")
        setLoading(false)
        return
      }

      const deviceRef = doc(db, "devices", finalDeviceId)

      if (deviceId) {
        // Update existing device
        await updateDoc(deviceRef, {
          ...deviceDataToSave,
          userId: user.uid,
          updatedAt: serverTimestamp(),
        })

        setSuccess("Device updated successfully!")
      } else {
        // Create new device
        await setDoc(deviceRef, {
          ...deviceDataToSave,
          userId: user.uid,
          lastMaintenance: new Date().toISOString(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        setSuccess("Device created successfully!")
      }

      // Redirect or call onSuccess after a delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        } else {
          router.push("/dashboard/devices")
        }
      }, 1500)
    } catch (err) {
      console.error("Error saving device:", err)
      setError("Failed to save device. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (loadingDevice) {
    return (
      <Card className="border-2 border-primary/20 shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
          <CardTitle>Loading Device...</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-primary/20 shadow-md">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          {deviceId ? "Edit Device" : "Add New Device"}
        </CardTitle>
        <CardDescription>{deviceId ? "Update device information" : "Register a new monitoring device"}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="pt-6 space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="deviceId">Device ID</Label>
              <Input
                id="deviceId"
                name="deviceId"
                value={deviceData.deviceId}
                onChange={handleChange}
                disabled={!!deviceId}
                className="border-primary/20"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                name="serialNumber"
                value={deviceData.serialNumber}
                onChange={handleChange}
                className="border-primary/20"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Device Name</Label>
              <Input
                id="name"
                name="name"
                value={deviceData.name}
                onChange={handleChange}
                className="border-primary/20"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={deviceData.location}
                onChange={handleChange}
                className="border-primary/20"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyId">Company</Label>
              <Select
                value={deviceData.companyId}
                onValueChange={(value) => handleSelectChange("companyId", value)}
                disabled={companies.length <= 1}
              >
                <SelectTrigger id="companyId" className="border-primary/20">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={deviceData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                <SelectTrigger id="status" className="border-primary/20">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="installationDate">Installation Date</Label>
            <Input
              id="installationDate"
              name="installationDate"
              type="date"
              value={deviceData.installationDate}
              onChange={handleChange}
              className="border-primary/20"
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
          <Button type="button" variant="outline" onClick={onCancel || (() => router.push("/dashboard/devices"))}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
          >
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Saving..." : deviceId ? "Update Device" : "Add Device"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
