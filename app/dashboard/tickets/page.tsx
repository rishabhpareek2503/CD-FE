"use client"

import { useState, useEffect } from "react"
import { Check, Filter, Plus, X } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useSensorData } from "@/hooks/use-sensor-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Mock data for demonstration
const ticketCategories = [
  "Hardware Issue",
  "Sensor Malfunction",
  "Calibration Required",
  "Data Transmission Error",
  "Maintenance Request",
  "Other",
]

const ticketPriorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
]

interface Ticket {
  id: string
  title: string
  description: string
  deviceId: string
  category: string
  priority: string
  status: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
  assignedTo?: string
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    deviceId: "",
    category: "",
    priority: "medium",
  })

  const { user } = useAuth()
  const { devices } = useSensorData()

  // Fetch tickets from Firestore
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true)

        // In a real app, you would use onSnapshot to listen for real-time updates
        // For this example, we'll use mock data
        const mockTickets: Ticket[] = [
          {
            id: "TK-001",
            title: "pH Sensor Calibration Required",
            description: "The pH sensor readings are consistently off by 0.5 units. Calibration is needed.",
            deviceId: "WW-001",
            category: "Calibration Required",
            priority: "medium",
            status: "open",
            createdAt: new Date(2023, 5, 15),
            updatedAt: new Date(2023, 5, 15),
            createdBy: "user123",
          },
          {
            id: "TK-002",
            title: "Turbidity Sensor Malfunction",
            description: "The turbidity sensor is showing erratic readings. Please investigate and repair.",
            deviceId: "WW-002",
            category: "Sensor Malfunction",
            priority: "high",
            status: "in-progress",
            createdAt: new Date(2023, 5, 10),
            updatedAt: new Date(2023, 5, 12),
            createdBy: "user123",
          },
          {
            id: "TK-003",
            title: "Scheduled Maintenance Request",
            description: "Requesting scheduled maintenance for all sensors at Treatment Plant A.",
            deviceId: "WW-001",
            category: "Maintenance Request",
            priority: "low",
            status: "resolved",
            createdAt: new Date(2023, 4, 25),
            updatedAt: new Date(2023, 5, 5),
            createdBy: "user123",
          },
          {
            id: "TK-004",
            title: "Data Transmission Interruption",
            description: "Data transmission from Pumping Station C has been intermittent for the past 24 hours.",
            deviceId: "WW-003",
            category: "Data Transmission Error",
            priority: "critical",
            status: "open",
            createdAt: new Date(2023, 5, 16),
            updatedAt: new Date(2023, 5, 16),
            createdBy: "user123",
          },
        ]

        setTickets(mockTickets)
        setLoading(false)
      } catch (err: any) {
        console.error("Error fetching tickets:", err)
        setError("Failed to load tickets. Please try again.")
        setLoading(false)
      }
    }

    fetchTickets()
  }, [])

  // Filter tickets based on status
  const filteredTickets =
    selectedStatus === "all" ? tickets : tickets.filter((ticket) => ticket.status === selectedStatus)

  // Handle creating a new ticket
  const handleCreateTicket = async () => {
    if (!user) return

    try {
      // In a real app, you would add the ticket to Firestore
      // For this example, we'll just update the local state
      const ticket = {
        ...newTicket,
        id: `TK-${(tickets.length + 1).toString().padStart(3, "0")}`,
        status: "open",
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user.uid,
      }

      setTickets([ticket as Ticket, ...tickets])
      setIsDialogOpen(false)
      setNewTicket({
        title: "",
        description: "",
        deviceId: "",
        category: "",
        priority: "medium",
      })
    } catch (err: any) {
      console.error("Error creating ticket:", err)
      setError("Failed to create ticket. Please try again.")
    }
  }

  // Get badge color based on priority
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "low":
        return <Badge variant="outline">Low</Badge>
      case "medium":
        return <Badge variant="secondary">Medium</Badge>
      case "high":
        return <Badge variant="default">High</Badge>
      case "critical":
        return <Badge variant="destructive">Critical</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  // Get badge color based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
            Open
          </Badge>
        )
      case "in-progress":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50">
            In Progress
          </Badge>
        )
      case "resolved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
            Resolved
          </Badge>
        )
      case "closed":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 hover:bg-gray-50">
            Closed
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold tracking-tight">Support Tickets</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold tracking-tight">Support Tickets</h1>
        <div className="flex items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1a4e7e] hover:bg-[#153d62]">
                <Plus className="mr-2 h-4 w-4" />
                Create Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Support Ticket</DialogTitle>
                <DialogDescription>Fill out the form below to create a new support ticket.</DialogDescription>
              </DialogHeader>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Brief description of the issue"
                    value={newTicket.title}
                    onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed description of the issue"
                    rows={4}
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="device">Device</Label>
                    <Select
                      value={newTicket.deviceId}
                      onValueChange={(value) => setNewTicket({ ...newTicket, deviceId: value })}
                    >
                      <SelectTrigger id="device">
                        <SelectValue placeholder="Select device" />
                      </SelectTrigger>
                      <SelectContent>
                        {devices.map((device) => (
                          <SelectItem key={device.id} value={device.id}>
                            {device.id} - {device.location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newTicket.category}
                      onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {ticketCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newTicket.priority}
                    onValueChange={(value) => setNewTicket({ ...newTicket, priority: value })}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {ticketPriorities.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTicket} className="bg-[#1a4e7e] hover:bg-[#153d62]">
                  Submit Ticket
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" value={selectedStatus} onValueChange={setSelectedStatus}>
        <TabsList>
          <TabsTrigger value="all">All Tickets</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>
        <TabsContent value={selectedStatus}>
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedStatus === "all"
                  ? "All Tickets"
                  : `${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1).replace("-", " ")} Tickets`}
              </CardTitle>
              <CardDescription>{filteredTickets.length} tickets found</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">{ticket.id}</TableCell>
                        <TableCell>{ticket.title}</TableCell>
                        <TableCell>{ticket.deviceId}</TableCell>
                        <TableCell>{ticket.category}</TableCell>
                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                        <TableCell>{ticket.createdAt.toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Check className="h-4 w-4" />
                              <span className="sr-only">Resolve</span>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <X className="h-4 w-4" />
                              <span className="sr-only">Close</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-xs text-gray-500">
                Showing {filteredTickets.length} of {tickets.length} tickets
              </div>
              <div className="space-x-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
