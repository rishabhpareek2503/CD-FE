"use client"

import { useState } from "react"
import { Lock, Unlock, Eye, EyeOff, AlertTriangle, AlertCircle } from "lucide-react"

import { useAuth } from "@/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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

interface ChemicalData {
  id: string
  name: string
  formula: string
  currentDosage: number
  recommendedDosage: number
  unit: string
  lastUpdated: string
  status: "normal" | "high" | "low" | "critical"
}

interface ChemicalInformationDisplayProps {
  deviceId: string
  chemicals: ChemicalData[]
}

export function ChemicalInformationDisplay({ deviceId, chemicals }: ChemicalInformationDisplayProps) {
  const { userProfile } = useAuth()
  const [showChemicals, setShowChemicals] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [accessReason, setAccessReason] = useState("")
  const [accessCode, setAccessCode] = useState("")
  const [accessError, setAccessError] = useState<string | null>(null)

  // Check if user has permission to view chemicals
  // This is a simplified check - in a real app, you'd check specific permissions
  const canViewChemicals =
    userProfile?.permissions?.includes("view_chemical_data") ||
    userProfile?.role === "admin" ||
    userProfile?.role === "developer"

  const handleRequestAccess = () => {
    // In a real application, you would validate the access code against a database
    // or send a request to an API for verification
    if (accessCode === "123456") {
      // Example access code
      setShowChemicals(true)
      setIsDialogOpen(false)
      setAccessError(null)

      // In a real application, you would log this access for audit purposes
      console.log(`User requested access to chemical data for device ${deviceId}. Reason: ${accessReason}`)
    } else {
      setAccessError("Invalid access code. Please try again or contact your administrator.")
    }
  }

  const getStatusColor = (status: ChemicalData["status"]) => {
    switch (status) {
      case "normal":
        return "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400"
      case "high":
        return "text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400"
      case "low":
        return "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400"
      case "critical":
        return "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400"
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  return (
    <Card className="border-2 border-primary/20 shadow-md">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
        <CardTitle className="flex items-center gap-2">
          {canViewChemicals || showChemicals ? (
            <Unlock className="h-5 w-5 text-green-600" />
          ) : (
            <Lock className="h-5 w-5 text-amber-600" />
          )}
          Chemical Dosing Information
        </CardTitle>
        <CardDescription>
          {canViewChemicals || showChemicals
            ? "Current chemical dosing levels and recommendations"
            : "Chemical information is restricted. Request access to view."}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        {canViewChemicals || showChemicals ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing chemical information for device ID: <span className="font-medium">{deviceId}</span>
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChemicals(false)}
                className="flex items-center gap-1"
              >
                <EyeOff className="h-4 w-4" />
                <span>Hide Chemicals</span>
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chemical</TableHead>
                  <TableHead>Formula</TableHead>
                  <TableHead>Current Dosage</TableHead>
                  <TableHead>Recommended</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chemicals.map((chemical) => (
                  <TableRow key={chemical.id}>
                    <TableCell className="font-medium">{chemical.name}</TableCell>
                    <TableCell className="font-mono">{chemical.formula}</TableCell>
                    <TableCell>
                      {chemical.currentDosage} {chemical.unit}
                    </TableCell>
                    <TableCell>
                      {chemical.recommendedDosage} {chemical.unit}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(chemical.status)}`}>
                        {chemical.status.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-500">{chemical.lastUpdated}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {chemicals.some((c) => c.status === "critical" || c.status === "high") && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Some chemicals are outside the recommended range. Please check and adjust dosing accordingly.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
              <Lock className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">Chemical Information Restricted</h3>
            <p className="text-gray-500 max-w-md mb-6">
              This information is restricted to authorized personnel only. Request access if you need to view chemical
              dosing information.
            </p>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>Request Access</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Access to Chemical Data</DialogTitle>
                  <DialogDescription>
                    Please provide a reason for accessing this information and enter your access code.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason for Access</Label>
                    <Input
                      id="reason"
                      value={accessReason}
                      onChange={(e) => setAccessReason(e.target.value)}
                      placeholder="e.g., Maintenance check, Dosing adjustment"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accessCode">Access Code</Label>
                    <Input
                      id="accessCode"
                      type="password"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      placeholder="Enter your access code"
                    />
                  </div>

                  {accessError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{accessError}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleRequestAccess} disabled={!accessReason || !accessCode}>
                    Submit Request
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
