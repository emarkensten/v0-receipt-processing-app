import type { Receipt } from "./reimbursement"

export const CATEGORY_LABEL: Record<NonNullable<Receipt["category"]>, string> = {
  Mat: "Mat och dryck",
  Boende: "Hotell",
  Transport: "Taxi och buss",
  Övrigt: "Övrigt",
}

const dateFormat = new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "long" })

export function formatDate(iso?: string | null): string | undefined {
  if (!iso) return undefined
  const date = new Date(`${iso}T12:00:00`)
  return Number.isNaN(date.getTime()) ? undefined : dateFormat.format(date)
}
