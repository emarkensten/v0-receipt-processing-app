"use client"

import { useCallback, useRef, useState } from "react"
import type { ExtractedReceipt } from "./receipt-schema"
import { toReceiptItems, type Receipt } from "./reimbursement"

async function toDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/** HEIC blir JPEG och stora bilder krymps, så att uppladdningen går fort även på mobilnät. */
async function prepare(file: File): Promise<File> {
  if (file.type === "application/pdf") return file
  try {
    const { defaultImagePreprocessor } = await import("./utils/image-preprocessor")
    const [result] = await defaultImagePreprocessor.processFiles([file])
    return result.file
  } catch {
    return file
  }
}

export function useReceipts() {
  const [receipts, setReceipts] = useState<Receipt[]>([])

  const update = useCallback((id: string, patch: Partial<Receipt>) => {
    setReceipts((all) => all.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }, [])

  const read = useCallback(
    async (id: string, file: File) => {
      update(id, { status: "reading", error: undefined })
      try {
        const prepared = await prepare(file)
        if (prepared !== file && prepared.type.startsWith("image/")) {
          update(id, { previewUrl: URL.createObjectURL(prepared) })
        }
        const response = await fetch("/api/process-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentUrl: await toDataUrl(prepared) }),
        })
        const body = (await response.json().catch(() => ({}))) as { receipt?: ExtractedReceipt; error?: string }
        if (!response.ok || !body.receipt) throw new Error(body.error ?? "Vi kunde inte läsa kvittot.")

        const r = body.receipt
        update(id, {
          status: "done",
          store: r.store_name,
          date: r.date,
          currency: r.currency,
          total: r.total_amount,
          category: r.category,
          summary: r.summary,
          items: toReceiptItems(r),
        })
      } catch (error) {
        update(id, { status: "error", error: error instanceof Error ? error.message : "Vi kunde inte läsa kvittot." })
      }
    },
    [update],
  )

  // Originalfilerna sparas så att ett kvitto som inte gick att läsa kan provas igen.
  const files = useRef(new Map<string, File>())

  const add = useCallback(
    (newFiles: File[]) => {
      const added = newFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        receipt: {
          id: "",
          fileName: file.name,
          previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
          status: "reading" as const,
          items: [],
        },
      }))
      setReceipts((all) => [...all, ...added.map(({ id, receipt }) => ({ ...receipt, id }))])
      // Kvittona läses parallellt: det är det som gör att flera bilder går snabbt.
      added.forEach(({ id, file }) => {
        files.current.set(id, file)
        void read(id, file)
      })
    },
    [read],
  )

  const addExamples = useCallback(async () => {
    const names = ["kiosk.jpg", "taxi.jpg", "hotell.jpg"]
    const blobs = await Promise.all(names.map((n) => fetch(`/exempel/${n}`).then((r) => r.blob())))
    add(blobs.map((blob, i) => new File([blob], `Exempelkvitto ${i + 1}.jpg`, { type: "image/jpeg" })))
  }, [add])

  const retry = useCallback(
    (id: string) => {
      const file = files.current.get(id)
      if (file) void read(id, file)
    },
    [read],
  )

  const remove = useCallback((id: string) => {
    files.current.delete(id)
    setReceipts((all) => all.filter((r) => r.id !== id))
  }, [])

  const toggleItem = useCallback((receiptId: string, itemId: string, selected: boolean) => {
    setReceipts((all) =>
      all.map((r) =>
        r.id === receiptId ? { ...r, items: r.items.map((i) => (i.id === itemId ? { ...i, selected } : i)) } : r,
      ),
    )
  }, [])

  const reset = useCallback(() => {
    files.current.clear()
    setReceipts([])
  }, [])

  return { receipts, add, addExamples, retry, remove, toggleItem, reset }
}
