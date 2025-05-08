export interface FaultDiagnosisResult {
  hasFault: boolean
  faults: Fault[]
  severity: "low" | "medium" | "high"
  recommendations: string[]
}

export interface Fault {
  parameter: string
  value: number
  threshold: number
  description: string
  impact: string
  severity: "low" | "medium" | "high"
}

export interface ProcessParameters {
  pH?: number
  temperature?: number
  tss?: number
  cod?: number
  bod?: number
  hardness?: number
  [key: string]: number | undefined
}

// Thresholds for textile processing parameters
const PARAMETER_THRESHOLDS = {
  pH: { min: 6.0, max: 9.0, optimal: { min: 6.5, max: 8.5 } },
  temperature: { min: 30, max: 80, optimal: { min: 40, max: 60 } },
  tss: { max: 200, optimal: { max: 150 } },
  cod: { max: 500, optimal: { max: 350 } },
  bod: { max: 150, optimal: { max: 100 } },
  hardness: { max: 300, optimal: { max: 200 } },
}

// Impact descriptions for different parameters
const PARAMETER_IMPACTS = {
  pH: {
    low: "Low pH can damage equipment and affect chemical reactions",
    high: "High pH can reduce dye fixation and increase chemical consumption",
  },
  temperature: {
    low: "Low temperature reduces reaction rates and dye absorption",
    high: "High temperature increases energy costs and may damage fabric",
  },
  tss: {
    high: "High TSS can clog equipment and reduce dye penetration",
  },
  cod: {
    high: "High COD indicates excessive organic matter, affecting treatment efficiency",
  },
  bod: {
    high: "High BOD indicates high organic pollution, requiring more treatment chemicals",
  },
  hardness: {
    high: "High water hardness reduces chemical effectiveness and increases scaling",
  },
}

/**
 * Diagnoses faults in textile processing parameters
 */
export function diagnoseFaults(parameters: ProcessParameters): FaultDiagnosisResult {
  const faults: Fault[] = []

  // Check each parameter against thresholds
  Object.entries(parameters).forEach(([param, value]) => {
    if (value === undefined) return

    const paramKey = param.toLowerCase() as keyof typeof PARAMETER_THRESHOLDS
    const thresholds = PARAMETER_THRESHOLDS[paramKey]

    if (!thresholds) return

    // Check minimum thresholds
    if (thresholds.min !== undefined && value < thresholds.min) {
      faults.push({
        parameter: param,
        value,
        threshold: thresholds.min,
        description: `${param} is below minimum threshold (${thresholds.min})`,
        impact: PARAMETER_IMPACTS[paramKey]?.low || "May affect process efficiency",
        severity: value < thresholds.min * 0.9 ? "high" : "medium",
      })
    }

    // Check maximum thresholds
    if (thresholds.max !== undefined && value > thresholds.max) {
      faults.push({
        parameter: param,
        value,
        threshold: thresholds.max,
        description: `${param} exceeds maximum threshold (${thresholds.max})`,
        impact: PARAMETER_IMPACTS[paramKey]?.high || "May affect process efficiency",
        severity: value > thresholds.max * 1.2 ? "high" : "medium",
      })
    }
  })

  // Generate recommendations based on faults
  const recommendations = generateRecommendations(faults, parameters)

  // Determine overall severity
  let severity: "low" | "medium" | "high" = "low"
  if (faults.some((f) => f.severity === "high")) {
    severity = "high"
  } else if (faults.some((f) => f.severity === "medium")) {
    severity = "medium"
  }

  return {
    hasFault: faults.length > 0,
    faults,
    severity,
    recommendations,
  }
}

/**
 * Generates recommendations based on identified faults
 */
function generateRecommendations(faults: Fault[], parameters: ProcessParameters): string[] {
  const recommendations: string[] = []

  // pH adjustments
  const pHFault = faults.find((f) => f.parameter.toLowerCase() === "ph")
  if (pHFault) {
    if (parameters.pH && parameters.pH < PARAMETER_THRESHOLDS.pH.min) {
      recommendations.push("Add caustic soda or sodium carbonate to increase pH")
    } else if (parameters.pH && parameters.pH > PARAMETER_THRESHOLDS.pH.max) {
      recommendations.push("Add acetic acid or formic acid to decrease pH")
    }
  }

  // Temperature adjustments
  const tempFault = faults.find((f) => f.parameter.toLowerCase() === "temperature")
  if (tempFault) {
    if (parameters.temperature && parameters.temperature < PARAMETER_THRESHOLDS.temperature.min) {
      recommendations.push("Increase heating to optimal temperature range")
    } else if (parameters.temperature && parameters.temperature > PARAMETER_THRESHOLDS.temperature.max) {
      recommendations.push("Reduce temperature to prevent fabric damage and save energy")
    }
  }

  // TSS adjustments
  if (faults.find((f) => f.parameter.toLowerCase() === "tss")) {
    recommendations.push("Improve pre-treatment filtration to reduce suspended solids")
    recommendations.push("Consider using a flocculant to reduce TSS")
  }

  // COD/BOD adjustments
  if (faults.find((f) => f.parameter.toLowerCase() === "cod" || f.parameter.toLowerCase() === "bod")) {
    recommendations.push("Increase aeration in the treatment process")
    recommendations.push("Consider additional biological treatment steps")
  }

  // Hardness adjustments
  if (faults.find((f) => f.parameter.toLowerCase() === "hardness")) {
    recommendations.push("Use water softening treatment before processing")
    recommendations.push("Add sequestering agents to counter hardness effects")
  }

  // If no specific recommendations, add general ones
  if (recommendations.length === 0 && faults.length > 0) {
    recommendations.push("Review process parameters and adjust according to standard operating procedures")
    recommendations.push("Perform maintenance check on monitoring equipment to ensure accurate readings")
  }

  return recommendations
}
