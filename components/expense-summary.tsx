"use client"

import type { Receipt } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react"

interface ExpenseSummaryProps {
  receipts: Receipt[]
  onSubmit: () => void
}

export function ExpenseSummary({ receipts, onSubmit }: ExpenseSummaryProps) {
  const approvedReceipts = receipts.filter((r) => r.sj_approval.is_reimbursable)
  const rejectedReceipts = receipts.filter((r) => !r.sj_approval.is_reimbursable)

  const totalCost = receipts.reduce((sum, receipt) => sum + receipt.amount, 0)
  const approvedAmount = approvedReceipts.reduce((sum, receipt) => sum + receipt.amount, 0)
  const rejectedAmount = rejectedReceipts.reduce((sum, receipt) => sum + receipt.amount, 0)

  const approvedCategoryTotals = approvedReceipts.reduce(
    (acc, receipt) => {
      const sjCategory = receipt.sj_approval.category_mapped
      acc[sjCategory] = (acc[sjCategory] || 0) + receipt.amount
      return acc
    },
    {} as Record<string, number>,
  )

  const rejectedCategoryTotals = rejectedReceipts.reduce(
    (acc, receipt) => {
      const sjCategory = receipt.sj_approval.category_mapped
      acc[sjCategory] = (acc[sjCategory] || 0) + receipt.amount
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Godkända utlägg för ersättning
          </CardTitle>
          <p className="text-sm text-muted-foreground">Följande utlägg kommer att skickas till SJ för ersättning</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(approvedCategoryTotals).map(([category, amount]) => (
            <div key={category} className="flex justify-between">
              <span>{category}</span>
              <span className="font-medium">{amount} SEK</span>
            </div>
          ))}

          {Object.keys(approvedCategoryTotals).length === 0 && (
            <p className="text-muted-foreground text-center py-4">Inga godkända utlägg att visa</p>
          )}

          <Separator />

          <div className="flex justify-between font-semibold text-lg">
            <span>Total ersättning:</span>
            <span className="text-green-600">{approvedAmount} SEK</span>
          </div>
        </CardContent>
      </Card>

      {rejectedReceipts.length > 0 && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Ej godkända utlägg
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Dessa utlägg är inte ersättningsberättigade enligt SJ:s regler
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(rejectedCategoryTotals).map(([category, amount]) => (
              <div key={category} className="flex justify-between text-red-600 dark:text-red-400">
                <span>{category}</span>
                <span>{amount} SEK</span>
              </div>
            ))}

            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                Endast måltider, boende vid förseningar och alternativ transport är ersättningsberättigade. Alkohol och
                tobak är aldrig godkända för ersättning.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Totalt utlägg:</span>
              <span>{totalCost} SEK</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Ej godkänt:</span>
              <span className="text-red-600">-{rejectedAmount} SEK</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Skickas för ersättning:</span>
              <span className="text-green-600">{approvedAmount} SEK</span>
            </div>

            <Button onClick={onSubmit} className="w-full" size="lg" disabled={approvedReceipts.length === 0}>
              {approvedReceipts.length === 0
                ? "Inga godkända utlägg att skicka"
                : `Skicka in ${approvedReceipts.length} kvitto${approvedReceipts.length > 1 ? "n" : ""}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
