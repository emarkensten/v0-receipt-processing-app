"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ReceiptCard } from "@/components/receipt-card"
import { FullscreenReceiptModal } from "@/components/fullscreen-receipt-modal"
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Receipt as ReceiptIcon,
  Banknote
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Receipt } from "@/lib/types"

interface ReviewPageProps {
  receipts: Receipt[]
  onItemToggle: (receiptId: string, itemId: string, selected: boolean) => void
  onAddMore: () => void
  onContinue: () => void
  onBack: () => void
}

export function ReviewPage({
  receipts,
  onItemToggle,
  onAddMore,
  onContinue,
  onBack
}: ReviewPageProps) {
  const [fullscreenReceipt, setFullscreenReceipt] = useState<Receipt | null>(null)

  // Calculate total reimbursement from selected items
  const totalReimbursement = receipts.reduce((total, receipt) => {
    const receiptTotal = receipt.items
      .filter(item => item.selected)
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
    return total + receiptTotal
  }, 0)

  const totalExpenses = receipts.reduce((total, receipt) => total + receipt.amount, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-10 w-10 -ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-semibold text-foreground">Granska kvitton</h1>
              <p className="text-xs text-muted-foreground">
                Välj vilka artiklar du vill få ersättning för
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-40">
        {/* Receipt cards */}
        <div className="space-y-4">
          {receipts.map((receipt) => (
            <ReceiptCard
              key={receipt.id}
              receipt={receipt}
              onItemToggle={onItemToggle}
              onImageClick={() => setFullscreenReceipt(receipt)}
            />
          ))}
        </div>

        {/* Add more button */}
        <Button
          variant="outline"
          className="w-full mt-4 min-h-[52px] border-dashed"
          onClick={onAddMore}
        >
          <Plus className="h-5 w-5 mr-2" />
          Lägg till fler kvitton
        </Button>
      </main>

      {/* Fixed bottom summary */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4 safe-area-inset-bottom">
          {/* Summary stats */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ReceiptIcon className="h-4 w-4" />
                <span>{receipts.length} kvitton</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Banknote className="h-4 w-4" />
                <span>Utlägg: {formatCurrency(totalExpenses)}</span>
              </div>
            </div>
          </div>

          {/* Total and continue */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Total ersättning</p>
              <p className="text-2xl font-bold text-primary tabular-nums">
                {formatCurrency(totalReimbursement)}
              </p>
            </div>
            <Button
              size="lg"
              className="min-h-[52px] px-8"
              onClick={onContinue}
              disabled={totalReimbursement === 0}
            >
              Fortsätt
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Fullscreen modal for receipt images */}
      {fullscreenReceipt && (
        <FullscreenReceiptModal
          file={null}
          imageUrl={fullscreenReceipt.image_url}
          isOpen={!!fullscreenReceipt}
          onClose={() => setFullscreenReceipt(null)}
          receiptName={fullscreenReceipt.name}
        />
      )}
    </div>
  )
}
