import type { SensorData, Prediction } from "./ai-prediction-service"

/**
 * API client for interacting with the backend prediction service
 */
export async function getPredictionFromAPI(data: SensorData): Promise<Prediction> {
  try {
    // Try to call the actual backend API
    const response = await fetch("/api/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const result = await response.json()

    // Transform the API response to match our Prediction interface if needed
    return {
      chemical: result.chemical_type || result.chemical,
      quantity: result.dosage_kg_per_m3 || result.quantity,
      dosageUnit: result.dosage_unit || "ml/L",
      fault: result.fault || null,
      efficiency: result.efficiency_percent || result.efficiency,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error in API prediction service:", error)
    throw error
  }
}
