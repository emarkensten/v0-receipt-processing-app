"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, ImageIcon, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { FullscreenReceiptModal } from "@/components/fullscreen-receipt-modal"

interface ReceiptUploadProps {
  onUpload: (files: File[]) => void
  isProcessing?: boolean
  uploadedFiles: File[]
  onRemoveFile: (index: number) => void
}

export function ReceiptUpload({ onUpload, isProcessing, uploadedFiles, onRemoveFile }: ReceiptUploadProps) {
  const [fullscreenFile, setFullscreenFile] = useState<File | null>(null)
  
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onUpload(acceptedFiles)
    },
    [onUpload],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "application/pdf": [".pdf"],
    },
    multiple: true,
    disabled: isProcessing,
  })

  return (
    <div className="space-y-4">
      <Card
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-border",
          isProcessing && "opacity-50 cursor-not-allowed",
        )}
      >
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <input {...getInputProps()} />
          {isProcessing ? (
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          ) : (
            <Upload className="h-12 w-12 text-primary mb-4" />
          )}
          <h3 className="text-lg font-semibold text-foreground mb-2">{isProcessing ? "Bearbetar kvitton..." : "Ladda upp bilder"}</h3>
          <p className="text-muted-foreground mb-4">
            {isProcessing
              ? "AI:n läser dina kvitton och extraherar information"
              : "Ladda upp bilder (PNG, JPG, JPEG) eller PDF-filer av dina kvitton för att fortsätta"}
          </p>
          {!isProcessing && (
            <Button variant="outline" size="sm">
              Välj filer eller dra och släpp
            </Button>
          )}
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {uploadedFiles.map((file, index) => (
            <Card key={index} className="relative">
              <CardContent className="p-4 relative">
                <button
                  onClick={() => setFullscreenFile(file)}
                  className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-2 w-full overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                >
                  {file.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-2xl mb-1">📄</div>
                      <div className="text-xs text-destructive font-medium">PDF</div>
                    </div>
                  )}
                </button>
                
                {/* Remove button - outside the clickable area */}
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 rounded-full p-0 z-10"
                  onClick={() => onRemoveFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
                
                <p className="text-xs text-muted-foreground truncate">{file.name}</p>
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
