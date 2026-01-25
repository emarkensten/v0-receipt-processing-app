"use client"

import { useState, useCallback } from "react"
import type { Receipt } from "@/lib/types"
import { UploadPage } from "@/components/upload-page"
import { ReviewPage } from "@/components/review-page"
import { ExpenseSummaryFinal } from "@/components/expense-summary-final"
import { ReimbursementSettingsProvider } from "@/lib/contexts/reimbursement-settings-context"

type AppState = "upload" | "review" | "summary"

export default function HomePage() {
  const [currentState, setCurrentState] = useState<AppState>("upload")
  const [receipts, setReceipts] = useState<Receipt[]>([])

  // Handle when files are processed and receipts are ready
  const handleFilesProcessed = useCallback((newReceipts: Receipt[]) => {
    setReceipts(prev => [...prev, ...newReceipts])
    setCurrentState("review")
  }, [])

  // Handle toggling item selection
  const handleItemToggle = useCallback((receiptId: string, itemId: string, selected: boolean) => {
    setReceipts(prev => prev.map(receipt => {
      if (receipt.id !== receiptId) return receipt

      const updatedItems = receipt.items.map(item =>
        item.id === itemId ? { ...item, selected } : item
      )

      // Recalculate selected total
      const selectedTotal = updatedItems
        .filter(item => item.selected)
        .reduce((sum, item) => sum + item.price * item.quantity, 0)

      return {
        ...receipt,
        items: updatedItems,
        selectedTotal
      }
    }))
  }, [])

  // Handle adding more receipts
  const handleAddMore = useCallback(() => {
    setCurrentState("upload")
  }, [])

  // Handle continuing to summary
  const handleContinueToSummary = useCallback(() => {
    setCurrentState("summary")
  }, [])

  // Handle going back to review
  const handleBackToReview = useCallback(() => {
    setCurrentState("review")
  }, [])

  // Handle going back to upload (from review)
  const handleBackToUpload = useCallback(() => {
    setCurrentState("upload")
  }, [])

  // Handle submitting expenses
  const handleSubmitExpenses = useCallback(() => {
    alert("Ersättningsansökan skickad till SJ Kundtjänst!")
    setCurrentState("upload")
    setReceipts([])
  }, [])

  const renderContent = () => {
    switch (currentState) {
      case "upload":
        return (
          <UploadPage
            onFilesProcessed={handleFilesProcessed}
          />
        )

      case "review":
        return (
          <ReviewPage
            receipts={receipts}
            onItemToggle={handleItemToggle}
            onAddMore={handleAddMore}
            onContinue={handleContinueToSummary}
            onBack={handleBackToUpload}
          />
        )

      case "summary":
        return (
          <ExpenseSummaryFinal
            receipts={receipts}
            onSubmit={handleSubmitExpenses}
            onBack={handleBackToReview}
          />
        )

      default:
        return null
    }
  }

  return (
    <ReimbursementSettingsProvider>
      <div className="min-h-screen bg-background">
        {renderContent()}
      </div>
    </ReimbursementSettingsProvider>
  )
}
