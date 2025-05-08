import { NextResponse } from "next/server"
// Firebase imports commented out for deployment
// import { ref, get } from "firebase/database"
// import { realtimeDb } from "@/lib/firebase"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const deviceId = params.id

    // Using mock data instead of Firebase for deployment
    // This avoids Firebase authentication errors during build
    
    // Mock data based on device ID to simulate different devices
    const mockDataMap: Record<string, any> = {
      "device1": {
        pH: 7.2,
        temperature: 42,
        tss: 145,
        cod: 320,
        bod: 110,
        hardness: 190
      },
      "device2": {
        pH: 6.8,
        temperature: 48,
        tss: 170,
        cod: 380,
        bod: 130,
        hardness: 220
      },
      // Default data for any other device ID
      "default": {
        pH: 7.0,
        temperature: 45,
        tss: 150,
        cod: 350,
        bod: 120,
        hardness: 200
      }
    }

    // Get data for the requested device, or use default if not found
    const mockData = mockDataMap[deviceId] || mockDataMap["default"]
    
    return NextResponse.json(mockData)
  } catch (error) {
    console.error("Error fetching device data:", error)
    return NextResponse.json({ error: "Failed to fetch device data" }, { status: 500 })
  }
}
