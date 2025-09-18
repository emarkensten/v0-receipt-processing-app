"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type Receipt } from "@/lib/types"
import { FullscreenReceiptModal } from "@/components/fullscreen-receipt-modal"

interface ReceiptOverviewProps {
  receipts: Receipt[]
  uploadedFiles: File[]
  onEditReceipt: (receipt: Receipt) => void
  onShowAllData: () => void
  onSave: () => void
}

export function ReceiptOverview({ 
  receipts, 
  uploadedFiles,
  onEditReceipt, 
  onShowAllData, 
  onSave 
}: ReceiptOverviewProps) {
  const [fullscreenFile, setFullscreenFile] = useState<File | null>(null)
  const [fullscreenReceiptName, setFullscreenReceiptName] = useState("")
  
  const formatCurrency = (amount: number) => `${amount} SEK`
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Mat": return "bg-blue-100 text-blue-800"
      case "Boende": return "bg-purple-100 text-purple-800"
      case "Transport": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Lägg till egna utlägg
          </h1>
          <p className="text-muted-foreground mt-2">
            Dina uppladdade bilder:
          </p>
        </div>

        {/* Receipt List */}
        <div className="space-y-4">
          {receipts.map((receipt, index) => (
            <Card key={receipt.id || index}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Receipt image */}
                    <button
                      onClick={() => {
                        if (uploadedFiles[index]) {
                          setFullscreenFile(uploadedFiles[index])
                          setFullscreenReceiptName(receipt.name)
                        }
                      }}
                      className="w-12 h-12 bg-muted rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                    >
                      {uploadedFiles[index] ? (
                        uploadedFiles[index].type.startsWith("image/") ? (
                          <img
                            src={URL.createObjectURL(uploadedFiles[index])}
                            alt={`Kvitto ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-destructive/10">
                            <span className="text-xs text-destructive">PDF</span>
                          </div>
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">📄</span>
                        </div>
                      )}
                    </button>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">
                          Kvitto {index + 1}
                        </span>
                        <Badge className={getCategoryColor(receipt.category)}>
                          {receipt.category}
                        </Badge>
                      </div>
                      <div className="font-semibold text-lg text-foreground">
                        {receipt.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Kostnad: {formatCurrency(receipt.amount)}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditReceipt(receipt)}
                  >
                    Ändra
                  </Button>
                </div>

                {/* Items list if available */}
                {receipt.sj_approval && (
                  <div className="mt-3 text-sm">
                    {receipt.sj_approval.contains_alcohol && (
                      <div className="text-destructive font-medium">
                        "Alkohol ersätts inte"
                      </div>
                    )}
                    {receipt.sj_approval.contains_tobacco && (
                      <div className="text-destructive font-medium">
                        "Tobak ersätts inte"
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <div className="text-center">
            <button
              onClick={onShowAllData}
              className="text-primary hover:text-primary/80 underline text-sm"
            >
              Visa all data som hämtats från bilderna
            </button>
          </div>

          <Button 
            onClick={onSave}
            className="w-full"
            size="lg"
          >
            Spara
          </Button>
        </div>
      </div>

      {/* Fullscreen Receipt Modal */}
      <FullscreenReceiptModal
        file={fullscreenFile}
        isOpen={!!fullscreenFile}
        onClose={() => setFullscreenFile(null)}
        receiptName={fullscreenReceiptName}
      />
    </div>
  )
}
