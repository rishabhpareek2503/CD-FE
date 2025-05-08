"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Users,
  Factory,
  Gauge,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Home,
  FileText,
  TicketIcon,
  Brain,
  AlertCircle,
  BellIcon,
} from "lucide-react"
import { collection, query, where, getDocs } from "firebase/firestore"

import { db } from "@/lib/firebase"
import { useAuth } from "@/providers/auth-provider"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface Client {
  id: string
  name: string
  plants: Plant[]
}

interface Plant {
  id: string
  name: string
  type: "STP" | "WTP" | "CEMS" | "OTHER"
  status: "online" | "offline" | "maintenance"
}

export function SidebarNavigation() {
  const { user, hasRole, hasPermission } = useAuth()
  const pathname = usePathname()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch clients and plants
  useEffect(() => {
    if (!user) return

    const fetchClientsAndPlants = async () => {
      try {
        setLoading(true)

        // Fetch companies (clients)
        const companiesQuery = query(collection(db, "companies"), where("userId", "==", user.uid))

        const companiesSnapshot = await getDocs(companiesQuery)
        const clientsData: Client[] = []

        for (const companyDoc of companiesSnapshot.docs) {
          const companyData = companyDoc.data()

          // Fetch plants (devices grouped by location)
          const devicesQuery = query(collection(db, "devices"), where("companyId", "==", companyDoc.id))

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
                status: deviceData.status || "offline",
              })
            }
          })

          clientsData.push({
            id: companyDoc.id,
            name: companyData.name || "Unnamed Client",
            plants: Array.from(plantMap.values()),
          })
        }

        setClients(clientsData)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching clients and plants:", err)
        setLoading(false)
      }
    }

    fetchClientsAndPlants()
  }, [user])

  // Filter clients and plants based on search query
  const filteredClients = clients.filter((client) => {
    const matchesClient = client.name.toLowerCase().includes(searchQuery.toLowerCase())
    const hasMatchingPlants = client.plants.some((plant) =>
      plant.name.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    return matchesClient || hasMatchingPlants
  })

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
        return <span className="text-green-500 mr-1">🟢</span>
      case "WTP":
        return <span className="text-blue-500 mr-1">💧</span>
      case "CEMS":
        return <span className="text-amber-500 mr-1">🏭</span>
      default:
        return <Factory className="h-4 w-4 mr-1" />
    }
  }

  // Get status indicator
  function getStatusIndicator(status: Plant["status"]) {
    switch (status) {
      case "online":
        return <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
      case "offline":
        return <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
      case "maintenance":
        return <span className="h-2 w-2 rounded-full bg-amber-500 mr-2"></span>
      default:
        return <span className="h-2 w-2 rounded-full bg-gray-500 mr-2"></span>
    }
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="p-2">
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
                  <Link href="/dashboard">
                    <Home className="h-4 w-4 mr-2" />
                    <span>Overview</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard/devices"}>
                  <Link href="/dashboard/devices">
                    <Gauge className="h-4 w-4 mr-2" />
                    <span>Devices</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard/history"}>
                  <Link href="/dashboard/history">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    <span>Historical Data</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard/tickets"}>
                  <Link href="/dashboard/tickets">
                    <TicketIcon className="h-4 w-4 mr-2" />
                    <span>Tickets</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard/reports"}>
                  <Link href="/dashboard/reports">
                    <FileText className="h-4 w-4 mr-2" />
                    <span>Reports</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Add this menu item in the SidebarMenu section under the Dashboard group */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard/predictions"}>
                  <Link href="/dashboard/predictions">
                    <Brain className="h-4 w-4 mr-2" />
                    <span>AI Predictions</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard/fault-diagnosis"}>
                  <Link href="/dashboard/fault-diagnosis">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <span>Fault Diagnosis</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard/monitoring"}>
                  <Link href="/dashboard/monitoring">
                    <BellIcon className="h-4 w-4 mr-2" />
                    <span>Automated Monitoring</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {hasRole && hasRole(["developer", "admin"]) && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/dashboard/model-training"}>
                    <Link href="/dashboard/model-training">
                      <Brain className="h-4 w-4 mr-2" />
                      <span>Model Training</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  <span>Clients</span>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>

            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {loading ? (
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <span>Loading clients...</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ) : filteredClients.length === 0 ? (
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <span>No clients found</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ) : (
                    filteredClients.map((client) => (
                      <Collapsible key={client.id} className="group/client">
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton>
                              <Factory className="h-4 w-4 mr-2" />
                              <span>{client.name}</span>
                              <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/client:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {client.plants.map((plant) => (
                                <SidebarMenuSubItem key={plant.id}>
                                  <SidebarMenuSubButton asChild>
                                    <Link href={`/clients/${client.id}/plants/${plant.id}`}>
                                      <div className="flex items-center">
                                        {getStatusIndicator(plant.status)}
                                        {getPlantTypeIcon(plant.type)}
                                        <span>{plant.name}</span>
                                      </div>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    ))
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="p-2">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/dashboard/profile">
              <Settings className="h-4 w-4 mr-2" />
              <span>Settings</span>
            </Link>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
