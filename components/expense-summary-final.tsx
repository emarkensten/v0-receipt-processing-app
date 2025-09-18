"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { type Receipt } from "@/lib/types"
import { ArrowLeft, Settings } from "lucide-react"
import { useReimbursementRules } from "@/lib/hooks/use-reimbursement-rules"
import { ReimbursementInfo } from "@/components/reimbursement-info"
import { ReimbursementSettingsModal } from "@/components/reimbursement-settings-modal"

interface ExpenseSummaryFinalProps {
  receipts: Receipt[]
  onSubmit: () => void
  onBack: () => void
}

export function ExpenseSummaryFinal({ receipts, onSubmit, onBack }: ExpenseSummaryFinalProps) {
  const { calculateSummary } = useReimbursementRules()
  const summary = calculateSummary(receipts)
  
  const formatCurrency = (amount: number) => `${Math.round(amount)} SEK`

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          {/* Navigation and Settings */}
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Tillbaka
            </Button>

            {/* Discrete Settings Icon */}
            <ReimbursementSettingsModal>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-60 hover:opacity-100 transition-opacity"
                title="Regelsimulering"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </ReimbursementSettingsModal>
          </div>
          
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Förväntad utbetalning
            </h1>
            <p className="text-muted-foreground">
              &quot;Förutsatt att all information stämmer kommer vi betala ut följande&quot;
            </p>
          </div>
        </div>

        {/* Reimbursement Information */}
        <ReimbursementInfo summary={summary} showDetails={true} />

        {/* Receipt List with Reimbursements */}
        <div className="space-y-4">
          {receipts.map((receipt, index) => {
            const calculation = summary.calculations[index]
            
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
                        {formatCurrency(calculation.reimbursedAmount)} (Enligt regelverk)
                      </div>
                    </div>
                  </div>
                  
                  {/* Show exclusions if any */}
                  {calculation.exclusions.length > 0 && (
                    <div className="mt-2 text-sm text-destructive space-y-1">
                      {calculation.exclusions.map((exclusion, i) => (
                        <div key={i}>&quot;{exclusion}&quot;</div>
                      ))}
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
                <span className="text-lg font-semibold text-foreground">{formatCurrency(summary.totalExpenses)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-primary">Ersättning:</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(summary.totalReimbursement)}</span>
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