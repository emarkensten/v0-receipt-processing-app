"use client"

import { useState } from "react"
import type { Receipt } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface ReceiptEditFormProps {
  receipt: Receipt
  onSave: (receipt: Receipt) => void
  onCancel: () => void
}

export function ReceiptEditForm({ receipt, onSave, onCancel }: ReceiptEditFormProps) {
  const [editedReceipt, setEditedReceipt] = useState<Receipt>(receipt)

  const handleSave = () => {
    onSave(editedReceipt)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Redigera kvitto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
          <div className="w-16 h-16 bg-muted-foreground/20 rounded flex items-center justify-center">
            <span className="text-2xl">📄</span>
          </div>
        </div>

        <div>
          <Label className="text-base font-medium">Typ av utlägg</Label>
          <RadioGroup
            value={editedReceipt.category}
            onValueChange={(value) => setEditedReceipt({ ...editedReceipt, category: value as Receipt["category"] })}
            className="mt-2"
          >
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

        <div>
          <Label htmlFor="currency">Valuta</Label>
          <Select
            value={editedReceipt.currency}
            onValueChange={(value) => setEditedReceipt({ ...editedReceipt, currency: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SEK">Svenska kronor</SelectItem>
              <SelectItem value="EUR">Euro</SelectItem>
              <SelectItem value="USD">US Dollar</SelectItem>
              <SelectItem value="NOK">Norska kronor</SelectItem>
              <SelectItem value="DKK">Danska kronor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="amount">Kostnad</Label>
          <div className="relative">
            <Input
              id="amount"
              type="number"
              value={editedReceipt.amount}
              onChange={(e) => setEditedReceipt({ ...editedReceipt, amount: Number.parseFloat(e.target.value) || 0 })}
              className="pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Fyll i kostnaden med siffror och avrunda uppåt till närmsta krona.
        </p>

        <Button onClick={handleSave} className="w-full">
          Spara
        </Button>
      </CardContent>
    </Card>
  )
}
