import { NextResponse } from "next/server"
import { getPrediction } from "@/lib/ai-prediction-service"
import type { SensorData } from "@/lib/ai-prediction-service"

/**
 * API route for prediction that proxies requests to the Flask backend
 * Falls back to mock service if backend is unavailable
 */
export async function POST(request: Request) {
  try {
    const data: SensorData = await request.json()

    try {
      // Try to forward the request to the Flask backend
      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        // Add a timeout to prevent hanging if backend is down
        signal: AbortSignal.timeout(5000),
      })

      if (response.ok) {
        const result = await response.json()
        return NextResponse.json(result)
      }

      // If backend request failed, throw error to trigger fallback
      throw new Error(`Backend API request failed with status ${response.status}`)
    } catch (backendError) {
      console.warn("Backend API unavailable, using mock service:", backendError)

      // Use mock service as fallback
      const mockResult = await getPrediction(data)

      return NextResponse.json(mockResult)
    }
  } catch (error) {
    console.error("Error in prediction API:", error)
    return NextResponse.json({ error: "Failed to process prediction request" }, { status: 500 })
  }
}
