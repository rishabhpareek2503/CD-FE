// This file is used to verify that the data structure in Firebase is correct
// and to log helpful debugging information

export function initDataVerification() {
    if (typeof window === "undefined") return
  
    console.log("Initializing data verification...")
  
    // Log the Firebase configuration
    console.log("Firebase configuration:", {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "Set" : "Not set",
      databaseURL:
        process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://live-monitoring-system-default-rtdb.firebaseio.com",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "live-monitoring-system",
    })
  
    // Log the expected data path
    console.log("Expected data path: HMI_Sensor_Data/RPi001/Live")
  
    // Log browser information
    console.log("Browser information:", {
      userAgent: navigator.userAgent,
      language: navigator.language,
      online: navigator.onLine,
    })
  
    // Log helpful debugging tips
    console.log("Debugging tips:")
    console.log("1. Make sure your Firebase Realtime Database has data at path: HMI_Sensor_Data/RPi001/Live")
    console.log("2. The data should have fields: PH, BOD, COD, TSS, Flow, Temperature, DO, Conductivity, Turbidity")
    console.log("3. Check the Firebase console for any permission errors")
    console.log("4. Ensure your Firebase project has the Realtime Database enabled")
  }
  