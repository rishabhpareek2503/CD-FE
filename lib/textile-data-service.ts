export interface TextileDataPoint {
  "Batch ID": string
  "Chemical Type": string
  "Chemical Dosage (kg/m³)": number
  "Process Stage": string
  "Chemical Efficiency (%)": number
  "Cost per Batch (INR)": number
  "Water pH": number
  "Water Hardness (ppm)": number
  "Temperature (°C)": number
  "TSS (mg/L)": number
  "COD (mg/L)": number
  "BOD (mg/L)": number
  "Chemical Absorption Rate (%)": number
  "Dyeing Time (hrs)": number
  "Energy Consumption (kWh)": number
  "Water Used (L/m³)": number
  "Process Yield (Kg Fabric)": number
  "Chemical Waste (kg)": number
  "Treated Water pH": number
  "COD After Treatment (mg/L)": number
  "BOD After Treatment (mg/L)": number
  "Compliance (CPCB/SPCB)": string
}

export async function fetchTextileDataset(): Promise<TextileDataPoint[]> {
  try {
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/TEXTILE%20DATA%20POINT-QCRweWTv9mfuS8EptARf34dku1EQ1p.csv",
    )
    const csvText = await response.text()

    // Parse CSV
    const rows = csvText.split("\n")
    const headers = rows[0].split(",")

    const data = rows.slice(1).map((row) => {
      const values = row.split(",")
      const dataPoint: any = {}

      headers.forEach((header, index) => {
        const value = values[index]?.trim() || ""

        // Convert numeric values
        if (!isNaN(Number(value)) && value !== "") {
          dataPoint[header.trim()] = Number(value)
        } else {
          dataPoint[header.trim()] = value
        }
      })

      return dataPoint as TextileDataPoint
    })

    return data.filter((d) => d["Batch ID"] && d["Chemical Type"]) // Filter out empty rows
  } catch (error) {
    console.error("Error fetching textile dataset:", error)
    throw error
  }
}

export function getInputFeatures(data: TextileDataPoint): Record<string, number> {
  return {
    "Water pH": data["Water pH"],
    "Water Hardness (ppm)": data["Water Hardness (ppm)"],
    "Temperature (°C)": data["Temperature (°C)"],
    "TSS (mg/L)": data["TSS (mg/L)"],
    "COD (mg/L)": data["COD (mg/L)"],
    "BOD (mg/L)": data["BOD (mg/L)"],
  }
}

export function predictChemicalDosage(inputFeatures: Record<string, number>): {
  chemicalType: string
  dosage: number
  efficiency: number
  cost: number
} {
  // Simple rule-based prediction (in a real system, this would use the trained model)
  const { "Water pH": pH, "COD (mg/L)": cod, "BOD (mg/L)": bod, "TSS (mg/L)": tss } = inputFeatures

  // Default values
  let chemicalType = "Alum"
  let dosage = 5
  let efficiency = 80
  let cost = 1500

  // pH-based rules
  if (pH < 6.0) {
    chemicalType = "Caustic Soda"
    dosage = 7 + (6.0 - pH) * 2
    efficiency = 85
    cost = 1800
  } else if (pH > 8.0) {
    chemicalType = "Sulfuric Acid"
    dosage = 6 + (pH - 8.0) * 2
    efficiency = 82
    cost = 1600
  } else if (cod > 400 || bod > 130) {
    chemicalType = "Hydrogen Peroxide"
    dosage = 8 + (cod > 400 ? (cod - 400) / 100 : 0)
    efficiency = 88
    cost = 2000
  } else if (tss > 170) {
    chemicalType = "Polyaluminum Chloride"
    dosage = 7 + (tss - 170) / 50
    efficiency = 86
    cost = 1900
  }

  return {
    chemicalType,
    dosage: Number.parseFloat(dosage.toFixed(2)),
    efficiency: Number.parseFloat(efficiency.toFixed(1)),
    cost: Math.round(cost),
  }
}
