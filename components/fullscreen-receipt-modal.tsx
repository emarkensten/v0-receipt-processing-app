"use client"

import { Button } from "@/components/ui/button"
import { X, ZoomIn, ZoomOut } from "lucide-react"
import { useState } from "react"

interface FullscreenReceiptModalProps {
  file: File | null
  isOpen: boolean
  onClose: () => void
  receiptName?: string
}

export function FullscreenReceiptModal({ 
  file, 
  isOpen, 
  onClose, 
  receiptName = "Kvitto" 
}: FullscreenReceiptModalProps) {
  const [zoom, setZoom] = useState(1)

  if (!isOpen || !file) return null

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5))

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100]">
      {/* Controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <h2 className="text-white font-medium">{receiptName}</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleZoomOut}
            className="bg-white/20 hover:bg-white/30 text-white border-white/20"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-white text-sm min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleZoomIn}
            className="bg-white/20 hover:bg-white/30 text-white border-white/20"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 text-white border-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="w-full h-full flex items-center justify-center p-16">
        {file.type.startsWith("image/") ? (
          <img
            src={URL.createObjectURL(file)}
            alt={receiptName}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
          />
        ) : (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">PDF-fil</h3>
            <p className="text-gray-600 mb-4">{file.name}</p>
            <p className="text-sm text-gray-500">
              PDF-förhandsvisning är inte tillgänglig.
              <br />
              Filen har bearbetats med OCR för dataextrahering.
            </p>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      <div 
        className="absolute inset-0 -z-10" 
        onClick={onClose}
      />
    </div>
  )
}
