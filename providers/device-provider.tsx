"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"
import { useAuth } from "./auth-provider"

interface Device {
  id: string
  serialNumber: string
  name: string
  location: string
  companyId: string
  companyName: string
  installationDate: Date
  lastMaintenance: Date
  status: "online" | "offline" | "maintenance"
}

interface Company {
  id: string
  name: string
  location: string
}

interface DeviceContextType {
  devices: Device[]
  companies: Company[]
  selectedDevice: Device | null
  selectedCompany: Company | null
  loading: boolean
  error: string | null
  selectDevice: (deviceId: string) => void
  selectCompany: (companyId: string) => void
}

const DeviceContext = createContext<DeviceContextType | null>(null)

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const { user, userProfile } = useAuth()
  const [devices, setDevices] = useState<Device[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch user's devices and companies
  useEffect(() => {
    if (!user) {
      setDevices([])
      setCompanies([])
      setSelectedDevice(null)
      setSelectedCompany(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Fetch companies first
    const fetchCompanies = async () => {
      try {
        if (!userProfile?.companies || userProfile.companies.length === 0) {
          setCompanies([])
          return
        }

        const companiesData: Company[] = []

        for (const companyId of userProfile.companies) {
          const companyDoc = await getDoc(doc(db, "companies", companyId))
          if (companyDoc.exists()) {
            companiesData.push({
              id: companyDoc.id,
              ...companyDoc.data(),
            } as Company)
          }
        }

        setCompanies(companiesData)

        // Set first company as selected if none is selected
        if (companiesData.length > 0 && !selectedCompany) {
          setSelectedCompany(companiesData[0])
        }
      } catch (err) {
        console.error("Error fetching companies:", err)
        setError("Failed to load companies")
      }
    }

    // Fetch devices
    const fetchDevices = () => {
      const devicesQuery = query(collection(db, "devices"), where("userId", "==", user.uid))

      return onSnapshot(
        devicesQuery,
        async (snapshot) => {
          try {
            const devicesData: Device[] = []

            for (const docSnapshot of snapshot.docs) {
              const data = docSnapshot.data()

              // Fetch company name
              let companyName = "Unknown"
              if (data.companyId) {
                const companyDocRef = doc(db, "companies", data.companyId)
                const companyDocSnapshot = await getDoc(companyDocRef)
                if (companyDocSnapshot.exists()) {
                  companyName = companyDocSnapshot.data().name
                }
              }

              devicesData.push({
                id: docSnapshot.id,
                ...data,
                companyName,
                installationDate: data.installationDate ? new Date(data.installationDate) : new Date(),
                lastMaintenance: data.lastMaintenance ? new Date(data.lastMaintenance) : new Date(),
              } as Device)
            }

            setDevices(devicesData)

            // Set first device as selected if none is selected
            if (devicesData.length > 0 && !selectedDevice) {
              setSelectedDevice(devicesData[0])
            }

            setLoading(false)
          } catch (err) {
            console.error("Error processing devices:", err)
            setError("Failed to process devices data")
            setLoading(false)
          }
        },
        (err) => {
          console.error("Error fetching devices:", err)
          setError("Failed to load devices")
          setLoading(false)
        },
      )
    }

    fetchCompanies()
    const unsubscribe = fetchDevices()

    return () => unsubscribe()
  }, [user, userProfile, selectedCompany, selectedDevice])

  // Select a device
  const selectDevice = (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId)
    if (device) {
      setSelectedDevice(device)

      // Also select the company if it's different
      if (!selectedCompany || selectedCompany.id !== device.companyId) {
        const company = companies.find((c) => c.id === device.companyId)
        if (company) {
          setSelectedCompany(company)
        }
      }
    }
  }

  // Select a company
  const selectCompany = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId)
    if (company) {
      setSelectedCompany(company)

      // If current selected device is not from this company, select the first device from this company
      if (selectedDevice && selectedDevice.companyId !== companyId) {
        const companyDevices = devices.filter((d) => d.companyId === companyId)
        if (companyDevices.length > 0) {
          setSelectedDevice(companyDevices[0])
        } else {
          setSelectedDevice(null)
        }
      }
    }
  }

  return (
    <DeviceContext.Provider
      value={{
        devices,
        companies,
        selectedDevice,
        selectedCompany,
        loading,
        error,
        selectDevice,
        selectCompany,
      }}
    >
      {children}
    </DeviceContext.Provider>
  )
}

export function useDevices() {
  const context = useContext(DeviceContext)
  if (!context) {
    throw new Error("useDevices must be used within a DeviceProvider")
  }
  return context
}
