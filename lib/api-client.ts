/**
 * API client for interacting with the backend
 */

import type { SensorData, Prediction } from "./ai-prediction-service"

export interface WaterQualityParameters {
  pH: number
  BOD: number
  COD: number
  TSS: number
  Temperature: number
  Flow?: number
  DO?: number
  Conductivity?: number
  Turbidity?: number
}

/**
 * Get chemical dosage prediction from backend API
 */
export async function getPrediction(params: WaterQualityParameters): Promise<Prediction> {
  try {
    // First try to call the actual backend API
    const response = await fetch("/api/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    })

    if (response.ok) {
      return await response.json()
    }

    // If the API call fails, fall back to the mock service
    console.warn("API call failed, using mock prediction service")

    // Convert params to SensorData format
    const sensorData: SensorData = {
      pH: params.pH,
      BOD: params.BOD,
      COD: params.COD,
      TSS: params.TSS,
      Flow: params.Flow || 100,
      Temperature: params.Temperature,
      DO: params.DO || 5,
      Conductivity: params.Conductivity || 500,
      Turbidity: params.Turbidity || 20,
    }

    // Import the mock service and use it as fallback
    const { getPrediction: getMockPrediction } = await import("./ai-prediction-service")
    return getMockPrediction(sensorData)
  } catch (error) {
    console.error("Error in getPrediction:", error)

    // Import the mock service and use it as fallback
    const { getPrediction: getMockPrediction } = await import("./ai-prediction-service")

    // Convert params to SensorData format
    const sensorData: SensorData = {
      pH: params.pH,
      BOD: params.BOD,
      COD: params.COD,
      TSS: params.TSS,
      Flow: params.Flow || 100,
      Temperature: params.Temperature,
      DO: params.DO || 5,
      Conductivity: params.Conductivity || 500,
      Turbidity: params.Turbidity || 20,
    }

    return getMockPrediction(sensorData)
  }
}
