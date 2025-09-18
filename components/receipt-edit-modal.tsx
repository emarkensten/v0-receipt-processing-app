"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type Receipt } from "@/lib/types"
import { X } from "lucide-react"
import { FullscreenReceiptModal } from "@/components/fullscreen-receipt-modal"

interface ReceiptEditModalProps {
  receipt: Receipt | null
  receiptFile: File | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedReceipt: Receipt) => void
}

export function ReceiptEditModal({ receipt, receiptFile, isOpen, onClose, onSave }: ReceiptEditModalProps) {
  const [category, setCategory] = useState("Mat")
  const [currency, setCurrency] = useState("SEK")
  const [amount, setAmount] = useState("")
  const [showFullscreen, setShowFullscreen] = useState(false)

  // Update state when receipt changes
  useEffect(() => {
    if (receipt) {
      setCategory(receipt.category || "Mat")
      setCurrency(receipt.currency || "SEK")
      setAmount(receipt.amount?.toString() || "")
    }
  }, [receipt])

  if (!isOpen || !receipt) return null

  const handleSave = () => {
    const updatedReceipt: Receipt = {
      ...receipt,
      category: category as Receipt["category"],
      currency: currency,
      amount: parseFloat(amount) || receipt.amount,
    }
    onSave(updatedReceipt)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
      <Card className="w-full max-w-md md:max-w-lg rounded-t-2xl md:rounded-2xl rounded-b-none md:rounded-b-2xl max-h-[80vh] md:max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Redigera kvitto 1</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 pb-8">
          {/* Receipt Image */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowFullscreen(true)}
              className="w-20 h-20 bg-muted rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
            >
              {receiptFile ? (
                receiptFile.type.startsWith("image/") ? (
                  <img
                    src={URL.createObjectURL(receiptFile)}
                    alt="Kvitto"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-destructive/10">
                    <div className="text-lg mb-1">📄</div>
                    <div className="text-xs text-destructive font-medium">PDF</div>
                  </div>
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">📄</span>
                </div>
              )}
            </button>
          </div>

          {/* Category Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Typ av utlägg</Label>
            <RadioGroup value={category} onValueChange={setCategory}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Mat" id="mat" />
                <Label htmlFor="mat">Mat</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Boende" id="boende" />
                <Label htmlFor="boende">Boende</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Transport" id="transport" />
                <Label htmlFor="transport">Alternativ transport</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Currency Selection */}
          <div className="space-y-2">
            <Label htmlFor="currency" className="text-base font-medium">Valuta</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SEK">Svenska kronor</SelectItem>
                <SelectItem value="EUR">Euro</SelectItem>
                <SelectItem value="USD">US Dollar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-base font-medium">Kostnad</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-8"
                placeholder="289"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                kr
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Fyll i kostnaden med siffror och avrunda uppåt till närmsta krona.
            </p>
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} className="w-full" size="lg">
            Spara
          </Button>
        </CardContent>
      </Card>

      {/* Fullscreen Receipt Modal */}
      <FullscreenReceiptModal
        file={receiptFile}
        isOpen={showFullscreen}
        onClose={() => setShowFullscreen(false)}
        receiptName={receipt?.name || "Kvitto"}
      />
    </div>
  )
}
