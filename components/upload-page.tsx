"use client"

import { useCallback, useState, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Upload,
  FileText,
  Camera,
  CloudUpload,
  Check,
  Loader2,
  X,
  ArrowRight,
  Receipt
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Receipt as ReceiptType } from "@/lib/types"

type FileStatus = "waiting" | "preprocessing" | "processing" | "done" | "error"

interface FileWithStatus {
  file: File
  status: FileStatus
  error?: string
  receipt?: ReceiptType
  previewUrl?: string
}

interface UploadPageProps {
  onFilesProcessed: (receipts: ReceiptType[]) => void
}

export function UploadPage({ onFilesProcessed }: UploadPageProps) {
  const [files, setFiles] = useState<FileWithStatus[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach(f => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl)
      })
    }
  }, [])

  const processFile = async (fileWithStatus: FileWithStatus, index: number) => {
    // Update status to preprocessing
    setFiles(prev => prev.map((f, i) =>
      i === index ? { ...f, status: "preprocessing" } : f
    ))

    try {
      // Preprocess the file (convert HEIC, compress)
      let processedFile = fileWithStatus.file
      try {
        const { defaultImagePreprocessor } = await import("@/lib/utils/image-preprocessor")
        const [processedResult] = await defaultImagePreprocessor.processFiles([fileWithStatus.file])
        processedFile = processedResult.file
      } catch (preprocessError) {
        console.warn("[UploadPage] Preprocessing failed, using original file:", preprocessError)
        // Continue with original file
      }

      // Update status to processing (AI extraction)
      setFiles(prev => prev.map((f, i) =>
        i === index ? { ...f, status: "processing" } : f
      ))

      // Convert to base64 for API
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(processedFile)
      })

      // Call API to process receipt
      const response = await fetch("/api/process-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentUrl: dataUrl }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const receiptData = await response.json()

      // Create preview URL for the processed file
      const previewUrl = URL.createObjectURL(processedFile)

      // Update with result
      setFiles(prev => prev.map((f, i) =>
        i === index ? {
          ...f,
          status: "done",
          receipt: { ...receiptData, image_url: previewUrl },
          previewUrl
        } : f
      ))

      return { ...receiptData, image_url: previewUrl }
    } catch (error) {
      console.error(`[UploadPage] Error processing file:`, error)
      setFiles(prev => prev.map((f, i) =>
        i === index ? {
          ...f,
          status: "error",
          error: error instanceof Error ? error.message : "Processing failed"
        } : f
      ))
      return null
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    // Add files with waiting status
    const newFiles: FileWithStatus[] = acceptedFiles.map(file => ({
      file,
      status: "waiting" as FileStatus,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined
    }))

    setFiles(prev => [...prev, ...newFiles])
    setIsProcessing(true)

    // Process files sequentially
    const startIndex = files.length
    const results: (ReceiptType | null)[] = []

    for (let i = 0; i < newFiles.length; i++) {
      const result = await processFile(newFiles[i], startIndex + i)
      results.push(result)
    }

    setIsProcessing(false)
  }, [files.length])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".heic", ".heif"],
      "application/pdf": [".pdf"],
    },
    multiple: true,
    disabled: isProcessing,
    noClick: false,
    noKeyboard: false,
  })

  const removeFile = (index: number) => {
    setFiles(prev => {
      const file = prev[index]
      if (file.previewUrl) URL.revokeObjectURL(file.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  const completedReceipts = files
    .filter(f => f.status === "done" && f.receipt)
    .map(f => f.receipt!)

  const allDone = files.length > 0 && files.every(f => f.status === "done" || f.status === "error")
  const hasSuccessful = completedReceipts.length > 0

  const handleContinue = () => {
    if (hasSuccessful) {
      onFilesProcessed(completedReceipts)
    }
  }

  const getStatusIcon = (status: FileStatus) => {
    switch (status) {
      case "waiting":
        return <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
      case "preprocessing":
      case "processing":
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />
      case "done":
        return (
          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-3 w-3 text-primary-foreground" />
          </div>
        )
      case "error":
        return (
          <div className="h-5 w-5 rounded-full bg-destructive flex items-center justify-center">
            <X className="h-3 w-3 text-destructive-foreground" />
          </div>
        )
    }
  }

  const getStatusText = (status: FileStatus) => {
    switch (status) {
      case "waiting": return "Vantar..."
      case "preprocessing": return "Forbehandlar..."
      case "processing": return "Laser kvitto..."
      case "done": return "Klar"
      case "error": return "Fel"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">SJ Ersattning</h1>
              <p className="text-xs text-muted-foreground">Ladda upp dina kvitton</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Drop zone */}
        <Card
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed cursor-pointer transition-all duration-300 overflow-hidden",
            "hover:border-primary/50 hover:bg-primary/[0.02]",
            "active:scale-[0.995]",
            isDragActive && "border-primary bg-primary/5 scale-[1.01]",
            isProcessing && "pointer-events-none opacity-60"
          )}
        >
          {/* Decorative railway track pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
            <div className="absolute inset-0 flex flex-col justify-around">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-8">
                  <div className="h-px flex-1 bg-current" />
                  {[...Array(20)].map((_, j) => (
                    <div key={j} className="h-3 w-px bg-current" />
                  ))}
                  <div className="h-px flex-1 bg-current" />
                </div>
              ))}
            </div>
          </div>

          <CardContent className="relative flex flex-col items-center justify-center p-8 md:p-12 text-center min-h-[240px]">
            <input {...getInputProps()} />

            {/* Icon */}
            <div className="mb-4 relative">
              <div className={cn(
                "h-16 w-16 rounded-2xl flex items-center justify-center transition-all duration-300",
                isDragActive
                  ? "bg-primary text-primary-foreground scale-110"
                  : "bg-primary/10 text-primary"
              )}>
                {isDragActive ? (
                  <CloudUpload className="h-8 w-8 animate-bounce" />
                ) : (
                  <Upload className="h-8 w-8" />
                )}
              </div>
            </div>

            {/* Text */}
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {isDragActive ? "Slapp filerna har!" : "Ladda upp kvitton"}
            </h2>
            <p className="text-sm text-muted-foreground mb-5 max-w-xs">
              {isDragActive
                ? "Vi tar emot dina filer"
                : "Dra och slapp filer, eller klicka for att valja. PNG, JPG, HEIC, PDF."}
            </p>

            {/* Button */}
            {!isDragActive && (
              <Button
                variant="outline"
                size="lg"
                className="min-h-[48px] px-6 font-medium"
                onClick={(e) => {
                  e.stopPropagation()
                  open()
                }}
              >
                <Camera className="h-5 w-5 mr-2" />
                Valj filer
              </Button>
            )}
          </CardContent>
        </Card>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-medium text-foreground">
                Uppladdade kvitton
              </h3>
              <span className="text-xs text-muted-foreground">
                {completedReceipts.length} av {files.length} klara
              </span>
            </div>

            <div className="space-y-2">
              {files.map((fileWithStatus, index) => (
                <Card
                  key={index}
                  className={cn(
                    "transition-all duration-300",
                    fileWithStatus.status === "error" && "border-destructive/50 bg-destructive/5"
                  )}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    {/* Thumbnail */}
                    <div className="h-12 w-12 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                      {fileWithStatus.previewUrl ? (
                        <img
                          src={fileWithStatus.previewUrl}
                          alt={fileWithStatus.file.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {fileWithStatus.file.name}
                      </p>
                      <p className={cn(
                        "text-xs",
                        fileWithStatus.status === "error"
                          ? "text-destructive"
                          : "text-muted-foreground"
                      )}>
                        {fileWithStatus.status === "error"
                          ? fileWithStatus.error
                          : getStatusText(fileWithStatus.status)}
                      </p>
                    </div>

                    {/* Status indicator */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getStatusIcon(fileWithStatus.status)}

                      {/* Remove button - only show when not processing */}
                      {(fileWithStatus.status === "done" || fileWithStatus.status === "error") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Continue button */}
        {allDone && hasSuccessful && (
          <div className="pt-4">
            <Button
              size="lg"
              className="w-full min-h-[52px] text-base font-medium"
              onClick={handleContinue}
            >
              Fortsatt till granskning
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-3">
              {completedReceipts.length} kvitto{completedReceipts.length !== 1 ? "n" : ""} redo att granskas
            </p>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Bearbetar kvitton med AI...</span>
          </div>
        )}
      </main>
    </div>
  )
}
