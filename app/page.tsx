"use client"

import { useState } from "react"
import type { Receipt } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ReceiptUpload } from "@/components/receipt-upload"
import { ReceiptList } from "@/components/receipt-list"
import { ReceiptEditForm } from "@/components/receipt-edit-form"
import { ExpenseSummary } from "@/components/expense-summary"
import { ThemeToggle } from "@/components/theme-toggle"
import { ArrowLeft, Trees } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type AppState = "intro" | "upload" | "review" | "edit" | "summary"

export default function HomePage() {
  const [currentState, setCurrentState] = useState<AppState>("intro")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (files: File[]) => {
    setUploadedFiles([...uploadedFiles, ...files])
    setIsProcessing(true)
    setError(null)

    try {
      const processedReceipts: Receipt[] = []

      for (const file of files) {
        console.log("[v0] Processing file:", file.name)

        const reader = new FileReader()
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })

        console.log("[v0] Data URL format:", dataUrl.substring(0, 50) + "...")
        console.log("[v0] Making API request")
        const response = await fetch("/api/process-receipt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ documentUrl: dataUrl }),
        })

        console.log("[v0] Response status:", response.status)
        console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

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
          console.log("[v0] Successfully parsed JSON response")
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

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
  }

  const handleEditReceipt = (receipt: Receipt) => {
    setEditingReceipt(receipt)
    setCurrentState("edit")
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
    setCurrentState("intro")
    setUploadedFiles([])
    setReceipts([])
  }

  const renderContent = () => {
    switch (currentState) {
      case "intro":
        return (
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="flex justify-end mb-4">
              <ThemeToggle />
            </div>
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                <Trees className="w-12 h-12 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">Egna utlägg</h1>
              <p className="text-muted-foreground">
                Om du lagt ut pengar för mat, boende eller alternativa transporter kan du ansöka om ersättning för det.
              </p>
            </div>
            <div className="space-y-3">
              <Button onClick={() => setCurrentState("upload")} className="w-full" size="lg">
                Lägg till egna utlägg
              </Button>
              <Button variant="outline" onClick={() => alert("Funktionen kommer snart")} className="w-full">
                Hoppa över
              </Button>
            </div>
          </div>
        )

      case "upload":
        return (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => setCurrentState("intro")}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-xl font-semibold">Lägg till egna utlägg</h1>
              </div>
              <ThemeToggle />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <ReceiptUpload
              onUpload={handleFileUpload}
              isProcessing={isProcessing}
              uploadedFiles={uploadedFiles}
              onRemoveFile={handleRemoveFile}
            />

            {uploadedFiles.length > 0 && !isProcessing && (
              <div className="text-center">
                <Button onClick={() => setCurrentState("review")}>Granska bilder</Button>
              </div>
            )}
          </div>
        )

      case "review":
        return (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => setCurrentState("upload")}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-xl font-semibold">Lägg till egna utlägg</h1>
              </div>
              <ThemeToggle />
            </div>

            <ReceiptList receipts={receipts} onEdit={handleEditReceipt} onDelete={handleDeleteReceipt} />

            {receipts.length > 0 && (
              <div className="space-y-4">
                <Button variant="outline" onClick={() => setCurrentState("upload")} className="w-full">
                  Ladda upp flera bilder
                </Button>
                <Button onClick={() => setCurrentState("summary")} className="w-full">
                  Visa all data som hämtats från bilderna
                </Button>
              </div>
            )}
          </div>
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
              <ThemeToggle />
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
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => setCurrentState("review")}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Avbryt</span>
              </div>
              <ThemeToggle />
            </div>

            <ExpenseSummary receipts={receipts} onSubmit={handleSubmitExpenses} />
          </div>
        )

      default:
        return null
    }
  }

  return <div className="min-h-screen bg-background p-4">{renderContent()}</div>
}
