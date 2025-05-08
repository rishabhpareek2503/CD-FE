"use client"

import { useState, useEffect } from "react"
import { collection, query, getDocs, where } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { grantDeviceAccess, revokeDeviceAccess, UserDeviceAccess } from "@/lib/user-device-access"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, PlusCircle, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function DeviceAccessManager() {
  const [devices, setDevices] = useState<string[]>([])
  const [userDeviceAccess, setUserDeviceAccess] = useState<UserDeviceAccess[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newEmail, setNewEmail] = useState("")
  const [newDevice, setNewDevice] = useState("")
  const [accessLevel, setAccessLevel] = useState<"read" | "readwrite" | "admin">("read")
  const [submitting, setSubmitting] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // Check if current user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      const currentUser = auth.currentUser
      if (!currentUser || !currentUser.email) {
        setIsAdmin(false)
        return
      }

      try {
        const adminRef = collection(db, "admins")
        const q = query(adminRef, where("email", "==", currentUser.email))
        const snapshot = await getDocs(q)
        setIsAdmin(!snapshot.empty)
      } catch (err) {
        console.error("Error checking admin status:", err)
        setIsAdmin(false)
      }
    }

    checkAdminStatus()
  }, [])

  // Fetch device list
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true)
        // Get all unique deviceIds from sensorReadings collection
        const readingsRef = collection(db, "sensorReadings")
        const snapshot = await getDocs(readingsRef)
        
        // Extract unique device IDs
        const uniqueDevices = new Set<string>()
        snapshot.docs.forEach(doc => {
          const deviceId = doc.data().deviceId
          if (deviceId) uniqueDevices.add(deviceId)
        })
        
        setDevices(Array.from(uniqueDevices))
        setLoading(false)
      } catch (err) {
        console.error("Error fetching devices:", err)
        setError("Failed to fetch devices")
        setLoading(false)
      }
    }

    fetchDevices()
  }, [])

  // Fetch user device access data
  useEffect(() => {
    const fetchUserDeviceAccess = async () => {
      try {
        setLoading(true)
        const accessRef = collection(db, "userDeviceAccess")
        const snapshot = await getDocs(accessRef)
        
        const accessList: UserDeviceAccess[] = snapshot.docs.map(doc => ({
          id: doc.id,
          email: doc.data().email,
          deviceId: doc.data().deviceId,
          accessLevel: doc.data().accessLevel || "read",
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }))
        
        setUserDeviceAccess(accessList)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching user device access:", err)
        setError("Failed to fetch user device access data")
        setLoading(false)
      }
    }

    fetchUserDeviceAccess()
  }, [])

  // Handle adding new device access
  const handleAddAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newEmail || !newDevice) {
      toast({
        title: "Missing fields",
        description: "Please fill in both email and device fields",
        variant: "destructive"
      })
      return
    }
    
    try {
      setSubmitting(true)
      const success = await grantDeviceAccess(newEmail, newDevice, accessLevel)
      
      if (success) {
        // Add to local state
        setUserDeviceAccess([
          ...userDeviceAccess,
          {
            email: newEmail,
            deviceId: newDevice,
            accessLevel: accessLevel,
            createdAt: new Date()
          }
        ])
        
        // Reset form
        setNewEmail("")
        setNewDevice("")
        setAccessLevel("read")
        
        toast({
          title: "Access granted",
          description: `User ${newEmail} now has access to device ${newDevice}`,
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to grant access",
          variant: "destructive"
        })
      }
    } catch (err) {
      console.error("Error adding access:", err)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle revoking access
  const handleRevokeAccess = async (email: string, deviceId: string, accessId?: string) => {
    try {
      setSubmitting(true)
      const success = await revokeDeviceAccess(email, deviceId)
      
      if (success) {
        // Remove from local state
        setUserDeviceAccess(userDeviceAccess.filter(access => 
          !(access.email === email && access.deviceId === deviceId)
        ))
        
        toast({
          title: "Access revoked",
          description: `User ${email} no longer has access to device ${deviceId}`,
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to revoke access",
          variant: "destructive"
        })
      }
    } catch (err) {
      console.error("Error revoking access:", err)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  // If not admin, show restricted access message
  if (!isAdmin) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Access Restricted</CardTitle>
          <CardDescription>
            You need administrator privileges to manage device access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>Not Authorized</AlertTitle>
            <AlertDescription>
              Please contact your system administrator if you need access to this feature.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Loading state
  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Device Access Manager</CardTitle>
          <CardDescription>Loading data...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Device Access Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Device Access Manager</CardTitle>
        <CardDescription>
          Control which users can access specific sensor devices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new access form */}
        <form onSubmit={handleAddAccess} className="space-y-4 p-4 border rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="email">User Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="device">Device</Label>
            <Select value={newDevice} onValueChange={setNewDevice} required>
              <SelectTrigger id="device">
                <SelectValue placeholder="Select a device" />
              </SelectTrigger>
              <SelectContent>
                {devices.map((device) => (
                  <SelectItem key={device} value={device}>
                    Device {device}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accessLevel">Access Level</Label>
            <Select 
              value={accessLevel} 
              onValueChange={(value) => setAccessLevel(value as "read" | "readwrite" | "admin")}
            >
              <SelectTrigger id="accessLevel">
                <SelectValue placeholder="Select access level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="read">Read Only</SelectItem>
                <SelectItem value="readwrite">Read & Write</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Grant Access
              </>
            )}
          </Button>
        </form>
        
        {/* Current access list */}
        <div>
          <h3 className="text-lg font-medium mb-3">Current Device Access</h3>
          
          {userDeviceAccess.length === 0 ? (
            <div className="text-center p-4 border rounded-lg text-muted-foreground">
              No device access assignments found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Email</TableHead>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Access Level</TableHead>
                  <TableHead>Granted On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userDeviceAccess.map((access, index) => (
                  <TableRow key={`${access.email}-${access.deviceId}-${index}`}>
                    <TableCell className="font-medium">{access.email}</TableCell>
                    <TableCell>{access.deviceId}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        access.accessLevel === "admin" 
                          ? "bg-purple-100 text-purple-800" 
                          : access.accessLevel === "readwrite" 
                            ? "bg-blue-100 text-blue-800" 
                            : "bg-green-100 text-green-800"
                      }`}>
                        {access.accessLevel === "admin" 
                          ? "Admin" 
                          : access.accessLevel === "readwrite" 
                            ? "Read & Write" 
                            : "Read Only"}
                      </span>
                    </TableCell>
                    <TableCell>{access.createdAt.toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeAccess(access.email, access.deviceId, access.id)}
                        disabled={submitting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between text-sm text-muted-foreground">
        <div>Total Users with Access: {new Set(userDeviceAccess.map(a => a.email)).size}</div>
        <div>Total Access Rules: {userDeviceAccess.length}</div>
      </CardFooter>
    </Card>
  )
}
