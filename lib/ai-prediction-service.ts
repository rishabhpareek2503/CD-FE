/**
 * AI Prediction Service
 *
 * This service provides AI-based predictions for wastewater treatment based on sensor data.
 * It analyzes water quality parameters and recommends appropriate chemical treatments.
 */

interface SensorData {
  pH: number
  BOD: number
  COD: number
  TSS: number
  Flow: number
  Temperature?: number
  DO?: number
  Conductivity?: number
  Turbidity?: number
}

interface Prediction {
  chemical: string
  quantity: number
  dosageUnit: string
  fault: string | null
  efficiency: number
  timestamp: string
}

// Chemical treatment options
const CHEMICALS = {
  ALUM: "Aluminum Sulfate (Alum)",
  PAC: "Polyaluminum Chloride (PAC)",
  FERRIC: "Ferric Chloride",
  POLYMER: "Cationic Polymer",
  LIME: "Hydrated Lime",
  SODA_ASH: "Soda Ash",
  CHLORINE: "Chlorine",
  HYDROGEN_PEROXIDE: "Hydrogen Peroxide",
  OZONE: "Ozone",
  ACTIVATED_CARBON: "Activated Carbon",
}

/**
 * Generates a prediction based on sensor data
 * @param data Sensor data including pH, BOD, COD, TSS, etc.
 * @returns Prediction object with recommended chemical treatment
 */
export async function getPrediction(data: SensorData): Promise<Prediction> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  try {
    // Normalize data to ensure all fields exist
    const normalizedData = normalizeData(data)

    // Analyze water quality
    const waterQuality = analyzeWaterQuality(normalizedData)

    // Determine treatment strategy
    const treatment = determineTreatment(normalizedData, waterQuality)

    // Calculate dosage
    const dosage = calculateDosage(normalizedData, treatment.chemical)

    // Estimate efficiency
    const efficiency = estimateEfficiency(normalizedData, treatment.chemical, dosage)

    // Check for potential issues
    const fault = identifyPotentialIssues(normalizedData)

    return {
      chemical: treatment.chemical,
      quantity: dosage,
      dosageUnit: treatment.unit,
      fault: fault,
      efficiency: efficiency,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error generating prediction:", error)
    throw new Error("Failed to generate prediction")
  }
}

/**
 * Ensures all required data fields exist with default values if missing
 */
function normalizeData(data: SensorData): SensorData {
  return {
    pH: data.pH ?? 7.0,
    BOD: data.BOD ?? 120,
    COD: data.COD ?? 350,
    TSS: data.TSS ?? 150,
    Flow: data.Flow ?? 100,
    Temperature: data.Temperature ?? 25,
    DO: data.DO ?? 5,
    Conductivity: data.Conductivity ?? 500,
    Turbidity: data.Turbidity ?? 20,
  }
}

/**
 * Analyzes water quality based on sensor data
 */
function analyzeWaterQuality(data: SensorData) {
  // Determine pH condition
  const pHCondition = data.pH < 6.5 ? "acidic" : data.pH > 8.5 ? "alkaline" : "neutral"

  // Determine organic load
  const organicLoad = data.BOD > 200 || data.COD > 500 ? "high" : data.BOD > 100 || data.COD > 250 ? "medium" : "low"

  // Determine solids content
  const solidsContent = data.TSS > 200 ? "high" : data.TSS > 100 ? "medium" : "low"

  // Determine flow rate category
  const flowRate = data.Flow > 200 ? "high" : data.Flow > 100 ? "medium" : "low"

  return {
    pHCondition,
    organicLoad,
    solidsContent,
    flowRate,
  }
}

/**
 * Determines appropriate treatment based on water quality analysis
 */
function determineTreatment(data: SensorData, quality: any): { chemical: string; unit: string } {
  // pH correction chemicals
  if (quality.pHCondition === "acidic" && data.pH < 6.0) {
    return { chemical: CHEMICALS.LIME, unit: "kg/10L" }
  }

  if (quality.pHCondition === "alkaline" && data.pH > 9.0) {
    return { chemical: CHEMICALS.ALUM, unit: "kg/10L" }
  }

  // High organic load treatments
  if (quality.organicLoad === "high") {
    if (data.COD / data.BOD > 2.5) {
      // Hard to biodegrade, use chemical oxidation
      return { chemical: CHEMICALS.HYDROGEN_PEROXIDE, unit: "L/10L" }
    } else {
      // Biodegradable, use coagulants
      return { chemical: CHEMICALS.PAC, unit: "kg/10L" }
    }
  }

  // High solids content treatments
  if (quality.solidsContent === "high") {
    if (data.Turbidity && data.Turbidity > 50) {
      return { chemical: CHEMICALS.FERRIC, unit: "kg/10L" }
    } else {
      return { chemical: CHEMICALS.POLYMER, unit: "kg/10L" }
    }
  }

  // Default treatments based on combined factors
  if (quality.organicLoad === "medium" && quality.solidsContent === "medium") {
    return { chemical: CHEMICALS.ALUM, unit: "kg/10L" }
  }

  if (quality.organicLoad === "low" && quality.solidsContent === "low") {
    return { chemical: CHEMICALS.POLYMER, unit: "kg/10L" }
  }

  // Fallback option
  return { chemical: CHEMICALS.PAC, unit: "kg/10L" }
}

/**
 * Calculates appropriate chemical dosage based on water parameters
 * Returns dosage in kg per 1000 liters (or L per 1000 liters for liquid chemicals)
 */
function calculateDosage(data: SensorData, chemical: string): number {
  let baseDosage = 0

  switch (chemical) {
    case CHEMICALS.ALUM:
      // Alum dosage based on TSS
      baseDosage = (data.TSS * 0.05) / 10
      break

    case CHEMICALS.PAC:
      // PAC dosage based on turbidity and TSS
      baseDosage = ((data.Turbidity || 20) * 0.03 + data.TSS * 0.02) / 10
      break

    case CHEMICALS.FERRIC:
      // Ferric chloride dosage based on TSS and pH
      baseDosage = ((data.TSS * 0.06) / 10) * (data.pH > 7.5 ? 1.2 : 1)
      break

    case CHEMICALS.POLYMER:
      // Polymer dosage is typically much lower
      baseDosage = (data.TSS * 0.005) / 10
      break

    case CHEMICALS.LIME:
      // Lime dosage for pH correction
      baseDosage = ((7.0 - data.pH) * 10) / 10
      break

    case CHEMICALS.HYDROGEN_PEROXIDE:
      // H2O2 dosage based on COD
      baseDosage = (data.COD * 0.01) / 10
      break

    default:
      // Default calculation
      baseDosage = (data.TSS * 0.03) / 10
  }

  // Ensure minimum dosage and round to 2 decimal places
  return Math.max(baseDosage, 0.05)
}

/**
 * Estimates treatment efficiency based on water parameters and selected chemical
 */
function estimateEfficiency(data: SensorData, chemical: string, dosage: number): number {
  let baseEfficiency = 75 // Start with a baseline efficiency

  // Adjust based on chemical type
  switch (chemical) {
    case CHEMICALS.ALUM:
      baseEfficiency += data.pH >= 6.5 && data.pH <= 7.5 ? 10 : -5
      break

    case CHEMICALS.PAC:
      baseEfficiency += 5 // PAC generally performs better than alum
      baseEfficiency += data.Temperature && data.Temperature > 15 ? 5 : -5
      break

    case CHEMICALS.FERRIC:
      baseEfficiency += data.pH >= 5.0 && data.pH <= 8.5 ? 8 : -10
      break

    case CHEMICALS.POLYMER:
      baseEfficiency += data.TSS > 100 ? 12 : 5
      break

    case CHEMICALS.HYDROGEN_PEROXIDE:
      baseEfficiency += data.COD > 300 ? 15 : 0
      baseEfficiency -= data.TSS > 200 ? 10 : 0 // Less effective with high solids
      break
  }

  // Adjust based on dosage adequacy
  const expectedDosage = calculateDosage(data, chemical) * 1.2
  if (dosage < expectedDosage * 0.8) {
    baseEfficiency -= 15 // Underdosing penalty
  } else if (dosage > expectedDosage * 1.2) {
    baseEfficiency -= 5 // Overdosing slight penalty (waste of chemical)
  }

  // Clamp efficiency between 30% and 98%
  return Math.min(Math.max(baseEfficiency, 30), 98)
}

/**
 * Identifies potential issues with the treatment process
 */
function identifyPotentialIssues(data: SensorData): string | null {
  // Check for extreme pH values
  if (data.pH < 5.0) {
    return "Extremely acidic conditions may damage equipment. Consider pH adjustment before treatment."
  }

  if (data.pH > 9.5) {
    return "Highly alkaline conditions may reduce treatment efficiency. Consider pH adjustment before treatment."
  }

  // Check for high organic load
  if (data.BOD > 300 && data.COD > 800) {
    return "Very high organic load detected. Consider dilution or pre-treatment steps."
  }

  // Check for high solids content
  if (data.TSS > 350) {
    return "High suspended solids may clog equipment. Consider pre-filtration or sedimentation."
  }

  // Check for temperature issues
  if (data.Temperature && data.Temperature < 10) {
    return "Low temperature may reduce treatment efficiency. Consider temperature adjustment."
  }

  if (data.Temperature && data.Temperature > 40) {
    return "High temperature may affect chemical reactions. Monitor process closely."
  }

  // Check for flow rate issues
  if (data.Flow > 300) {
    return "High flow rate may reduce retention time. Consider flow equalization."
  }

  // No issues detected
  return null
}

/**
 * Mock function to simulate historical data retrieval
 * This would typically connect to a database or API
 */
export async function getHistoricalPredictions(deviceId: string, limit = 10): Promise<Prediction[]> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Generate mock historical data
  const mockData: Prediction[] = []
  const now = new Date()

  for (let i = 0; i < limit; i++) {
    const date = new Date(now)
    date.setHours(date.getHours() - i * 6) // 6-hour intervals

    mockData.push({
      chemical: [CHEMICALS.ALUM, CHEMICALS.PAC, CHEMICALS.FERRIC, CHEMICALS.POLYMER][Math.floor(Math.random() * 4)],
      quantity: 0.5 + Math.random() * 2,
      dosageUnit: "kg/10L",
      fault: Math.random() > 0.7 ? "Potential efficiency reduction due to temperature fluctuation." : null,
      efficiency: 70 + Math.random() * 25,
      timestamp: date.toISOString(),
    })
  }

  return mockData
}
