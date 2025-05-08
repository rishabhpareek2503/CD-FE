import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth"
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore"
import { getDatabase, connectDatabaseEmulator, type Database } from "firebase/database"
import { getStorage, connectStorageEmulator, type FirebaseStorage } from "firebase/storage"

// Default fallback configuration in case environment variables are not available
const defaultConfig = {
  apiKey: "AIzaSyAAYIEWR-ewTCj-i0U0BquqcCSLJYDDVdY",
  authDomain: "live-monitoring-system.firebaseapp.com",
  databaseURL: "https://live-monitoring-system-default-rtdb.firebaseio.com",
  projectId: "live-monitoring-system",
  storageBucket: "live-monitoring-system.firebasestorage.app",
  messagingSenderId: "396044271748",
  appId: "1:396044271748:web:732d8bbfc8e06b7c8582d1",
  measurementId: "G-3R13EZNEJZ",
}

// Use environment variables if available, otherwise use default values
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || defaultConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || defaultConfig.authDomain,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || defaultConfig.databaseURL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || defaultConfig.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || defaultConfig.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || defaultConfig.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || defaultConfig.appId,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || defaultConfig.measurementId,
}

// Initialize Firebase with proper types
let app: FirebaseApp
let auth: Auth
let db: Firestore
let realtimeDb: Database
let storage: FirebaseStorage

// Try to initialize Firebase, and provide mock implementations if it fails
try {
  // Initialize Firebase only if it hasn't been initialized already
  app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0]
  auth = getAuth(app)
  db = getFirestore(app)
  realtimeDb = getDatabase(app)
  storage = getStorage(app)
} catch (error) {
  console.error("Firebase initialization error:", error)

  // Create mock implementations to prevent app from crashing
  // This allows the app to run even if Firebase is not properly configured
  const mockApp = {} as any
  auth = {} as any
  db = {} as any
  realtimeDb = {} as any
  storage = {} as any
}

// Check if we're in development mode and use emulators if needed
if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true") {
  connectAuthEmulator(auth, "http://localhost:9099")
  connectFirestoreEmulator(db, "localhost", 8080)
  connectDatabaseEmulator(realtimeDb, "localhost", 9000)
  connectStorageEmulator(storage, "localhost", 9199)
}

// Export Firebase instances with their respective types
export { app, auth, db, realtimeDb, storage }
export type { FirebaseApp, Auth, Firestore, Database, FirebaseStorage }
