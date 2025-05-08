"use client"

import { useState, useEffect } from "react"
import { Clock, Database, RefreshCw, PlusCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { db, Firestore } from "@/lib/firebase"
import { collection, query, where, limit, getDocs, Timestamp, DocumentData, addDoc } from "firebase/firestore"

interface LastDataSummaryProps {
  deviceId: string
}

interface SensorReading {
  id: string
  deviceId: string
  timestamp: Date
  parameters: {
    pH: number
    BOD: number
    COD: number
    TSS: number
    flow: number
    temperature: number
    DO: number
    conductivity: number
    turbidity: number
    [key: string]: number
  }
}

export function LastDataSummary({ deviceId }: LastDataSummaryProps) {
  const [lastReading, setLastReading] = useState<SensorReading | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Function to fetch the last reading
  const fetchLastReading = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log("Attempting to fetch data for device ID:", deviceId)
      
      // Try to get all collections to debug
      // Cast db to Firestore type to satisfy TypeScript
      const readingsRef = collection(db as unknown as Firestore, "sensorReadings")
      
      // Create a query to get the latest reading for this device
      // Note: We're not using orderBy to avoid potential index issues
      const q = query(
        readingsRef,
        limit(25) // Get more documents to debug
      )
      
      const snapshot = await getDocs(q)
      
      console.log("Query returned", snapshot.size, "documents")
      
      // Log all devices we found
      if (snapshot.size > 0) {
        console.log("Device IDs in database:", snapshot.docs.map(doc => doc.data().deviceId))
      }
      
      // Now filter for our specific device
      const deviceDocs = snapshot.docs.filter(doc => doc.data().deviceId === deviceId)
      
      if (deviceDocs.length > 0) {
        // Sort the documents manually by timestamp
        const sortedDocs = deviceDocs.sort((a, b) => {
          const timestampA = a.data().timestamp instanceof Timestamp
            ? a.data().timestamp.toDate().getTime()
            : new Date(a.data().timestamp).getTime()
          const timestampB = b.data().timestamp instanceof Timestamp
            ? b.data().timestamp.toDate().getTime()
            : new Date(b.data().timestamp).getTime()
          return timestampB - timestampA  // Descending order
        })
        
        // Get the most recent document
        const latestDoc = sortedDocs[0]
        const data = latestDoc.data()
        
        setLastReading({
          id: latestDoc.id,
          deviceId,
          timestamp: data.timestamp instanceof Timestamp 
            ? data.timestamp.toDate() 
            : new Date(data.timestamp),
          parameters: {
            pH: data.pH || 0,
            BOD: data.BOD || 0,
            COD: data.COD || 0,
            TSS: data.TSS || 0,
            flow: data.flow || 0,
            temperature: data.temperature || 25,
            DO: data.DO || 6,
            conductivity: data.conductivity || 1000,
            turbidity: data.turbidity || 2
          }
        })
      } else if (snapshot.empty) {
        setError("No data found in the sensorReadings collection")
      } else {
        setError(`No data found for device ID: ${deviceId}`)
      }
    } catch (err) {
      console.error("Error fetching last reading:", err)
      setError("Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }
  
  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshing(true)
    fetchLastReading().then(() => {
      setTimeout(() => setRefreshing(false), 500)
    })
  }
  
  // Add test data for debugging
  const addTestData = async () => {
    try {
      setLoading(true)
      
      // Create a test reading document
      const readingsRef = collection(db as unknown as Firestore, "sensorReadings")
      
      // Generate random values similar to the mock data generator
      const randomValue = (min: number, max: number) => Math.random() * (max - min) + min
      
      const testReading = {
        deviceId: deviceId,
        timestamp: Timestamp.now(),
        pH: randomValue(6.0, 9.0),
        BOD: randomValue(5, 40),
        COD: randomValue(50, 300),
        TSS: randomValue(5, 40),
        flow: randomValue(20, 120),
        temperature: randomValue(10, 40),
        DO: randomValue(3, 9),
        conductivity: randomValue(400, 1600),
        turbidity: randomValue(0.5, 10),
      }
      
      await addDoc(readingsRef, testReading)
      console.log("Created test reading for device:", deviceId)
      
      // Refresh to see the new data
      await fetchLastReading()
    } catch (err) {
      console.error("Error creating test data:", err)
      setError("Failed to create test data: " + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }
  
  // Fetch data when component mounts or deviceId changes
  useEffect(() => {
    if (deviceId) {
      fetchLastReading()
    }
  }, [deviceId])
  
  if (loading) {
    return (
      <Card className="border-2 border-primary/20 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-100 dark:from-slate-950 dark:to-gray-900">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-2 border-red-200 dark:border-red-800 shadow-lg overflow-hidden">
        <CardHeader className="bg-red-50 dark:bg-red-950">
          <CardTitle>Last Data Not Available</CardTitle>
          <CardDescription>We couldn't retrieve the latest data for this device</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-center py-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button variant="default" onClick={addTestData}>
                <Database className="mr-2 h-4 w-4" />
                Add Test Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!lastReading) {
    return (
      <Card className="border-2 border-yellow-200 dark:border-yellow-800 shadow-lg overflow-hidden">
        <CardHeader className="bg-yellow-50 dark:bg-yellow-950">
          <CardTitle>No Data Available</CardTitle>
          <CardDescription>This device hasn't sent any data yet</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-center py-4">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Check Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Format the timestamp
  const formattedTime = lastReading.timestamp.toLocaleString()
  
  // Calculate how long ago this reading was taken
  const timeAgo = () => {
    const now = new Date()
    const diffMs = now.getTime() - lastReading.timestamp.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    } else if (diffMins > 0) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    } else {
      return 'Just now'
    }
  }
  
  // Selected key parameters to highlight
  const keyParameters = [
    { name: "pH", unit: "", color: "blue" },
    { name: "Temperature", unit: "°C", color: "red" },
    { name: "BOD", unit: "mg/L", color: "green" },
    { name: "Flow", unit: "m³/h", color: "cyan" }
  ]

  return (
    <Card className="border-2 border-primary/20 shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-100 dark:from-slate-950 dark:to-gray-900">
        <div className="flex justify-between items-center">
          <CardTitle>Last Sensor Reading</CardTitle>
          <Badge variant="outline" className="flex gap-1 items-center">
            <Clock className="h-3 w-3" />
            {timeAgo()}
          </Badge>
        </div>
        <CardDescription className="flex justify-between">
          <span>Most recent data from the sensor</span>
          <span className="text-xs text-muted-foreground">{formattedTime}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {keyParameters.map((param) => {
              const value = param.name === "pH" 
                ? lastReading.parameters.pH 
                : param.name === "Temperature" 
                  ? lastReading.parameters.temperature
                  : param.name === "BOD"
                    ? lastReading.parameters.BOD
                    : lastReading.parameters.flow
              
              const bgColor = param.color === "blue" 
                ? "bg-blue-100 dark:bg-blue-900/30" 
                : param.color === "red"
                  ? "bg-red-100 dark:bg-red-900/30"
                  : param.color === "green"
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-cyan-100 dark:bg-cyan-900/30"
              
              const textColor = param.color === "blue" 
                ? "text-blue-700 dark:text-blue-300" 
                : param.color === "red"
                  ? "text-red-700 dark:text-red-300"
                  : param.color === "green"
                    ? "text-green-700 dark:text-green-300"
                    : "text-cyan-700 dark:text-cyan-300"
                
              return (
                <div 
                  key={param.name} 
                  className={`${bgColor} rounded-lg p-3 text-center`}
                >
                  <div className={`text-sm font-medium ${textColor}`}>
                    {param.name}
                  </div>
                  <div className={`text-2xl font-bold ${textColor}`}>
                    {value} {param.unit}
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Database className="h-4 w-4" />
              <span>All parameters in database</span>
            </div>
            <div className="grid grid-cols-3 gap-x-4 gap-y-1 mt-1">
              {Object.entries(lastReading.parameters).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="font-medium">{key}:</span>
                  <span>{typeof value === 'number' ? value.toString() : String(value)} {key === "pH" ? "" : key === "temperature" ? "°C" : "mg/L"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gradient-to-r from-slate-50 to-gray-100 dark:from-slate-950 dark:to-gray-900 flex justify-between">
        <span className="text-xs text-muted-foreground">Device ID: {deviceId}</span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`mr-1 h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardFooter>
    </Card>
  )
}
