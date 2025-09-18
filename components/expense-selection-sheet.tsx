"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReceiptUpload } from "@/components/receipt-upload"
import { X } from "lucide-react"

interface ExpenseSelectionSheetProps {
  isOpen: boolean
  onClose: () => void
  uploadedFiles: File[]
  onFileUpload: (files: File[]) => void
  onRemoveFile: (index: number) => void
  isProcessing?: boolean
  error?: string | null
  processingProgress?: { current: number; total: number; currentFile: string }
}

export function ExpenseSelectionSheet({ 
  isOpen, 
  onClose, 
  uploadedFiles,
  onFileUpload,
  onRemoveFile,
  isProcessing = false,
  error = null,
  processingProgress = { current: 0, total: 0, currentFile: "" }
}: ExpenseSelectionSheetProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
      <Card className="w-full max-w-2xl md:max-w-4xl rounded-t-2xl md:rounded-2xl rounded-b-none md:rounded-b-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Lägg till egna utlägg</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground text-sm">
            Fotografera alla dina kvitton och ladda upp för att fortsätta
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6 pb-8">
          {/* Error Alert */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* File Upload Component */}
          <ReceiptUpload
            onUpload={onFileUpload}
            isProcessing={isProcessing}
            uploadedFiles={uploadedFiles}
            onRemoveFile={onRemoveFile}
          />

          {/* Alternative Option */}
          <div className="text-center pt-4">
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground underline text-sm"
            >
              Fortsätt utan att registrera utlägg
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
