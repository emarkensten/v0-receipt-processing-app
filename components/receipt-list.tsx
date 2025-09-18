"use client"

import type { Receipt } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { format } from "date-fns"
import { sv } from "date-fns/locale"

interface ReceiptListProps {
  receipts: Receipt[]
  onEdit: (receipt: Receipt) => void
  onDelete: (id: string) => void
}

const categoryColors = {
  Mat: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Transport: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Boende: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Övrigt: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
}

const getApprovalIcon = (status: string) => {
  switch (status) {
    case "approved":
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case "rejected":
      return <XCircle className="h-4 w-4 text-red-600" />
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    default:
      return null
  }
}

const getApprovalBadge = (status: string) => {
  switch (status) {
    case "approved":
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Godkänd</Badge>
    case "rejected":
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Ej godkänd</Badge>
    case "warning":
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Varning</Badge>
    default:
      return null
  }
}

export function ReceiptList({ receipts, onEdit, onDelete }: ReceiptListProps) {
  const approvedReceipts = receipts.filter((r) => r.sj_approval.is_reimbursable)
  const rejectedReceipts = receipts.filter((r) => !r.sj_approval.is_reimbursable)

  const totalAmount = receipts.reduce((sum, receipt) => sum + receipt.amount, 0)
  const approvedAmount = approvedReceipts.reduce((sum, receipt) => sum + receipt.amount, 0)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Dina uppladdade bilder:</h2>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Totalt belopp</p>
          <p className="text-lg font-semibold">{totalAmount} SEK</p>
          <p className="text-sm text-green-600 font-medium">Godkänt: {approvedAmount} SEK</p>
        </div>
      </div>

      {receipts.map((receipt) => (
        <Card
          key={receipt.id}
          className={receipt.sj_approval.status === "rejected" ? "border-red-200 dark:border-red-800" : ""}
        >
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                {getApprovalIcon(receipt.sj_approval.status)}
                <div>
                  <CardTitle className="text-base">{receipt.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Kostnad: {receipt.amount} {receipt.currency}
                  </p>
                  <p className="text-xs text-muted-foreground">SJ-kategori: {receipt.sj_approval.category_mapped}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1 items-end">
                <Badge className={categoryColors[receipt.category]}>{receipt.category}</Badge>
                {getApprovalBadge(receipt.sj_approval.status)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Datum:</span>{" "}
                {format(new Date(receipt.date), "dd MMMM yyyy", { locale: sv })}
              </p>
              {receipt.metadata.register_number && (
                <p>
                  <span className="font-medium">Kvittonummer:</span> {receipt.metadata.register_number}
                </p>
              )}
              {receipt.tax_amount && (
                <p>
                  <span className="font-medium">Moms:</span> {receipt.tax_amount} {receipt.currency}
                </p>
              )}

              {receipt.sj_approval.reason && (
                <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    {receipt.sj_approval.reason}
                  </p>
                </div>
              )}

              {(receipt.sj_approval.contains_alcohol || receipt.sj_approval.contains_tobacco) && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <XCircle className="h-4 w-4 inline mr-1" />
                    {receipt.sj_approval.contains_alcohol && "Innehåller alkohol. "}
                    {receipt.sj_approval.contains_tobacco && "Innehåller tobak. "}
                    Ej ersättningsberättigad enligt SJ:s regler.
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => onEdit(receipt)}>
                <Edit className="h-4 w-4 mr-1" />
                Ändra
              </Button>
              <Button variant="outline" size="sm" onClick={() => onDelete(receipt.id)}>
                <Trash2 className="h-4 w-4 mr-1" />
                Ta bort
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
