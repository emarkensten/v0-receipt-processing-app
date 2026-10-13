"use client"

import { useRef, useState } from "react"
import { Box } from "@mui/material"
import Checkbox from "@sj-ab/component-library.ui.checkbox"
import Divider from "@sj-ab/component-library.ui.divider"
import FormControlLabel from "@sj-ab/component-library.ui.form-control-label"
import { Delete, Search } from "@sj-ab/component-library.ui.icons"
import Sheet from "@sj-ab/component-library.ui.sheet"
import Stack from "@sj-ab/component-library.ui.stack"
import TextButton from "@sj-ab/component-library.ui.text-button"
import Typography from "@sj-ab/component-library.ui.typography"
import { receiptMeta } from "@/lib/labels"
import { BLOCKED_KINDS, formatKr, type Receipt } from "@/lib/reimbursement"
import { ReceiptViewer } from "./ReceiptViewer"

type Props = {
  receipt: Receipt | null
  onClose: () => void
  onToggleItem: (receiptId: string, itemId: string, selected: boolean) => void
  onRemove: (receiptId: string) => void
}

/** Detaljer för ett kvitto. Öppnas som Sheet ovanpå listan, som i SJ:s appar. */
export function ReceiptSheet({ receipt, onClose, onToggleItem, onRemove }: Props) {
  const headingRef = useRef<HTMLDivElement>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const close = () => {
    setFullscreen(false)
    onClose()
  }
  const title = receipt?.store ?? "Kvitto"
  const meta = receipt ? receiptMeta(receipt) : ""

  return (
    <Sheet
      open={Boolean(receipt)}
      onClose={close}
      shouldCloseOnBackdropClick
      height="auto"
      width="medium"
      aria-labelledby="receipt-sheet-title"
      AppBarProps={{
        title,
        headingRef,
        navigationButtons: [{ label: "Stäng", ariaLabel: "Stäng", variant: "close", action: close }],
      }}
    >
      {receipt && (
        <Stack useFlexGap spacing={3} sx={{ px: 2, pt: 1, pb: 4 }}>
          <Stack useFlexGap spacing={0.5}>
            <Typography ref={headingRef} id="receipt-sheet-title" variant="h2">
              {title}
            </Typography>
            <Typography variant="bodyRegular" color="text.secondary">
              {meta}
            </Typography>
          </Stack>

          {receipt.summary && <Typography variant="bodyRegular">{receipt.summary}</Typography>}

          {receipt.previewUrl && (
            <Stack useFlexGap spacing={1}>
              <Box
                component="button"
                type="button"
                onClick={() => setFullscreen(true)}
                aria-label="Visa kvittot i helskärm"
                sx={(theme) => ({
                  display: "block",
                  p: 0,
                  border: 0,
                  background: "none",
                  cursor: "zoom-in",
                  alignSelf: "flex-start",
                  "&:focus-visible": theme.mixins.focusVisibleStyles?.() ?? {},
                })}
              >
                <Box
                  component="img"
                  src={receipt.previewUrl}
                  alt=""
                  sx={{ display: "block", maxWidth: "100%", maxHeight: 200, objectFit: "contain" }}
                />
              </Box>
              <Box>
                <TextButton
                  startIcon={<Search />}
                  negativeMargins={{ top: false, right: false, bottom: false, left: true }}
                  onClick={() => setFullscreen(true)}
                >
                  Visa kvittot i helskärm
                </TextButton>
              </Box>
            </Stack>
          )}

          {receipt.items.length > 0 && (
            <Stack useFlexGap spacing={1}>
              <Typography variant="h3">Välj vad du vill ha ersättning för</Typography>
              <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
                {receipt.items.map((item) => {
                  const blocked = BLOCKED_KINDS[item.kind]
                  return (
                    <li key={item.id}>
                      <FormControlLabel
                        negativeMargins={{ left: true }}
                        disabled={Boolean(blocked)}
                        sx={{ width: "100%", mr: 0, "& .MuiFormControlLabel-label": { flex: 1 } }}
                        control={
                          <Checkbox
                            checked={item.selected && !blocked}
                            onChange={(_, checked) => onToggleItem(receipt.id, item.id, checked)}
                          />
                        }
                        label={
                          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, width: "100%", py: 1 }}>
                            <Box>
                              <Typography variant="bodyRegular" component="span" sx={{ display: "block" }}>
                                {item.quantity > 1 ? `${item.quantity} × ${item.name}` : item.name}
                              </Typography>
                              {blocked && (
                                <Typography variant="subheadlineRegular" component="span" color="text.secondary">
                                  {blocked}
                                </Typography>
                              )}
                            </Box>
                            <Typography variant="bodyRegular" component="span" sx={{ whiteSpace: "nowrap" }}>
                              {formatKr(item.amount)}
                            </Typography>
                          </Box>
                        }
                      />
                    </li>
                  )
                })}
              </Box>
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between", pt: 1 }}>
                <Typography variant="title3Emphasized">Totalt på kvittot</Typography>
                <Typography variant="title3Emphasized">{formatKr(receipt.total ?? 0)}</Typography>
              </Box>
            </Stack>
          )}

          <Box>
            <TextButton
              startIcon={<Delete />}
              negativeMargins={{ top: false, right: false, bottom: false, left: true }}
              onClick={() => {
                onRemove(receipt.id)
                close()
              }}
            >
              Ta bort kvittot
            </TextButton>
          </Box>
        </Stack>
      )}
      {receipt?.previewUrl && (
        <ReceiptViewer open={fullscreen} src={receipt.previewUrl} title={title} onClose={() => setFullscreen(false)} />
      )}
    </Sheet>
  )
}
