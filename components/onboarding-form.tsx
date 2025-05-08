"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { doc, setDoc, updateDoc, arrayUnion } from "firebase/firestore"
import { PlusCircle, Trash2, Building, User, Mail, Phone, MapPin, Hash, Cpu, MapPinned, Calendar } from "lucide-react"

import { db } from "@/lib/firebase"
import { useAuth } from "@/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

const companyTypes = [
  "Textile Industry",
  "Food Processing",
  "Chemical Manufacturing",
  "Pharmaceutical",
  "Paper and Pulp",
  "Metal Processing",
  "Tannery",
  "Brewery",
  "Other",
]

export default function OnboardingForm({ onComplete }: { onComplete: () => void }) {
  const { user, userProfile } = useAuth()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState("profile")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Profile form state
  const [profileData, setProfileData] = useState({
    clientName: userProfile?.name || "",
    companyName: "",
    companyType: "",
    phoneNumber: "",
    numberOfIndustries: "",
    address: "",
    email: user?.email || "",
  })

  // Device form state
  const [devices, setDevices] = useState<
    Array<{
      deviceId: string
      serialNumber: string
      deviceName: string
      location: string
      installationDate: string
    }>
  >([
    {
      deviceId: "",
      serialNumber: "",
      deviceName: "",
      location: "",
      installationDate: new Date().toISOString().split("T")[0],
    },
  ])

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDeviceChange = (index: number, field: string, value: string) => {
    const updatedDevices = [...devices]
    updatedDevices[index] = { ...updatedDevices[index], [field]: value }
    setDevices(updatedDevices)
  }

  const addDevice = () => {
    setDevices([
      ...devices,
      {
        deviceId: "",
        serialNumber: "",
        deviceName: "",
        location: "",
        installationDate: new Date().toISOString().split("T")[0],
      },
    ])
  }

  const removeDevice = (index: number) => {
    if (devices.length > 1) {
      const updatedDevices = [...devices]
      updatedDevices.splice(index, 1)
      setDevices(updatedDevices)
    }
  }

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Update user profile in Firestore
      await updateDoc(doc(db, "users", user.uid), {
        name: profileData.clientName,
        phoneNumber: profileData.phoneNumber,
        address: profileData.address,
        updatedAt: new Date().toISOString(),
      })

      // Create or update company
      const companyRef = doc(db, "companies", `company-${user.uid}`)
      await setDoc(
        companyRef,
        {
          name: profileData.companyName,
          type: profileData.companyType,
          numberOfIndustries: Number.parseInt(profileData.numberOfIndustries) || 0,
          userId: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      )

      // Add company to user's companies array
      await updateDoc(doc(db, "users", user.uid), {
        companies: arrayUnion(`company-${user.uid}`),
      })

      setSuccess("Profile information saved successfully!")
      setActiveTab("devices")
    } catch (err) {
      console.error("Error saving profile:", err)
      setError("Failed to save profile information. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitDevices = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Validate devices
      const invalidDevices = devices.filter((d) => !d.deviceId || !d.serialNumber || !d.deviceName)
      if (invalidDevices.length > 0) {
        setError("Please fill in all required device fields (ID, Serial Number, and Name)")
        setLoading(false)
        return
      }

      // Add devices to Firestore
      for (const device of devices) {
        const deviceRef = doc(db, "devices", device.deviceId)
        await setDoc(
          deviceRef,
          {
            serialNumber: device.serialNumber,
            name: device.deviceName,
            location: device.location,
            installationDate: device.installationDate,
            lastMaintenance: new Date().toISOString(),
            status: "online",
            userId: user.uid,
            companyId: `company-${user.uid}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        )
      }

      setSuccess("Devices saved successfully!")

      // Complete onboarding
      setTimeout(() => {
        onComplete()
      }, 1500)
    } catch (err) {
      console.error("Error saving devices:", err)
      setError("Failed to save device information. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl py-10">
      <Card className="border-2 border-primary/20 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 pb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
              <Building className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Welcome to HEEPL Wastewater Monitoring
          </CardTitle>
          <CardDescription className="text-center">
            Please complete your profile information to get started with your dashboard
          </CardDescription>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
              >
                Client Profile
              </TabsTrigger>
              <TabsTrigger
                value="devices"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
              >
                Device Registration
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="profile">
            <form onSubmit={handleSubmitProfile}>
              <CardContent className="space-y-4 pt-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="clientName" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Client Name
                    </Label>
                    <Input
                      id="clientName"
                      name="clientName"
                      value={profileData.clientName}
                      onChange={handleProfileChange}
                      className="border-primary/20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={profileData.email}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-primary" />
                      Company Name
                    </Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      value={profileData.companyName}
                      onChange={handleProfileChange}
                      className="border-primary/20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyType" className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-primary" />
                      Company Type
                    </Label>
                    <Select
                      value={profileData.companyType}
                      onValueChange={(value) => setProfileData((prev) => ({ ...prev, companyType: value }))}
                      required
                    >
                      <SelectTrigger id="companyType" className="border-primary/20">
                        <SelectValue placeholder="Select company type" />
                      </SelectTrigger>
                      <SelectContent>
                        {companyTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      Phone Number
                    </Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      value={profileData.phoneNumber}
                      onChange={handleProfileChange}
                      className="border-primary/20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numberOfIndustries" className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-primary" />
                      Number of Industries
                    </Label>
                    <Input
                      id="numberOfIndustries"
                      name="numberOfIndustries"
                      type="number"
                      min="1"
                      value={profileData.numberOfIndustries}
                      onChange={handleProfileChange}
                      className="border-primary/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Address
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    value={profileData.address}
                    onChange={handleProfileChange}
                    className="border-primary/20"
                    required
                  />
                </div>
              </CardContent>

              <CardFooter className="flex justify-between bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
                <Button variant="outline" type="button" onClick={() => router.push("/dashboard")}>
                  Skip for Now
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
                >
                  {loading ? "Saving..." : "Save & Continue"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>

          <TabsContent value="devices">
            <form onSubmit={handleSubmitDevices}>
              <CardContent className="space-y-6 pt-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                      Device Registration
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addDevice}
                      className="border-primary/20 hover:bg-primary/10"
                    >
                      <PlusCircle className="mr-2 h-4 w-4 text-primary" />
                      Add Device
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Register your wastewater treatment devices to monitor them on the dashboard
                  </p>
                </div>

                {devices.map((device, index) => (
                  <div
                    key={index}
                    className="space-y-4 rounded-lg border-2 border-primary/20 p-4 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center gap-2">
                        <Cpu className="h-5 w-5 text-primary" />
                        <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                          Device #{index + 1}
                        </span>
                      </h4>
                      {devices.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDevice(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`deviceId-${index}`} className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-primary" />
                          Device ID
                        </Label>
                        <Input
                          id={`deviceId-${index}`}
                          value={device.deviceId}
                          onChange={(e) => handleDeviceChange(index, "deviceId", e.target.value)}
                          className="border-primary/20"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`serialNumber-${index}`} className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-primary" />
                          Serial Number
                        </Label>
                        <Input
                          id={`serialNumber-${index}`}
                          value={device.serialNumber}
                          onChange={(e) => handleDeviceChange(index, "serialNumber", e.target.value)}
                          className="border-primary/20"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`deviceName-${index}`} className="flex items-center gap-2">
                          <Cpu className="h-4 w-4 text-primary" />
                          Device Name
                        </Label>
                        <Input
                          id={`deviceName-${index}`}
                          value={device.deviceName}
                          onChange={(e) => handleDeviceChange(index, "deviceName", e.target.value)}
                          className="border-primary/20"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`location-${index}`} className="flex items-center gap-2">
                          <MapPinned className="h-4 w-4 text-primary" />
                          Location
                        </Label>
                        <Input
                          id={`location-${index}`}
                          value={device.location}
                          onChange={(e) => handleDeviceChange(index, "location", e.target.value)}
                          className="border-primary/20"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`installationDate-${index}`} className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        Installation Date
                      </Label>
                      <Input
                        id={`installationDate-${index}`}
                        type="date"
                        value={device.installationDate}
                        onChange={(e) => handleDeviceChange(index, "installationDate", e.target.value)}
                        className="border-primary/20"
                        required
                      />
                    </div>
                  </div>
                ))}
              </CardContent>

              <CardFooter className="flex justify-between bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
                <Button variant="outline" type="button" onClick={() => setActiveTab("profile")}>
                  Back to Profile
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
                >
                  {loading ? "Saving..." : "Complete Setup"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
