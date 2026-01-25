"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Store,
  Calendar,
  ImageIcon,
  Wine,
  Cigarette
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Receipt, ReceiptItem } from "@/lib/types"

interface ReceiptCardProps {
  receipt: Receipt
  onItemToggle: (receiptId: string, itemId: string, selected: boolean) => void
  onImageClick?: () => void
}

export function ReceiptCard({ receipt, onItemToggle, onImageClick }: ReceiptCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const selectedItems = receipt.items.filter(item => item.selected)
  const selectedTotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const hasWarnings = receipt.items.some(item => item.isAlcohol || item.isTobacco)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: receipt.currency || "SEK",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat("sv-SE", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date)
    } catch {
      return dateString
    }
  }

  const getItemIcon = (item: ReceiptItem) => {
    if (item.isAlcohol) return <Wine className="h-4 w-4 text-amber-500" />
    if (item.isTobacco) return <Cigarette className="h-4 w-4 text-amber-500" />
    return null
  }

  const getCategoryBadgeColor = (category: Receipt["category"]) => {
    switch (category) {
      case "Mat": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "Boende": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "Transport": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-200",
      hasWarnings && "ring-1 ring-amber-200 dark:ring-amber-800"
    )}>
      <CardContent className="p-0">
        {/* Header section with image and store info */}
        <div className="flex gap-4 p-4 pb-3">
          {/* Thumbnail */}
          <button
            onClick={onImageClick}
            className={cn(
              "h-16 w-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden",
              "transition-all duration-200 hover:ring-2 hover:ring-primary",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            )}
          >
            {receipt.image_url ? (
              <img
                src={receipt.image_url}
                alt={receipt.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </button>

          {/* Store info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground truncate">
                {receipt.name}
              </h3>
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0",
                getCategoryBadgeColor(receipt.category)
              )}>
                {receipt.category}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(receipt.date)}
              </span>
            </div>

            {/* Warning badge */}
            {hasWarnings && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Innehåller ej ersättningsbara artiklar</span>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border mx-4" />

        {/* Items section */}
        <div className="p-4 pt-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full text-sm font-medium text-foreground mb-3 min-h-[44px] -my-2 py-2"
          >
            <span>Välj dina rader ({selectedItems.length} av {receipt.items.length})</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {isExpanded && (
            <div className="space-y-1">
              {receipt.items.map((item) => (
                <label
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-150",
                    "hover:bg-muted/50",
                    item.selected && "bg-primary/5",
                    (item.isAlcohol || item.isTobacco) && "bg-amber-50/50 dark:bg-amber-950/20"
                  )}
                >
                  <Checkbox
                    checked={item.selected}
                    onCheckedChange={(checked) => {
                      onItemToggle(receipt.id, item.id, checked === true)
                    }}
                    className="h-5 w-5"
                    disabled={item.isAlcohol || item.isTobacco}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getItemIcon(item)}
                      <span className={cn(
                        "text-sm truncate",
                        item.selected ? "text-foreground" : "text-muted-foreground",
                        (item.isAlcohol || item.isTobacco) && "line-through"
                      )}>
                        {item.name}
                        {item.quantity > 1 && (
                          <span className="text-muted-foreground ml-1">x{item.quantity}</span>
                        )}
                      </span>
                    </div>
                    {(item.isAlcohol || item.isTobacco) && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                        {item.isAlcohol ? "Alkohol ersätts ej" : "Tobak ersätts ej"}
                      </p>
                    )}
                  </div>

                  <span className={cn(
                    "text-sm font-medium tabular-nums flex-shrink-0",
                    item.selected ? "text-foreground" : "text-muted-foreground",
                    (item.isAlcohol || item.isTobacco) && "line-through"
                  )}>
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer with totals */}
        <div className="bg-muted/30 border-t border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Din ersättning</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                (av {formatCurrency(receipt.amount)} totalt)
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold text-primary tabular-nums">
                {formatCurrency(selectedTotal)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
