"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from "firebase/firestore"
import { ArrowRight, Plus, Search, Settings, Edit, Trash2, WifiOff } from "lucide-react"

import { db } from "@/lib/firebase"
import { useAuth } from "@/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Add AlertDialog imports
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Import the WifiOff icon and utility functions
import { formatTimeSinceOffline } from "@/lib/device-status-utils"

interface Device {
  id: string
  name: string
  serialNumber: string
  location: string
  installationDate: Date
  lastMaintenance: Date
  status: "online" | "offline" | "maintenance"
  companyId: string
  companyName?: string
  lastPing?: Date
}

export default function DevicesPage() {
  const { user } = useAuth()
  const [devices, setDevices] = useState<Device[]>([])
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  // Add the delete device functionality
  const [deviceToDelete, setDeviceToDelete] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDeleteDevice = async () => {
    if (!deviceToDelete) return

    try {
      setDeleteLoading(true)
      setDeleteError(null)

      await deleteDoc(doc(db, "devices", deviceToDelete))

      // Remove the device from the list
      setDevices(devices.filter((device) => device.id !== deviceToDelete))
      setFilteredDevices(filteredDevices.filter((device) => device.id !== deviceToDelete))

      setDeviceToDelete(null)
      setDeleteLoading(false)
    } catch (err) {
      console.error("Error deleting device:", err)
      setDeleteError("Failed to delete device")
      setDeleteLoading(false)
    }
  }

  // Fetch devices
  useEffect(() => {
    if (!user) return

    const fetchDevices = async () => {
      try {
        setLoading(true)

        const devicesQuery = query(collection(db, "devices"), where("userId", "==", user.uid))

        const snapshot = await getDocs(devicesQuery)

        const devicesList: Device[] = []

        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data()

          // Fetch company name
          let companyName = "Unknown"
          if (data.companyId) {
            try {
              const companyDocRef = doc(db, "companies", data.companyId)
              const companySnapshot = await getDoc(companyDocRef)
              if (companySnapshot.exists()) {
                companyName = companySnapshot.data().name
              }
            } catch (err) {
              console.error("Error fetching company:", err)
            }
          }

          devicesList.push({
            id: docSnapshot.id,
            ...data,
            companyName,
            installationDate: data.installationDate ? new Date(data.installationDate) : new Date(),
            lastMaintenance: data.lastMaintenance ? new Date(data.lastMaintenance) : new Date(),
            lastPing: data.lastPing ? new Date(data.lastPing) : new Date(),
          } as Device)
        }

        setDevices(devicesList)
        setFilteredDevices(devicesList)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching devices:", err)
        setLoading(false)
      }
    }

    fetchDevices()
  }, [user])

  // Filter devices based on search query and status
  useEffect(() => {
    let filtered = devices

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((device) => device.status === statusFilter)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (device) =>
          device.name.toLowerCase().includes(query) ||
          device.id.toLowerCase().includes(query) ||
          device.serialNumber.toLowerCase().includes(query) ||
          device.location.toLowerCase().includes(query) ||
          (device.companyName && device.companyName.toLowerCase().includes(query)),
      )
    }

    setFilteredDevices(filtered)
  }, [devices, searchQuery, statusFilter])

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return (
          <span className="flex items-center text-green-600">
            <span className="mr-1.5 h-2 w-2 rounded-full bg-green-600"></span>Online
          </span>
        )
      case "offline":
        return (
          <span className="flex items-center text-red-600">
            <span className="mr-1.5 h-2 w-2 rounded-full bg-red-600"></span>Offline
          </span>
        )
      case "maintenance":
        return (
          <span className="flex items-center text-amber-600">
            <span className="mr-1.5 h-2 w-2 rounded-full bg-amber-600"></span>Maintenance
          </span>
        )
      default:
        return (
          <span className="flex items-center text-gray-600">
            <span className="mr-1.5 h-2 w-2 rounded-full bg-gray-600"></span>Unknown
          </span>
        )
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold tracking-tight">Devices</h1>
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Devices
          </h1>
          <p className="text-gray-500 mt-1">Manage and monitor your wastewater treatment devices</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/devices/add">
            <Plus className="mr-2 h-4 w-4" />
            Add Device
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search devices..."
            className="pl-8 border-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="all" value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-3 sm:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="online">Online</TabsTrigger>
            <TabsTrigger value="offline">Offline</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredDevices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Settings className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">No Devices Found</h3>
            <p className="text-sm text-gray-500 mt-2">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "You have not added any devices yet"}
            </p>
            <Button className="mt-6" asChild>
              <Link href="/dashboard/devices/add">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Device
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDevices.map((device) => (
            <Card key={device.id} className="border-2 border-primary/20 shadow-md overflow-hidden">
              <CardHeader
                className={`bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 pb-3 ${device.status === "offline" ? "border-b-2 border-red-300 dark:border-red-800" : ""}`}
              >
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{device.name}</span>
                  {device.status === "offline" ? (
                    <span className="flex items-center text-red-600">
                      <WifiOff className="mr-1.5 h-4 w-4" />
                      Offline
                    </span>
                  ) : (
                    getStatusBadge(device.status)
                  )}
                </CardTitle>
                <CardDescription>
                  ID: {device.id} • SN: {device.serialNumber}
                  {device.status === "offline" && (
                    <div className="text-red-500 text-xs mt-1">
                      Last seen: {formatTimeSinceOffline(device.lastPing)}
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Location</span>
                    <span className="text-sm font-medium">{device.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Company</span>
                    <span className="text-sm font-medium">{device.companyName || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Installation Date</span>
                    <span className="text-sm font-medium">{device.installationDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Last Maintenance</span>
                    <span className="text-sm font-medium">{device.lastMaintenance.toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 flex justify-between">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/devices/${device.id}`}>
                    View Details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="px-2" asChild>
                    <Link href={`/dashboard/devices/edit/${device.id}`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the device "{device.name}". This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            setDeviceToDelete(device.id)
                            handleDeleteDevice()
                          }}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={deleteLoading}
                        >
                          {deleteLoading ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
