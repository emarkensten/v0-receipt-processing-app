"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { type Receipt } from "@/lib/types"

interface ExpenseSummaryFinalProps {
  receipts: Receipt[]
  onSubmit: () => void
}

export function ExpenseSummaryFinal({ receipts, onSubmit }: ExpenseSummaryFinalProps) {
  const calculateReimbursement = (receipt: Receipt) => {
    // SJ's reimbursement rules based on the logic we had before
    let reimbursableAmount = receipt.amount
    
    // Exclude alcohol/tobacco
    if (receipt.sj_approval?.contains_alcohol || receipt.sj_approval?.contains_tobacco) {
      // Simplified: reduce by 25% if alcohol/tobacco detected
      reimbursableAmount = receipt.amount * 0.75
    }
    
    // Category-specific limits (based on your mockup examples)
    switch (receipt.category) {
      case "Mat":
        // Max reimbursement example from mockup
        return Math.min(reimbursableAmount, receipt.amount * 0.75)
      case "Boende":
        // Full reimbursement for accommodation
        return reimbursableAmount
      case "Transport":
        // Full reimbursement for transport
        return reimbursableAmount
      default:
        return 0
    }
  }
  
  const formatCurrency = (amount: number) => `${Math.round(amount)} SEK`
  
  const totalExpenses = receipts.reduce((sum, receipt) => sum + receipt.amount, 0)
  const totalReimbursement = receipts.reduce((sum, receipt) => sum + calculateReimbursement(receipt), 0)

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Förväntad utbetalning
          </h1>
          <p className="text-muted-foreground">
            "Förutsatt att all information stämmer kommer vi betala ut följande"
          </p>
        </div>

        {/* Receipt List with Reimbursements */}
        <div className="space-y-4">
          {receipts.map((receipt, index) => {
            const reimbursement = calculateReimbursement(receipt)
            const hasAlcohol = receipt.sj_approval?.contains_alcohol
            const hasTobacco = receipt.sj_approval?.contains_tobacco
            
            return (
              <Card key={receipt.id || index}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-lg text-foreground mb-1">
                        {receipt.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Kostnad: {formatCurrency(receipt.amount)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Ersättning:</div>
                      <div className="font-semibold text-lg text-primary">
                        {formatCurrency(reimbursement)} (Enligt regelverk)
                      </div>
                    </div>
                  </div>
                  
                  {/* Alcohol/Tobacco exclusions */}
                  {(hasAlcohol || hasTobacco) && (
                    <div className="mt-2 text-sm text-destructive">
                      {hasAlcohol && '"Alkohol ersätts inte"'}
                      {hasTobacco && '"Tobak ersätts inte"'}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Total Summary */}
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-foreground">Totalt utlägg:</span>
                <span className="text-lg font-semibold text-foreground">{formatCurrency(totalExpenses)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-primary">Ersättning:</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(totalReimbursement)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button 
          onClick={onSubmit}
          className="w-full"
          size="lg"
        >
          Skicka in
        </Button>
      </div>
    </div>
  )
}
