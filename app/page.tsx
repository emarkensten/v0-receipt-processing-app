"use client"

import { useState } from "react"
import type { Receipt } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { WelcomeScreen } from "@/components/welcome-screen"
import { ImageGrid } from "@/components/image-grid"
import { ReceiptOverview } from "@/components/receipt-overview"
import { ExpenseSummaryFinal } from "@/components/expense-summary-final"
import { ReceiptEditModal } from "@/components/receipt-edit-modal"
import { ReceiptDetailModal } from "@/components/receipt-detail-modal"
import { ExpenseSelectionSheet } from "@/components/expense-selection-sheet"
import { ReimbursementSettingsProvider } from "@/lib/contexts/reimbursement-settings-context"
import { ArrowLeft } from "lucide-react"

type AppState = "welcome" | "image-grid" | "review" | "summary"

export default function HomePage() {
  const [currentState, setCurrentState] = useState<AppState>("welcome")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0, currentFile: "" })
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showExpenseSheet, setShowExpenseSheet] = useState(false)

  const handleFileUpload = async (files: File[]) => {
    setUploadedFiles([...uploadedFiles, ...files])
    setIsProcessing(true)
    setError(null)

    try {
      const processedReceipts: Receipt[] = []

      for (const file of files) {

        const reader = new FileReader()
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })

        const response = await fetch("/api/process-receipt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ documentUrl: dataUrl }),
        })


        const responseClone = response.clone()

        if (!response.ok) {
          let errorMessage = "Kunde inte bearbeta kvittot"

          try {
            const errorData = await responseClone.json()
            errorMessage = errorData.error || errorMessage
          } catch (jsonError) {
            // If response is not JSON, get text content from original response
            try {
              const errorText = await response.text()
              console.error("[v0] Non-JSON error response:", errorText)
              errorMessage = `Server error: ${response.status} ${response.statusText}`
            } catch (textError) {
              console.error("[v0] Could not read response:", textError)
              errorMessage = `Server error: ${response.status} ${response.statusText}`
            }
          }

          throw new Error(errorMessage)
        }

        let receiptData
        try {
          receiptData = await response.json()
        } catch (jsonError) {
          console.error("[v0] Failed to parse JSON response:", jsonError)
          try {
            const responseText = await responseClone.text()
            console.error("[v0] Response text:", responseText)
            throw new Error("Servern returnerade ett ogiltigt svar. Försök igen.")
          } catch (textError) {
            console.error("[v0] Could not read response text:", textError)
            throw new Error("Kunde inte läsa serverns svar. Försök igen.")
          }
        }

        processedReceipts.push({
          ...receiptData,
          id: `receipt-${Date.now()}-${Math.random()}`,
          image_url: URL.createObjectURL(file),
        })
      }

      setReceipts([...receipts, ...processedReceipts])
      setCurrentState("review")
    } catch (err) {
      console.error("[v0] Processing error:", err)
      setError(err instanceof Error ? err.message : "Ett oväntat fel inträffade")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSimpleFileUpload = (files: File[]) => {
    setUploadedFiles([...uploadedFiles, ...files])
    setShowExpenseSheet(false)
    setCurrentState("image-grid")
  }

  const handleProcessReceipts = async () => {
    setIsProcessing(true)
    setError(null)
    setProcessingProgress({ current: 0, total: uploadedFiles.length, currentFile: "" })

    try {
      const processedReceipts: Receipt[] = []

      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i]
        setProcessingProgress({ current: i + 1, total: uploadedFiles.length, currentFile: file.name })

        const reader = new FileReader()
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })

        const response = await fetch("/api/process-receipt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ documentUrl: dataUrl }),
        })

        if (!response.ok) {
          let errorMessage = "Kunde inte bearbeta kvittot"
          try {
            const errorData = await response.json()
            if (errorData.error && typeof errorData.error === "string") {
              errorMessage = errorData.error
            }
          } catch (e) {
            console.error("Failed to parse error response")
          }
          throw new Error(errorMessage)
        }

        const result = await response.json()
        processedReceipts.push(result)
      }

      setReceipts(processedReceipts)
      setCurrentState("review")
    } catch (err) {
      console.error("Processing error:", err)
      const errorMessage = err instanceof Error ? err.message : "Ett oväntat fel inträffade"
      setError(errorMessage)
    } finally {
      setIsProcessing(false)
      setProcessingProgress({ current: 0, total: 0, currentFile: "" })
    }
  }

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
  }

  const handleEditReceipt = (receipt: Receipt) => {
    setEditingReceipt(receipt)
    setShowEditModal(true)
  }

  const getReceiptFile = (receipt: Receipt) => {
    const receiptIndex = receipts.findIndex(r => r.id === receipt.id)
    return uploadedFiles[receiptIndex] || null
  }

  const handleShowAllData = () => {
    setShowDetailModal(true)
  }

  const handleSaveReceipt = (updatedReceipt: Receipt) => {
    setReceipts(receipts.map((r) => (r.id === updatedReceipt.id ? updatedReceipt : r)))
    setEditingReceipt(null)
    setCurrentState("review")
  }

  const handleDeleteReceipt = (id: string) => {
    setReceipts(receipts.filter((r) => r.id !== id))
  }

  const handleSubmitExpenses = () => {
    alert("Ersättningsansökan skickad till SJ Kundtjänst!")
    setCurrentState("welcome")
    setUploadedFiles([])
    setReceipts([])
  }

  const renderContent = () => {
    switch (currentState) {
      case "welcome":
        return (
          <WelcomeScreen 
            onStartExpenseFlow={() => setShowExpenseSheet(true)}
            onSkip={() => setCurrentState("summary")}
            showExpenseSheet={showExpenseSheet}
            onCloseExpenseSheet={() => setShowExpenseSheet(false)}
            uploadedFiles={uploadedFiles}
            onFileUpload={handleSimpleFileUpload}
            onRemoveFile={handleRemoveFile}
            isProcessing={isProcessing}
            error={error}
            processingProgress={processingProgress}
          />
        )


      case "image-grid":
        return (
          <>
            <ImageGrid 
              uploadedFiles={uploadedFiles}
              onRemoveFile={handleRemoveFile}
              onAddMoreFiles={() => setShowExpenseSheet(true)}
              onProcessFiles={handleProcessReceipts}
              isProcessing={isProcessing}
              processingProgress={processingProgress}
            />
            
            {/* Expense Selection Sheet */}
            <ExpenseSelectionSheet
              isOpen={showExpenseSheet}
              onClose={() => setShowExpenseSheet(false)}
              uploadedFiles={uploadedFiles}
              onFileUpload={handleSimpleFileUpload}
              onRemoveFile={handleRemoveFile}
              isProcessing={isProcessing}
              error={error}
              processingProgress={processingProgress}
            />
          </>
        )

      case "review":
        return (
          <ReceiptOverview 
            receipts={receipts}
            uploadedFiles={uploadedFiles}
            onEditReceipt={handleEditReceipt}
            onShowAllData={handleShowAllData}
            onSave={() => setCurrentState("summary")}
          />
        )

      case "edit":
        return (
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => setCurrentState("review")}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Avbryt</span>
              </div>
            </div>

            {editingReceipt && (
              <ReceiptEditForm
                receipt={editingReceipt}
                onSave={handleSaveReceipt}
                onCancel={() => setCurrentState("review")}
              />
            )}
          </div>
        )

      case "summary":
        return (
          <ExpenseSummaryFinal 
            receipts={receipts}
            onSubmit={handleSubmitExpenses}
            onBack={() => setCurrentState("review")}
          />
        )

      default:
        return null
    }
  }

  return (
    <ReimbursementSettingsProvider>
      <div className="min-h-screen bg-background p-4">
        {renderContent()}
        
        {/* Modals */}
        <ReceiptEditModal
          receipt={editingReceipt}
          receiptFile={editingReceipt ? getReceiptFile(editingReceipt) : null}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingReceipt(null)
          }}
          onSave={(updatedReceipt) => {
            setReceipts(receipts.map((r) => (r.id === updatedReceipt.id ? updatedReceipt : r)))
            setShowEditModal(false)
            setEditingReceipt(null)
          }}
        />
        
        <ReceiptDetailModal
          receipts={receipts}
          uploadedFiles={uploadedFiles}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
        />
      </div>
    </ReimbursementSettingsProvider>
  )
}
