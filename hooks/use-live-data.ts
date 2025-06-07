"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { 
  collection, 
  query, 
  where, 
  limit, 
  onSnapshot, 
  getDocs, 
  orderBy, 
  Timestamp,
  Firestore,
  DocumentData,
  QueryDocumentSnapshot
} from "firebase/firestore"
import { 
  ref, 
  onValue, 
  off, 
  DataSnapshot, 
  Database, 
  Unsubscribe 
} from "firebase/database"
import { db as firestoreDb, realtimeDb } from "@/lib/firebase"

export interface LiveSensorReading {
  id: string
  deviceId: string
  timestamp: Date
  pH: number
  BOD: number
  COD: number
  TSS: number
  flow: number
  temperature?: number
  DO?: number
  conductivity?: number
  turbidity?: number
  isOffline?: boolean
  lastOnlineTime?: Date
}

export function useLiveData(deviceId?: string) {
  // State
  const [liveReading, setLiveReading] = useState<LiveSensorReading | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(360) // 360 seconds = 6 minutes
  const [isOffline, setIsOffline] = useState(false)
  const [offlineSince, setOfflineSince] = useState<Date | null>(null)
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const lastDataReceivedRef = useRef<Date>(new Date())
  const offlineCheckTimerRef = useRef<NodeJS.Timeout | null>(null)
  const firestoreUnsubscribe = useRef<Unsubscribe | null>(null)
  const realtimeUnsubscribe = useRef<Unsubscribe | null>(null)
  const networkStatusRef = useRef<boolean>(
    typeof window !== "undefined" ? navigator.onLine : true
  )

  // Check if Firebase services are available
  const isFirebaseAvailable = useCallback((): boolean => {
    if (!firestoreDb || !realtimeDb) {
      console.error('Firebase services are not properly initialized')
      setError('Firebase services are not available')
      return false
    }
    return true
  }, [])

  // Monitor network status
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleOnline = () => {
      console.log("Network is online")
      networkStatusRef.current = true
      setError(null)
    }

    const handleOffline = () => {
      console.log("Network is offline")
      networkStatusRef.current = false
      setIsOffline(true)
      setOfflineSince(new Date())
      setError("You are currently offline. Showing last available data.")
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial check
    if (!navigator.onLine) {
      handleOffline()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Countdown timer for refresh indicator
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    // Initialize with the full 6 minutes (360 seconds)
    setTimeUntilRefresh(360)


    // Update every minute (60000ms)
    timerRef.current = setInterval(() => {
      setTimeUntilRefresh(prev => {
        const newValue = prev - 60 // Decrease by 60 seconds (1 minute)
        return newValue <= 0 ? 360 : newValue // Reset to 6 minutes when it reaches 0
      })
    }, 60000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // Fetch last known data from Firestore
  const fetchLastKnownData = useCallback(async (deviceId: string): Promise<LiveSensorReading | null> => {
    if (!firestoreDb) {
      console.error('Firestore is not initialized')
      return null
    }
    
    try {
      const readingsRef = collection(firestoreDb, "sensorReadings")
      const q = query(
        readingsRef,
        where("deviceId", "==", deviceId),
        orderBy("timestamp", "desc"),
        limit(1)
      )

      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        const doc = snapshot.docs[0]
        const data = doc.data()
        
        return {
          id: doc.id,
          deviceId: data.deviceId,
          timestamp: data.timestamp?.toDate() || new Date(),
          pH: data.pH || 0,
          BOD: data.BOD || 0,
          COD: data.COD || 0,
          TSS: data.TSS || 0,
          flow: data.flow || 0,
          temperature: data.temperature || 25,
          DO: data.DO || 6,
          conductivity: data.conductivity || 1000,
          turbidity: data.turbidity || 2,
          isOffline: true,
          lastOnlineTime: data.timestamp?.toDate()
        }
      }
      return null
    } catch (err) {
      console.error('Error fetching last known data:', err)
      return null
    }
  }, [])

  // Set up realtime database listener
  useEffect(() => {
    if (!deviceId) {
      setLoading(false)
      return
    }

    if (!realtimeDb) {
      setError('Realtime database is not available')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const deviceRef = ref(realtimeDb, `Clients/TyWRS0Zyusc3tbtcU0PcBPdXSjb2/devices/RPi001/Live`)
    
    const onValueChange = (snapshot: DataSnapshot) => {
      const data = snapshot.val()
      if (data) {
        const reading: LiveSensorReading = {
          id: deviceId,
          deviceId,
          timestamp: data.Timestamp ? new Date(data.Timestamp) : new Date(),
          pH: Number(data.PH) || 0,
          BOD: Number(data.BOD) || 0,
          COD: Number(data.COD) || 0,
          TSS: Number(data.TSS) || 0,
          flow: Number(data.Flow) || 0,
          temperature: Number(data.Temperature) || 25,
          DO: Number(data.DO) || 6,
          conductivity: Number(data.Conductivity) || 1000,
          turbidity: Number(data.Turbidity) || 2,
          isOffline: false,
        }

        setLiveReading(reading)
        setLastUpdated(new Date())
        lastDataReceivedRef.current = new Date()
        setIsOffline(false)
        setOfflineSince(null)
      }
      setLoading(false)
    }

    const onError = (error: Error) => {
      console.error('Realtime database error:', error)
      setError('Failed to connect to realtime data')
      setLoading(false)
      
      // Try to fetch last known data from Firestore
      fetchLastKnownData(deviceId).then(lastData => {
        if (lastData) {
          setLiveReading(lastData)
          setIsOffline(true)
          setOfflineSince(lastData.lastOnlineTime || new Date())
        }
      })
    }

    // Subscribe to realtime updates
    realtimeUnsubscribe.current = onValue(deviceRef, onValueChange, onError)

    // Initial fetch of last known data
    fetchLastKnownData(deviceId).then(lastData => {
      if (lastData && !liveReading) {
        setLiveReading(lastData)
      }
    })

    // Cleanup function
    return () => {
      if (realtimeUnsubscribe.current) {
        realtimeUnsubscribe.current()
        realtimeUnsubscribe.current = null
      }
    }
  }, [deviceId, fetchLastKnownData])

  // Cleanup all listeners on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      if (offlineCheckTimerRef.current) {
        clearInterval(offlineCheckTimerRef.current)
        offlineCheckTimerRef.current = null
      }
      if (firestoreUnsubscribe.current) {
        firestoreUnsubscribe.current()
        firestoreUnsubscribe.current = null
      }
      if (realtimeUnsubscribe.current) {
        realtimeUnsubscribe.current()
        realtimeUnsubscribe.current = null
      }
    }
  }, [])

  return {
    liveReading,
    lastUpdated,
    timeUntilRefresh,
    loading,
    error,
    isOffline,
    offlineSince,
  }
}
