"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"

// Interface for the user-device association
export interface UserDeviceAccess {
  id?: string
  email: string
  deviceId: string
  accessLevel?: 'read' | 'readwrite' | 'admin'
  createdAt: Date
}

// Function to get all devices a user has access to
export async function getUserDevices(userEmail: string): Promise<string[]> {
  try {
    const accessRef = collection(db, "userDeviceAccess")
    const q = query(accessRef, where("email", "==", userEmail))
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return []
    }
    
    return snapshot.docs.map(doc => doc.data().deviceId)
  } catch (error) {
    console.error("Error fetching user devices:", error)
    return []
  }
}

// Hook to get current user's devices
export function useUserDevices() {
  const [devices, setDevices] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchUserDevices = async () => {
      try {
        setLoading(true)
        // Get current user's email
        const currentUser = auth.currentUser
        if (!currentUser || !currentUser.email) {
          setDevices([])
          setError("User not authenticated")
          setLoading(false)
          return
        }
        
        const userDevices = await getUserDevices(currentUser.email)
        setDevices(userDevices)
        setLoading(false)
      } catch (err) {
        console.error("Error in useUserDevices:", err)
        setError("Failed to fetch user devices")
        setLoading(false)
      }
    }
    
    fetchUserDevices()
  }, [])
  
  return { devices, loading, error }
}

// Admin function to grant a user access to a device
export async function grantDeviceAccess(email: string, deviceId: string, accessLevel: 'read' | 'readwrite' | 'admin' = 'read'): Promise<boolean> {
  try {
    // Check if this association already exists
    const accessRef = collection(db, "userDeviceAccess")
    const q = query(accessRef, 
      where("email", "==", email),
      where("deviceId", "==", deviceId)
    )
    const snapshot = await getDocs(q)
    
    // If it doesn't exist, create it
    if (snapshot.empty) {
      await addDoc(collection(db, "userDeviceAccess"), {
        email,
        deviceId,
        accessLevel,
        createdAt: new Date()
      })
      return true
    }
    
    // Already exists
    return true
  } catch (error) {
    console.error("Error granting device access:", error)
    return false
  }
}

// Admin function to revoke a user's access to a device
export async function revokeDeviceAccess(email: string, deviceId: string): Promise<boolean> {
  try {
    const accessRef = collection(db, "userDeviceAccess")
    const q = query(accessRef, 
      where("email", "==", email),
      where("deviceId", "==", deviceId)
    )
    const snapshot = await getDocs(q)
    
    if (!snapshot.empty) {
      // Delete each matching document
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deletePromises)
      return true
    }
    
    // Nothing to delete
    return true
  } catch (error) {
    console.error("Error revoking device access:", error)
    return false
  }
}
