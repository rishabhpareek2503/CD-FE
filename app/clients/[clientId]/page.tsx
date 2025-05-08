"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { ArrowLeft, Factory, Settings, Plus, BarChart3, AlertTriangle } from "lucide-react"

import { db } from "@/lib/firebase"
import { useAuth } from "@/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"

interface Plant {
  id: string
  name: string
  type: "STP" | "WTP" | "CEMS" | "OTHER"
  status: "online" | "offline" | "maintenance"
  deviceCount: number
  location: string
}

interface ClientData {
  id: string
  name: string
  location: string
  type: string
  contactPerson: string
  email: string
  phone: string
}

export default function ClientOverviewPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const router = useRouter()
  const { user } = useAuth()

  const [client, setClient] = useState<ClientData | null>(null)
  const [plants, setPlants] = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch client and plants data
  useEffect(() => {
    if (!user || !clientId) return

    const fetchClientAndPlants = async () => {
      try {
        setLoading(true)

        // Fetch client data
        const clientDoc = await getDoc(doc(db, "companies", clientId as string))

        if (!clientDoc.exists()) {
          setError("Client not found")
          setLoading(false)
          return
        }

        const clientData = clientDoc.data()

        // Check if the client belongs to the current user
        if (clientData.userId !== user.uid) {
          setError("You do not have permission to view this client")
          setLoading(false)
          return
        }

        setClient({
          id: clientDoc.id,
          name: clientData.name || "Unnamed Client",
          location: clientData.location || "Unknown Location",
          type: clientData.type || "Unknown Type",
          contactPerson: clientData.contactPerson || "Not specified",
          email: clientData.email || "Not specified",
          phone: clientData.phone || "Not specified",
        })

        // Fetch devices for this client
        const devicesQuery = query(collection(db, "devices"), where("companyId", "==", clientId))

        const devicesSnapshot = await getDocs(devicesQuery)

        // Group devices by location to create "plants"
        const plantMap = new Map<string, Plant>()

        devicesSnapshot.forEach((deviceDoc) => {
          const deviceData = deviceDoc.data()
          const locationKey = deviceData.location || "Unknown Location"

          if (!plantMap.has(locationKey)) {
            plantMap.set(locationKey, {
              id: locationKey.replace(/\s+/g, "-").toLowerCase(),
              name: locationKey,
              type: determinePlantType(deviceData),
              status: "offline",
              deviceCount: 0,
              location: locationKey,
            })
          }

          const plant = plantMap.get(locationKey)!
          plant.deviceCount++

          // Update plant status based on device status
          if (deviceData.status === "online" && plant.status !== "online") {
            plant.status = "online"
          } else if (deviceData.status === "maintenance" && plant.status !== "online") {
            plant.status = "maintenance"
          }
        })

        setPlants(Array.from(plantMap.values()))
        setLoading(false)
      } catch (err) {
        console.error("Error fetching client and plants:", err)
        setError("Failed to load client information")
        setLoading(false)
      }
    }

    fetchClientAndPlants()
  }, [user, clientId])

  // Determine plant type based on device data
  function determinePlantType(deviceData: any): Plant["type"] {
    // This is a simple example - you can implement more sophisticated logic
    if (deviceData.deviceType === "STP" || deviceData.name?.includes("STP")) {
      return "STP"
    } else if (deviceData.deviceType === "WTP" || deviceData.name?.includes("WTP")) {
      return "WTP"
    } else if (deviceData.deviceType === "CEMS" || deviceData.name?.includes("CEMS")) {
      return "CEMS"
    }
    return "OTHER"
  }

  // Get plant type icon
  function getPlantTypeIcon(type: Plant["type"]) {
    switch (type) {
      case "STP":
        return <span className="text-green-500 text-xl mr-2">🟢</span>
      case "WTP":
        return <span className="text-blue-500 text-xl mr-2">💧</span>
      case "CEMS":
        return <span className="text-amber-500 text-xl mr-2">🏭</span>
      default:
        return <Factory className="h-5 w-5 mr-2" />
    }
  }

  // Get status badge
  function getStatusBadge(status: Plant["status"]) {
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

  // Calculate plant statistics
  const plantStats = {
    total: plants.length,
    online: plants.filter((p) => p.status === "online").length,
    offline: plants.filter((p) => p.status === "offline").length,
    maintenance: plants.filter((p) => p.status === "maintenance").length,
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  // Error state
  if (error || !client) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium">Error Loading Client</h3>
            <p className="text-sm text-gray-500 mt-2">
              {error || "Client not found or you do not have permission to view it"}
            </p>
            <Button className="mt-6" onClick={() => router.push("/dashboard")}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            {client.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Edit Client
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Plant
          </Button>
        </div>
      </div>

      {/* Client Statistics */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-md overflow-hidden">
          <CardContent className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Plants</p>
                <h3 className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-1">{plantStats.total}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center shadow-inner">
                <Factory className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4">
              <Progress
                value={plantStats.total > 0 ? 100 : 0}
                className="h-2 bg-blue-200 dark:bg-blue-700"
                indicatorClassName="bg-blue-600 dark:bg-blue-400"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 dark:border-green-800 shadow-md overflow-hidden">
          <CardContent className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Online Plants</p>
                <h3 className="text-3xl font-bold text-green-700 dark:text-green-300 mt-1">{plantStats.online}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center shadow-inner">
                <span className="text-green-600 dark:text-green-400 text-xl">🟢</span>
              </div>
            </div>
            <div className="mt-4">
              <Progress
                value={plantStats.total > 0 ? (plantStats.online / plantStats.total) * 100 : 0}
                className="h-2 bg-green-200 dark:bg-green-700"
                indicatorClassName="bg-green-600 dark:bg-green-400"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 dark:border-red-800 shadow-md overflow-hidden">
          <CardContent className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Offline Plants</p>
                <h3 className="text-3xl font-bold text-red-700 dark:text-red-300 mt-1">{plantStats.offline}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center shadow-inner">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="mt-4">
              <Progress
                value={plantStats.total > 0 ? (plantStats.offline / plantStats.total) * 100 : 0}
                className="h-2 bg-red-200 dark:bg-red-700"
                indicatorClassName="bg-red-600 dark:bg-red-400"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-200 dark:border-amber-800 shadow-md overflow-hidden">
          <CardContent className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Maintenance</p>
                <h3 className="text-3xl font-bold text-amber-700 dark:text-amber-300 mt-1">{plantStats.maintenance}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center shadow-inner">
                <Settings className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="mt-4">
              <Progress
                value={plantStats.total > 0 ? (plantStats.maintenance / plantStats.total) * 100 : 0}
                className="h-2 bg-amber-200 dark:bg-amber-700"
                indicatorClassName="bg-amber-600 dark:bg-amber-400"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Information and Plants */}
      <Tabs defaultValue="plants" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="plants">Plants</TabsTrigger>
          <TabsTrigger value="info">Client Information</TabsTrigger>
        </TabsList>

        <TabsContent value="plants">
          <Card>
            <CardHeader>
              <CardTitle>Plants</CardTitle>
              <CardDescription>All plants for {client.name}</CardDescription>
            </CardHeader>
            <CardContent>
              {plants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Factory className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">No Plants Found</h3>
                  <p className="text-sm text-gray-500 mt-2">This client doesn't have any plants yet</p>
                  <Button className="mt-6">
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Plant
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {plants.map((plant) => (
                    <Card key={plant.id} className="border-2 border-primary/20 shadow-md overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center">
                            {getPlantTypeIcon(plant.type)}
                            <span className="truncate">{plant.name}</span>
                          </div>
                          {getStatusBadge(plant.status)}
                        </CardTitle>
                        <CardDescription>
                          {plant.deviceCount} {plant.deviceCount === 1 ? "device" : "devices"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Type</span>
                            <span className="text-sm font-medium">{plant.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Location</span>
                            <span className="text-sm font-medium">{plant.location}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Status</span>
                            <span className="text-sm font-medium">{plant.status}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
                        <Button variant="outline" size="sm" className="w-full" asChild>
                          <Link href={`/clients/${clientId}/plants/${plant.id}`}>
                            View Plant Dashboard
                            <BarChart3 className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
              <CardDescription>Details about {client.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Client Name</p>
                    <p className="font-medium">{client.name}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Client Type</p>
                    <p className="font-medium">{client.type}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Location</p>
                    <p className="font-medium">{client.location}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Contact Person</p>
                    <p className="font-medium">{client.contactPerson}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="font-medium">{client.email}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="font-medium">{client.phone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Edit Client Information
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
