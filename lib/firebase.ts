import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth"
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore"
import { getDatabase, connectDatabaseEmulator, type Database } from "firebase/database"
import { getStorage, connectStorageEmulator, type FirebaseStorage } from "firebase/storage"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAAYIEWR-ewTCj-i0U0BquqcCSLJYDDVdY",
  authDomain: "live-monitoring-system.firebaseapp.com",
  databaseURL: "https://live-monitoring-system-default-rtdb.firebaseio.com",
  projectId: "live-monitoring-system",
  storageBucket: "live-monitoring-system.firebasestorage.app",
  messagingSenderId: "396044271748",
  appId: "1:396044271748:web:732d8bbfc8e06b7c8582d1",
  measurementId: "G-3R13EZNEJZ"
}

// Initialize Firebase
let app: FirebaseApp | undefined
let auth: Auth | undefined
let db: Firestore | undefined
let realtimeDb: Database | undefined
let storage: FirebaseStorage | undefined

// Only initialize on client side
if (typeof window !== 'undefined') {
  try {
    // Initialize only once
    if (!getApps().length) {
      app = initializeApp(firebaseConfig)
      console.log("Firebase initialized successfully")
    } else {
      app = getApp()
    }

    // Initialize services
    auth = getAuth(app)
    db = getFirestore(app)
    realtimeDb = getDatabase(app)
    storage = getStorage(app)

    // Use emulators in development
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
      connectAuthEmulator(auth, "http://localhost:9099")
      connectFirestoreEmulator(db, "localhost", 8080)
      connectDatabaseEmulator(realtimeDb, "localhost", 9000)
      connectStorageEmulator(storage, "localhost", 9199)
      console.log("Using Firebase emulators")
    }
  } catch (error) {
    console.error("Firebase initialization error:", error)
  }
}

// Export Firebase instances with their respective types
export { app, auth, db, realtimeDb, storage }
export type { FirebaseApp, Auth, Firestore, Database, FirebaseStorage }
