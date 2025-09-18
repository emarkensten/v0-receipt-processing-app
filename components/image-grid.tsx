"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X } from "lucide-react"
import { FullscreenReceiptModal } from "@/components/fullscreen-receipt-modal"

interface ImageGridProps {
  uploadedFiles: File[]
  onRemoveFile: (index: number) => void
  onAddMoreFiles: () => void
  onProcessFiles: () => void
  isProcessing?: boolean
  processingProgress?: { current: number; total: number; currentFile: string }
}

export function ImageGrid({ 
  uploadedFiles, 
  onRemoveFile, 
  onAddMoreFiles, 
  onProcessFiles,
  isProcessing = false,
  processingProgress = { current: 0, total: 0, currentFile: "" }
}: ImageGridProps) {
  const [fullscreenFile, setFullscreenFile] = useState<File | null>(null)
  
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Lägg till egna utlägg
          </h1>
          <p className="text-muted-foreground">
            Dina uppladdade bilder:
          </p>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-2 gap-4">
          {uploadedFiles.map((file, index) => (
            <Card key={index} className="relative aspect-square">
              <CardContent className="p-2 h-full relative">
                <button
                  onClick={() => setFullscreenFile(file)}
                  className="h-full w-full bg-muted rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                >
                  {file.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-destructive/10">
                      <div className="text-2xl mb-1">📄</div>
                      <div className="text-xs text-destructive font-medium">PDF</div>
                      <div className="text-xs text-muted-foreground mt-1 truncate max-w-full px-2">
                        {file.name}
                      </div>
                    </div>
                  )}
                </button>
                
                {/* Remove button - outside the clickable area */}
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 z-10"
                  onClick={() => onRemoveFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Links and Buttons */}
        <div className="space-y-4">
          <div className="text-center">
            <button
              onClick={onAddMoreFiles}
              className="text-primary hover:text-primary/80 underline"
            >
              Ladda upp flera bilder
            </button>
          </div>

          <Button 
            onClick={onProcessFiles}
            disabled={uploadedFiles.length === 0 || isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? "Granskar bilder..." : "Granska bilder"}
          </Button>

          {/* Progress Bar */}
          {isProcessing && processingProgress.total > 0 && (
            <div className="space-y-2">
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
                />
              </div>
              <div className="text-center text-sm text-muted-foreground">
                Bearbetar {processingProgress.current} av {processingProgress.total} kvitton
                {processingProgress.currentFile && (
                  <div className="text-xs mt-1 truncate">
                    {processingProgress.currentFile}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Receipt Modal */}
      <FullscreenReceiptModal
        file={fullscreenFile}
        isOpen={!!fullscreenFile}
        onClose={() => setFullscreenFile(null)}
        receiptName={fullscreenFile?.name || "Kvitto"}
      />
    </div>
  )
}
