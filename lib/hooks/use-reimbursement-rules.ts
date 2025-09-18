import { useState, useEffect } from 'react'
import type { Receipt } from '@/lib/types'
import reimbursementRules from '@/lib/sj-reimbursement-rules.json'
import { useReimbursementSettings } from '@/lib/contexts/reimbursement-settings-context'

export interface ReimbursementCalculation {
  originalAmount: number
  reimbursedAmount: number
  reimbursementPercentage: number
  appliedRule: string
  exclusions: string[]
  notes: string[]
}

export interface ReimbursementSummary {
  totalExpenses: number
  totalReimbursement: number
  totalExcluded: number
  hasExclusions: boolean
  explanations: string[]
  calculations: ReimbursementCalculation[]
}

export function useReimbursementRules() {
  const [rules] = useState(reimbursementRules)
  const { settings } = useReimbursementSettings()

  const calculateReimbursement = (receipt: Receipt): ReimbursementCalculation => {
    const originalAmount = receipt.amount
    let reimbursedAmount = originalAmount
    let appliedRule = 'Standard ersättning'
    const exclusions: string[] = []
    const notes: string[] = []

    // Check for alcohol/tobacco exclusions
    if (receipt.sj_approval?.contains_alcohol) {
      exclusions.push('Alkohol ersätts inte enligt SJ:s regler')
      reimbursedAmount = Math.max(0, originalAmount * 0.7) // Estimate 30% alcohol cost
      appliedRule = 'Partiell ersättning (alkohol exkluderat)'
    }

    if (receipt.sj_approval?.contains_tobacco) {
      exclusions.push('Tobak ersätts inte enligt SJ:s regler')
      reimbursedAmount = 0
      appliedRule = 'Ingen ersättning (tobak)'
    }

    // Apply category-specific rules based on simulation settings
    switch (receipt.category) {
      case 'Mat':
        // Check if SJ already provided meals
        if (settings.simulationMode && settings.sjProvidedMeals) {
          reimbursedAmount = 0
          appliedRule = 'Ingen ersättning (SJ tillhandahöll måltider)'
          exclusions.push('SJ bjöd redan på mat och dryck')
          break
        }

        // Check delay requirements for meal reimbursement
        if (settings.simulationMode) {
          const minDelayForMeals = settings.isLongDistance ? 60 : 20
          if (!settings.hasDelay || settings.delayMinutes < minDelayForMeals) {
            reimbursedAmount = 0
            appliedRule = `Ingen ersättning (krävs ${minDelayForMeals}+ min försening)`
            exclusions.push(`Måltidsersättning kräver minst ${minDelayForMeals} minuters försening`)
            break
          }
        }

        // Calculate meal reimbursement based on delay and distance
        let mealLimit = 200 // Default
        if (settings.simulationMode) {
          if (settings.isLongDistance) {
            mealLimit = settings.delayMinutes >= 120 ? 200 : 100
          } else {
            mealLimit = settings.delayMinutes >= 60 ? 100 : 50
          }
        }

        if (originalAmount <= mealLimit && !receipt.sj_approval?.contains_alcohol && !receipt.sj_approval?.contains_tobacco) {
          appliedRule = `Måltidsersättning (${settings.isLongDistance ? 'EU 2021/782' : 'SE 2015:953'})`
          notes.push(`Ersättning för rimliga måltidskostnader vid ${settings.delayMinutes}+ min försening`)
        } else if (originalAmount > mealLimit) {
          reimbursedAmount = mealLimit
          appliedRule = `Måltidsersättning (begränsad till ${mealLimit} SEK)`
          notes.push(`Ersättning begränsad enligt ${settings.isLongDistance ? 'EU' : 'svenska'} regler`)
        }
        break

      case 'Boende':
        // Check if SJ already provided accommodation
        if (settings.simulationMode && settings.sjProvidedAccommodation) {
          reimbursedAmount = 0
          appliedRule = 'Ingen ersättning (SJ ordnade logi)'
          exclusions.push('SJ ordnade redan hotellövernattning')
          break
        }

        // Long distance trips with significant delays may qualify for accommodation
        if (settings.simulationMode && (!settings.isLongDistance || settings.delayMinutes < 120)) {
          reimbursedAmount = 0
          appliedRule = 'Ingen ersättning (krävs långdistans + 120+ min försening)'
          exclusions.push('Logiersättning kräver långdistansresa och minst 120 minuters försening')
          break
        }

        const accommodationLimit = 1500
        if (originalAmount <= accommodationLimit) {
          appliedRule = 'Logi enligt EU 2021/782'
          notes.push('Ersättning för rimliga logikostnader vid övernattning')
        } else {
          reimbursedAmount = accommodationLimit
          appliedRule = `Logiersättning (begränsad till ${accommodationLimit} SEK/natt)`
          notes.push('Ersättning begränsad enligt EU-regler för logi')
        }
        break

      case 'Transport':
        // Check if SJ already provided alternative transport
        if (settings.simulationMode && settings.sjProvidedTransport) {
          reimbursedAmount = 0
          appliedRule = 'Ingen ersättning (SJ ordnade transport)'
          exclusions.push('SJ ordnade redan alternativ transport')
          break
        }

        // Check delay requirements for alternative transport
        if (settings.simulationMode) {
          const minDelayForTransport = settings.isLongDistance ? 60 : 20
          if (!settings.hasDelay || settings.delayMinutes < minDelayForTransport) {
            reimbursedAmount = 0
            appliedRule = `Ingen ersättning (krävs ${minDelayForTransport}+ min försening)`
            exclusions.push(`Transportersättning kräver minst ${minDelayForTransport} minuters försening`)
            break
          }
        }

        const transportLimit = settings.simulationMode && !settings.isLongDistance ? 1138 : 1200
        if (originalAmount <= transportLimit) {
          appliedRule = `Alternativ transport enligt ${settings.isLongDistance ? 'EU 2021/782' : 'SE 2015:953'}`
          notes.push('Ersättning för alternativ transport vid förseningar')
        } else {
          reimbursedAmount = transportLimit
          appliedRule = `Transportersättning (begränsad till ${transportLimit} SEK)`
          notes.push('Ersättning begränsad enligt gällande regler')
        }
        break

      default:
        reimbursedAmount = 0
        appliedRule = 'Ej berättigad kategori'
        exclusions.push('Kategorin är inte berättigad till ersättning')
    }

    const reimbursementPercentage = originalAmount > 0 ? (reimbursedAmount / originalAmount) * 100 : 0

    return {
      originalAmount,
      reimbursedAmount,
      reimbursementPercentage,
      appliedRule,
      exclusions,
      notes
    }
  }

  const calculateSummary = (receipts: Receipt[]): ReimbursementSummary => {
    const calculations = receipts.map(calculateReimbursement)
    const totalExpenses = calculations.reduce((sum, calc) => sum + calc.originalAmount, 0)
    const totalReimbursement = calculations.reduce((sum, calc) => sum + calc.reimbursedAmount, 0)
    const totalExcluded = totalExpenses - totalReimbursement
    const hasExclusions = calculations.some(calc => calc.exclusions.length > 0)

    const explanations: string[] = []
    
    // Add simulation mode explanation
    if (settings.simulationMode) {
      explanations.push('🔧 Simuleringsläge aktivt - ersättning beräknad med anpassade parametrar')
      if (settings.hasDelay) {
        explanations.push(`📍 Simulerar ${settings.delayMinutes} minuters försening på ${settings.isLongDistance ? 'långdistans' : 'kortdistans'}resa`)
      }
    }
    
    if (hasExclusions) {
      explanations.push('Vissa kostnader är exkluderade enligt SJ:s ersättningsregler')
    }
    
    if (calculations.some(calc => calc.reimbursedAmount < calc.originalAmount && calc.exclusions.length === 0)) {
      explanations.push('Ersättningsbelopp kan vara begränsade enligt EU-förordning 2021/782 och svensk lag')
    }

    if (!settings.simulationMode) {
      explanations.push('Ersättning baseras på rimliga kostnader med kvitto som underlag')
      explanations.push('Slutgiltig bedömning görs av SJ:s kundtjänst')
    } else {
      explanations.push('Detta är en simulering - faktisk ersättning kan variera baserat på verkliga omständigheter')
    }

    return {
      totalExpenses,
      totalReimbursement,
      totalExcluded,
      hasExclusions,
      explanations,
      calculations
    }
  }

  return {
    rules,
    calculateReimbursement,
    calculateSummary
  }
}
