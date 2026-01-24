"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Loader2, X, FileText, Zap, Camera, CloudUpload } from "lucide-react"
import { cn } from "@/lib/utils"
import { FullscreenReceiptModal } from "@/components/fullscreen-receipt-modal"
import type { ProcessedImage } from "@/lib/utils/image-preprocessor"

interface ReceiptUploadProps {
  onUpload: (files: File[]) => void
  isProcessing?: boolean
  uploadedFiles: File[]
  onRemoveFile: (index: number) => void
}

export function ReceiptUpload({ onUpload, isProcessing, uploadedFiles, onRemoveFile }: ReceiptUploadProps) {
  const [fullscreenFile, setFullscreenFile] = useState<File | null>(null)
  const [isPreprocessing, setIsPreprocessing] = useState(false)
  const [preprocessingStatus, setPreprocessingStatus] = useState<string>("")

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      setIsPreprocessing(true)
      setPreprocessingStatus("Forbehandlar bilder...")

      try {
        console.log(`[ReceiptUpload] Processing ${acceptedFiles.length} files`)

        // Dynamic import to avoid SSR issues
        const { defaultImagePreprocessor } = await import("@/lib/utils/image-preprocessor")
        const processedResults = await defaultImagePreprocessor.processFiles(acceptedFiles)
        const processedFiles = processedResults.map((result) => result.file)

        // Log processing results
        processedResults.forEach((result, index) => {
          const sizeDiff = result.originalSize - result.compressedSize
          const compressionRatio = ((sizeDiff / result.originalSize) * 100).toFixed(1)
          console.log(
            `[ReceiptUpload] File ${index + 1}: ${result.originalFormat} → ${result.finalFormat}, saved ${compressionRatio}%`
          )
        })

        setPreprocessingStatus(`Bearbetade ${processedFiles.length} filer`)
        onUpload(processedFiles)
      } catch (error) {
        console.error("[ReceiptUpload] Preprocessing failed:", error)
        // Fallback to original files if preprocessing fails
        onUpload(acceptedFiles)
      } finally {
        setIsPreprocessing(false)
        setTimeout(() => setPreprocessingStatus(""), 2000)
      }
    },
    [onUpload]
  )

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".heic", ".heif"],
      "application/pdf": [".pdf"],
    },
    multiple: true,
    disabled: isProcessing || isPreprocessing,
    noClick: false,
    noKeyboard: false,
  })

  return (
    <div className="space-y-3 md:space-y-4">
      <Card
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed cursor-pointer transition-all duration-200",
          "hover:border-primary/60 hover:bg-primary/5",
          "active:scale-[0.99]",
          isDragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-border",
          isProcessing && "opacity-50 cursor-not-allowed"
        )}
      >
        <CardContent className="flex flex-col items-center justify-center p-6 md:p-8 text-center min-h-[180px] md:min-h-[220px]">
          <input {...getInputProps()} />

          {/* Icon area */}
          <div className="mb-3 md:mb-4">
            {isProcessing ? (
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                <Loader2 className="h-10 w-10 md:h-12 md:w-12 text-primary animate-spin relative" />
              </div>
            ) : isPreprocessing ? (
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-pulse" />
                <Zap className="h-10 w-10 md:h-12 md:w-12 text-amber-600 relative" />
              </div>
            ) : isDragActive ? (
              <CloudUpload className="h-10 w-10 md:h-12 md:w-12 text-primary animate-bounce" />
            ) : (
              <Upload className="h-10 w-10 md:h-12 md:w-12 text-primary" />
            )}
          </div>

          {/* Title */}
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-1.5 md:mb-2">
            {isProcessing
              ? "Bearbetar kvitton..."
              : isPreprocessing
                ? "Forbehandlar bilder..."
                : isDragActive
                  ? "Slapp filerna har!"
                  : "Ladda upp kvitton"}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-3 md:mb-4 max-w-xs">
            {isProcessing
              ? "AI:n laser dina kvitton och extraherar information"
              : isPreprocessing
                ? preprocessingStatus || "Konverterar HEIC-filer och optimerar bildstorlek"
                : "PNG, JPG, HEIC eller PDF-filer av dina kvitton"}
          </p>

          {/* Buttons - optimized for touch */}
          {!isProcessing && !isPreprocessing && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="default"
                className="min-h-[44px] px-4 text-sm font-medium"
                onClick={(e) => {
                  e.stopPropagation()
                  open()
                }}
              >
                <Camera className="h-4 w-4 mr-2" />
                Valj filer
              </Button>
              <Button
                variant="ghost"
                size="default"
                className="min-h-[44px] px-4 text-sm text-muted-foreground sm:hidden"
                onClick={(e) => {
                  e.stopPropagation()
                  open()
                }}
              >
                eller dra och slapp
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File grid - optimized for mobile */}
      {uploadedFiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
          {uploadedFiles.map((file, index) => (
            <Card key={index} className="relative group overflow-hidden">
              <CardContent className="p-2 md:p-3">
                {/* Image/File preview button */}
                <button
                  onClick={() => setFullscreenFile(file)}
                  className={cn(
                    "aspect-square bg-muted rounded-lg flex items-center justify-center w-full overflow-hidden",
                    "transition-all duration-200",
                    "hover:ring-2 hover:ring-primary",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    "active:scale-95"
                  )}
                  aria-label={`Visa ${file.name}`}
                >
                  {file.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-2">
                      <FileText className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground mb-1" />
                      <span className="text-xs font-medium text-destructive">PDF</span>
                    </div>
                  )}
                </button>

                {/* Remove button - always visible on mobile, hover on desktop */}
                <Button
                  variant="destructive"
                  size="icon"
                  className={cn(
                    "absolute top-1 right-1 h-7 w-7 md:h-6 md:w-6 rounded-full",
                    "shadow-md",
                    "md:opacity-0 md:group-hover:opacity-100",
                    "transition-opacity duration-200"
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveFile(index)
                  }}
                  aria-label={`Ta bort ${file.name}`}
                >
                  <X className="h-4 w-4 md:h-3 md:w-3" />
                </Button>

                {/* Filename */}
                <p className="text-xs text-muted-foreground truncate mt-1.5 px-0.5">{file.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
