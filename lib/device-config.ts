export interface DeviceConfig {
  id: string
  name: string
  location: string
  type: string
  status: "online" | "offline" | "maintenance"
  installationDate: string
  lastMaintenance: string
  serialNumber: string
}

export const AVAILABLE_DEVICES: DeviceConfig[] = [
  {
    id: "RPi001",
    name: "Raspberry Pi Sensor 001",
    location: "Treatment Plant 1 - Primary Tank",
    type: "Standard Sensor",
    status: "online",
    installationDate: "2022-10-01",
    lastMaintenance: "2023-05-15",
    serialNumber: "RPI-001-2022",
  },
  {
    id: "RPi002",
    name: "Raspberry Pi Sensor 002",
    location: "Treatment Plant 1 - Secondary Tank",
    type: "Standard Sensor",
    status: "online",
    installationDate: "2023-01-15",
    lastMaintenance: "2023-06-20",
    serialNumber: "RPI-002-2023",
  },
]

export const getDeviceById = (deviceId: string): DeviceConfig | undefined => {
  return AVAILABLE_DEVICES.find((device) => device.id === deviceId)
}

export const getDeviceIds = (): string[] => {
  return AVAILABLE_DEVICES.map((device) => device.id)
}
