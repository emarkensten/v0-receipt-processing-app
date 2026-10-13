"use client"

import { useState } from "react"
import AccordionCard from "@sj-ab/component-library.ui.accordion-card"
import List from "@sj-ab/component-library.ui.list"
import ListImage from "@sj-ab/component-library.ui.list-image"
import ListItemButton from "@sj-ab/component-library.ui.list-item-button"
import ListItemText from "@sj-ab/component-library.ui.list-item-text"
import { receiptMeta } from "@/lib/labels"
import { formatKr, type Receipt } from "@/lib/reimbursement"
import { ReceiptViewer } from "./ReceiptViewer"

type Props = {
  id: string
  title: string
  receipts: Receipt[]
}

/** Kvittona i en hopfälld AccordionCard, så att man kan se vad man skickar in eller har skickat in. */
export function SubmittedReceipts({ id, title, receipts }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)
  const done = receipts.filter((r) => r.status === "done")
  if (done.length === 0) return null

  const total = done.reduce((sum, r) => sum + (r.total ?? 0), 0)
  const open = done.find((r) => r.id === openId)

  return (
    <>
      <AccordionCard
        id={id}
        title={title}
        titleVariant="h3"
        subtitle={`${done.length} ${done.length === 1 ? "kvitto" : "kvitton"}, ${formatKr(total)}`}
        unmountOnCollapse
      >
        <List component="div" negativeMargins={false}>
          {done.map((receipt) => (
            <ListItemButton
              key={receipt.id}
              disableLiSemantics
              disableGutters
              disabled={!receipt.previewUrl}
              onClick={() => setOpenId(receipt.id)}
            >
              <ListImage variant="square" src={receipt.previewUrl || undefined} alt="" />
              <ListItemText
                primary={receipt.store}
                secondary={receiptMeta(receipt)}
                primaryMeta={formatKr(receipt.total ?? 0)}
              />
            </ListItemButton>
          ))}
        </List>
      </AccordionCard>

      {open?.previewUrl && (
        <ReceiptViewer open src={open.previewUrl} title={open.store ?? "Kvitto"} onClose={() => setOpenId(null)} />
      )}
    </>
  )
}
