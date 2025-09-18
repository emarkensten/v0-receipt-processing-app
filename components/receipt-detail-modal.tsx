"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type Receipt } from "@/lib/types"
import { X } from "lucide-react"

interface ReceiptDetailModalProps {
  receipts: Receipt[]
  uploadedFiles: File[]
  isOpen: boolean
  onClose: () => void
}

export function ReceiptDetailModal({ receipts, uploadedFiles, isOpen, onClose }: ReceiptDetailModalProps) {
  const [selectedReceiptIndex, setSelectedReceiptIndex] = useState(0)

  if (!isOpen || receipts.length === 0) return null

  const selectedReceipt = receipts[selectedReceiptIndex]
  const formatCurrency = (amount: number) => `${amount} SEK`
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('sv-SE', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
      <Card className="w-full max-w-md md:max-w-2xl rounded-t-2xl md:rounded-2xl rounded-b-none md:rounded-b-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">All data vi hämtat</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 pb-8">
          {/* Receipt Selector */}
            <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Välj kvitto</label>
            <Select 
              value={selectedReceiptIndex.toString()} 
              onValueChange={(value) => setSelectedReceiptIndex(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {receipts.map((receipt, index) => (
                  <SelectItem key={receipt.id || index} value={index.toString()}>
                    Kvitto {index + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Receipt Details */}
          <div className="space-y-4">
            {/* Image */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Insamlade uppgifter</h3>
              <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden">
                {uploadedFiles[selectedReceiptIndex] ? (
                  uploadedFiles[selectedReceiptIndex].type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(uploadedFiles[selectedReceiptIndex])}
                      alt={`Kvitto ${selectedReceiptIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-destructive/10">
                      <div className="text-sm">📄</div>
                      <div className="text-xs text-destructive">PDF</div>
                    </div>
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-lg text-muted-foreground">📄</span>
                  </div>
                )}
              </div>
            </div>

            {/* Category */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Kategori</h3>
              <p className="text-foreground">{selectedReceipt.category}</p>
            </div>

            {/* Store Name */}
            <div>
                  <h3 className="text-sm font-medium text-muted-foreground">&quot;Kostnadsställe&quot;</h3>
              <p className="text-foreground">{selectedReceipt.name}</p>
            </div>

            {/* Date */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Datum</h3>
              <p className="text-foreground">{formatDate(selectedReceipt.date)}</p>
            </div>

            {/* Amount */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Kostnad</h3>
              <p className="text-foreground">{formatCurrency(selectedReceipt.amount)}</p>
            </div>

            {/* Receipt Number */}
            {selectedReceipt.metadata?.register_number && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Kvittonummer</h3>
                <p className="text-foreground">{selectedReceipt.metadata.register_number}</p>
              </div>
            )}

            {/* Items - if available from AI processing */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Produkter</h3>
              <div className="text-foreground">
                {/* Simulated items based on store type */}
                {selectedReceipt.name.toLowerCase().includes('mcdonald') && (
                  <>
                    <p>Big Mac meny, 89 SEK</p>
                    <p>Chili Cheese, 23</p>
                  </>
                )}
                {selectedReceipt.name.toLowerCase().includes('oleary') && (
                  <>
                    <p>Ceasarsallad Kyckling, 199 SEK</p>
                    <p>Husets röda 20 cl, 90 SEK</p>
                  </>
                )}
                {selectedReceipt.name.toLowerCase().includes('scandic') && (
                  <p>Enkelrum 1 natt vardag, {formatCurrency(selectedReceipt.amount)}</p>
                )}
                {!selectedReceipt.name.toLowerCase().match(/(mcdonald|oleary|scandic)/) && (
                  <p>Detaljerad produktlista ej tillgänglig</p>
                )}
              </div>
            </div>

            {/* Alcohol/Tobacco */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Alkohol eller Tobak</h3>
              <p className="text-foreground">
                {selectedReceipt.sj_approval?.contains_alcohol || selectedReceipt.sj_approval?.contains_tobacco ? "Ja" : "Nej"}
              </p>
            </div>
          </div>

          {/* Close Button */}
          <Button onClick={onClose} variant="secondary" className="w-full" size="lg">
            Stäng
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
