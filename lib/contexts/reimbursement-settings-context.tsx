"use client"

import { createContext, useContext, useState, ReactNode } from "react"

export interface ReimbursementSettings {
  // Delay settings
  delayMinutes: number
  hasDelay: boolean
  
  // SJ provided services
  sjProvidedMeals: boolean
  sjProvidedAccommodation: boolean
  sjProvidedTransport: boolean
  
  // Trip details
  tripDistance: number // km
  isLongDistance: boolean // >150km
  
  // Simulation mode
  simulationMode: boolean
}

interface ReimbursementSettingsContextType {
  settings: ReimbursementSettings
  updateSettings: (newSettings: Partial<ReimbursementSettings>) => void
  resetSettings: () => void
}

const defaultSettings: ReimbursementSettings = {
  delayMinutes: 0,
  hasDelay: false,
  sjProvidedMeals: false,
  sjProvidedAccommodation: false,
  sjProvidedTransport: false,
  tripDistance: 200, // Default to long distance
  isLongDistance: true,
  simulationMode: false
}

const ReimbursementSettingsContext = createContext<ReimbursementSettingsContextType | undefined>(undefined)

export function ReimbursementSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ReimbursementSettings>(defaultSettings)

  const updateSettings = (newSettings: Partial<ReimbursementSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings }
      
      // Auto-calculate isLongDistance based on tripDistance
      if (newSettings.tripDistance !== undefined) {
        updated.isLongDistance = newSettings.tripDistance > 150
      }
      
      // Auto-calculate hasDelay based on delayMinutes
      if (newSettings.delayMinutes !== undefined) {
        updated.hasDelay = newSettings.delayMinutes > 0
      }
      
      return updated
    })
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
  }

  return (
    <ReimbursementSettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </ReimbursementSettingsContext.Provider>
  )
}

export function useReimbursementSettings() {
  const context = useContext(ReimbursementSettingsContext)
  if (context === undefined) {
    throw new Error('useReimbursementSettings must be used within a ReimbursementSettingsProvider')
  }
  return context
}
