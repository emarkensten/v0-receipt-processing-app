import type { ExtractedReceipt } from "./receipt-schema"

export type Distance = "short" | "long"
export type Delay = "20-59" | "60-119" | "120+"
export type Category = "Mat" | "Boende" | "Transport"

export interface Trip {
  distance: Distance
  delay: Delay
  sjProvided: Record<Category, boolean>
}

export type ItemKind = ExtractedReceipt["items"][number]["kind"]

export interface ReceiptItem {
  id: string
  name: string
  quantity: number
  amount: number
  kind: ItemKind
  selected: boolean
}

export interface Receipt {
  id: string
  fileName: string
  previewUrl: string
  status: "reading" | "done" | "error"
  error?: string
  store?: string
  date?: string | null
  currency?: string
  total?: number
  category?: ExtractedReceipt["category"]
  summary?: string
  hasAlcoholOrTobacco?: boolean
  items: ReceiptItem[]
}

/** Rader som aldrig ersätts. De visas men går inte att välja. */
export const BLOCKED_KINDS: Partial<Record<ItemKind, string>> = {
  alkohol: "Alkohol ersätts inte",
  tobak: "Tobak ersätts inte",
  ovrigt: "Hör inte till resan",
}

const KIND_TO_CATEGORY: Partial<Record<ItemKind, Category>> = {
  mat_dryck: "Mat",
  boende: "Boende",
  transport: "Transport",
}

export function toReceiptItems(receipt: ExtractedReceipt): ReceiptItem[] {
  return receipt.items.map((item, index) => ({
    id: `${index}`,
    name: item.name,
    quantity: item.quantity,
    amount: item.line_total,
    kind: item.kind,
    selected: !BLOCKED_KINDS[item.kind],
  }))
}

/**
 * Takbelopp per kategori. Prototypens beloppsgränser bygger på EU 2021/782 (15 mil eller mer)
 * och lag 2015:953 (kortare resor). SJ:s faktiska praxis kan skilja sig.
 */
function rule(category: Category, trip: Trip): { cap: number; reason?: string } {
  const long = trip.distance === "long"
  if (trip.sjProvided[category]) {
    const what = { Mat: "mat och dryck", Boende: "hotell", Transport: "annan transport" }[category]
    return { cap: 0, reason: `SJ ordnade ${what}, så det ersätts inte en gång till` }
  }
  switch (category) {
    case "Mat":
      if (long) {
        if (trip.delay === "20-59") return { cap: 0, reason: "Mat ersätts från 60 minuters försening på längre resor" }
        return { cap: trip.delay === "120+" ? 200 : 100 }
      }
      return { cap: trip.delay === "20-59" ? 50 : 100 }
    case "Boende":
      if (!long) return { cap: 0, reason: "Hotell ersätts bara på resor som är 15 mil eller längre" }
      if (trip.delay !== "120+") return { cap: 0, reason: "Hotell ersätts när förseningen är minst 2 timmar" }
      return { cap: 1500 }
    case "Transport":
      if (long && trip.delay === "20-59") {
        return { cap: 0, reason: "Annan transport ersätts från 60 minuters försening på längre resor" }
      }
      return { cap: long ? 1200 : 1138 }
  }
}

export interface CategoryResult {
  category: Category
  /** Valda, ersättningsbara rader. */
  claimed: number
  cap: number
  payout: number
  reason?: string
}

export interface Calculation {
  categories: CategoryResult[]
  excluded: { name: string; amount: number; reason: string }[]
  totalSpent: number
  totalPayout: number
}

export function calculate(receipts: Receipt[], trip: Trip): Calculation {
  const claimed: Record<Category, number> = { Mat: 0, Boende: 0, Transport: 0 }
  const excluded: Calculation["excluded"] = []
  let totalSpent = 0

  for (const receipt of receipts) {
    if (receipt.status !== "done") continue
    totalSpent += receipt.total ?? 0

    if (receipt.items.length === 0) {
      // Utan läsbara rader går det inte att räkna bort alkohol eller tobak, så då ersätts inte kvittot alls.
      const reason = receipt.hasAlcoholOrTobacco
        ? "Raderna gick inte att läsa och kvittot har alkohol eller tobak"
        : receipt.category === "Övrigt" || !receipt.category
          ? "Hör inte till resan"
          : undefined
      if (reason) excluded.push({ name: receipt.store ?? receipt.fileName, amount: receipt.total ?? 0, reason })
      else claimed[receipt.category as Category] += receipt.total ?? 0
      continue
    }
    for (const item of receipt.items) {
      const blocked = BLOCKED_KINDS[item.kind]
      const category = KIND_TO_CATEGORY[item.kind]
      if (blocked) excluded.push({ name: item.name, amount: item.amount, reason: blocked })
      else if (!item.selected) excluded.push({ name: item.name, amount: item.amount, reason: "Du valde bort raden" })
      else if (category) claimed[category] += item.amount
    }
  }

  const categories = (Object.keys(claimed) as Category[])
    .filter((category) => claimed[category] > 0)
    .map((category) => {
      const { cap, reason } = rule(category, trip)
      return { category, claimed: claimed[category], cap, payout: Math.min(claimed[category], cap), reason }
    })

  return {
    categories,
    excluded,
    totalSpent,
    totalPayout: categories.reduce((sum, c) => sum + c.payout, 0),
  }
}

export function formatKr(amount: number): string {
  const rounded = Math.round(amount * 100) / 100
  return `${rounded.toLocaleString("sv-SE", { minimumFractionDigits: Number.isInteger(rounded) ? 0 : 2, maximumFractionDigits: 2 })} kr`
}
