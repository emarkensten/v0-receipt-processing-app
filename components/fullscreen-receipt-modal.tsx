"use client"

import { Button } from "@/components/ui/button"
import { X, ZoomIn, ZoomOut, FileText, RotateCcw } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"

interface FullscreenReceiptModalProps {
  file?: File | null
  imageUrl?: string | null
  isOpen: boolean
  onClose: () => void
  receiptName?: string
}

export function FullscreenReceiptModal({
  file,
  imageUrl,
  isOpen,
  onClose,
  receiptName = "Kvitto",
}: FullscreenReceiptModalProps) {
  const [zoom, setZoom] = useState(1)

  // Reset zoom when modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1)
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  const handleZoomIn = useCallback(() => setZoom((prev) => Math.min(prev + 0.25, 3)), [])
  const handleZoomOut = useCallback(() => setZoom((prev) => Math.max(prev - 0.25, 0.5)), [])
  const handleResetZoom = useCallback(() => setZoom(1), [])

  // Determine the image source
  const imageSrc = imageUrl || (file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null)
  const isImage = !!imageSrc || (file && file.type.startsWith("image/"))
  const isPdf = file && file.type === "application/pdf"

  if (!isOpen || (!file && !imageUrl)) return null

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] safe-area-inset-top safe-area-inset-bottom"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Controls - mobile optimized */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between z-10 p-3 md:p-4 bg-gradient-to-b from-black/60 to-transparent safe-area-inset-top">
        <h2
          id="modal-title"
          className="text-white font-medium text-sm md:text-base truncate max-w-[50%]"
        >
          {receiptName}
        </h2>
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Zoom controls - hide on very small screens */}
          <div className="hidden xs:flex items-center gap-1">
            <Button
              variant="secondary"
              size="icon"
              onClick={handleZoomOut}
              className="h-9 w-9 md:h-8 md:w-8 bg-white/20 hover:bg-white/30 text-white border-white/20"
              aria-label="Zooma ut"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <button
              onClick={handleResetZoom}
              className="text-white text-xs md:text-sm min-w-[2.5rem] text-center hover:bg-white/10 rounded px-1 py-0.5 transition-colors"
              aria-label="Aterstall zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <Button
              variant="secondary"
              size="icon"
              onClick={handleZoomIn}
              className="h-9 w-9 md:h-8 md:w-8 bg-white/20 hover:bg-white/30 text-white border-white/20"
              aria-label="Zooma in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Reset button - mobile only */}
          <Button
            variant="secondary"
            size="icon"
            onClick={handleResetZoom}
            className="xs:hidden h-9 w-9 bg-white/20 hover:bg-white/30 text-white border-white/20"
            aria-label="Aterstall zoom"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          {/* Close button */}
          <Button
            variant="secondary"
            size="icon"
            onClick={onClose}
            className="h-9 w-9 md:h-8 md:w-8 bg-white/20 hover:bg-white/30 text-white border-white/20"
            aria-label="Stang"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content - touch-friendly with gesture support */}
      <div
        className="w-full h-full flex items-center justify-center p-4 pt-16 pb-8 md:p-16 overflow-auto"
        onClick={(e) => {
          // Double-tap to zoom on mobile
          if ((e.detail === 2 || e.type === "dblclick") && isImage) {
            setZoom((prev) => (prev === 1 ? 2 : 1))
          }
        }}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={receiptName}
            className={cn(
              "max-w-full max-h-full object-contain transition-transform duration-200",
              "select-none touch-manipulation"
            )}
            style={{ transform: `scale(${zoom})` }}
            draggable={false}
          />
        ) : isPdf && file ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 md:p-8 text-center max-w-sm mx-auto">
            <div className="mb-4 flex justify-center">
              <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                <FileText className="h-10 w-10 md:h-12 md:w-12 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              PDF-fil
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm truncate">{file.name}</p>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-500">
              PDF-forhandsvisning ar inte tillganglig.
              <br />
              Filen har bearbetats med OCR for dataextrahering.
            </p>
          </div>
        ) : null}
      </div>

      {/* Bottom hint - mobile */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-white/50 text-xs md:hidden safe-area-inset-bottom">
        Dubbelklicka for att zooma
      </div>

      {/* Click outside overlay */}
      <div className="absolute inset-0 -z-10" onClick={onClose} aria-hidden="true" />
    </div>
  )
}
