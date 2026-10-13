"use client"

import { useRef, useState, type ChangeEvent } from "react"
import { useDropzone } from "react-dropzone"
import { AnimatePresence, motion } from "motion/react"
import { Box } from "@mui/material"
import CircularProgress from "@sj-ab/component-library.ui.circular-progress"
import Divider from "@sj-ab/component-library.ui.divider"
import FlowButton from "@sj-ab/component-library.ui.flow-button"
import { Bed, Bistro, Camera, ChevronRight, Image as ImageIcon, PlusSmall, Taxi, WarningSmall } from "@sj-ab/component-library.ui.icons"
import List from "@sj-ab/component-library.ui.list"
import ListImage from "@sj-ab/component-library.ui.list-image"
import ListItem from "@sj-ab/component-library.ui.list-item"
import ListItemButton from "@sj-ab/component-library.ui.list-item-button"
import ListItemIcon from "@sj-ab/component-library.ui.list-item-icon"
import ListItemText from "@sj-ab/component-library.ui.list-item-text"
import Stack from "@sj-ab/component-library.ui.stack"
import TextButton from "@sj-ab/component-library.ui.text-button"
import Typography from "@sj-ab/component-library.ui.typography"
import { PageLayout } from "@/components/PageLayout"
import { ReceiptSheet } from "@/components/ReceiptSheet"
import { receiptMeta } from "@/lib/labels"
import { BLOCKED_KINDS, formatKr, type Receipt } from "@/lib/reimbursement"
import type { useReceipts } from "@/lib/use-receipts"

const ACCEPT = "image/*,.heic,.heif,application/pdf"
const LEFT_ONLY = { top: false, right: false, bottom: false, left: true }

const rowMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, height: 0 },
  transition: { type: "spring", stiffness: 380, damping: 32 },
} as const

type Props = ReturnType<typeof useReceipts> & { onContinue: () => void }

export function ReceiptsStep({ receipts, add, addExamples, retry, remove, toggleItem, onContinue }: Props) {
  const cameraInput = useRef<HTMLInputElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [rejected, setRejected] = useState<string | null>(null)
  const { getRootProps, isDragActive } = useDropzone({
    onDrop: (files) => {
      setRejected(null)
      if (files.length) add(files)
    },
    onDropRejected: (rejections) =>
      setRejected(`${rejections.map((r) => r.file.name).join(", ")} går inte att läsa. Använd en bild eller en PDF.`),
    noClick: true,
    noKeyboard: true,
    // Filer från till exempel Google Drive saknar ibland MIME-typ, så filändelserna måste också räknas upp.
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif"], "application/pdf": [".pdf"] },
  })

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length) add(files)
    event.target.value = ""
  }

  const reading = receipts.filter((r) => r.status === "reading").length
  const done = receipts.filter((r) => r.status === "done").length
  const hasReceipts = receipts.length > 0

  const pickers = (
    <>
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={onPick} />
      <input ref={fileInput} type="file" accept={ACCEPT} multiple hidden onChange={onPick} />
    </>
  )

  return (
    <Box {...getRootProps()} sx={{ minHeight: "100dvh", outline: "none" }}>
      {pickers}
      <PageLayout
        title="Ersättning vid försening"
        intro={
          hasReceipts
            ? "Kontrollera att vi har läst kvittona rätt. Tryck på ett kvitto för att se raderna."
            : "Fick du betala för mat, hotell eller taxi när tåget var försenat? Fotografera kvittona, så räknar vi ut vad du kan få tillbaka."
        }
        bottomBar={
          hasReceipts ? (
            <FlowButton fullWidth disabled={reading > 0 || done === 0} shouldShowSpinner={reading > 0} onClick={onContinue}>
              {reading > 0 ? `Läser ${reading === 1 ? "kvittot" : `${reading} kvitton`}` : "Fortsätt"}
            </FlowButton>
          ) : undefined
        }
      >
        {rejected && (
          <Box role="alert" sx={{ display: "flex", alignItems: "flex-start", gap: 0.5, color: "error.main" }}>
            <WarningSmall aria-hidden />
            <Typography variant="subheadlineRegular" color="inherit">
              {rejected}
            </Typography>
          </Box>
        )}

        {!hasReceipts && (
          <>
            <Stack useFlexGap spacing={2}>
              <FlowButton fullWidth symbol={<Camera />} symbolPosition="left" onClick={() => cameraInput.current?.click()}>
                Fotografera kvitto
              </FlowButton>
              <FlowButton
                fullWidth
                colorVariant="secondary"
                symbol={<ImageIcon />}
                symbolPosition="left"
                onClick={() => fileInput.current?.click()}
              >
                Välj bilder eller PDF
              </FlowButton>
              <Box>
                <TextButton negativeMargins={LEFT_ONLY} onClick={() => void addExamples()}>
                  Prova med tre exempelkvitton
                </TextButton>
              </Box>
            </Stack>

            <Stack useFlexGap spacing={1}>
              <Typography variant="h2">Det här kan du få tillbaka</Typography>
              <List component="ul">
                {[
                  { icon: <Bistro />, primary: "Mat och dryck", secondary: "Medan du väntar på tåget" },
                  { icon: <Bed />, primary: "Hotell", secondary: "Om du inte kommer fram samma dag" },
                  { icon: <Taxi />, primary: "Taxi eller buss", secondary: "Om SJ inte ordnar ersättningstrafik" },
                ].map((row) => (
                  <ListItem key={row.primary}>
                    <ListItemIcon iconPosition="start">{row.icon}</ListItemIcon>
                    <ListItemText primary={row.primary} secondary={row.secondary} />
                  </ListItem>
                ))}
              </List>
              <Typography variant="subheadlineRegular" color="text.secondary">
                Alkohol, tobak och sådant som inte hör till resan ersätts inte.
              </Typography>
            </Stack>
          </>
        )}

        {hasReceipts && (
          <Stack useFlexGap spacing={1}>
            <Typography variant="h2" aria-live="polite">
              {receipts.length === 1 ? "Ditt kvitto" : `Dina ${receipts.length} kvitton`}
            </Typography>
            <List component="div">
              <Divider variant="middle" />
              <AnimatePresence initial={false}>
                {receipts.map((receipt) => (
                  <motion.div key={receipt.id} {...rowMotion} layout>
                    <ReceiptRow receipt={receipt} onOpen={() => setOpenId(receipt.id)} onRetry={() => retry(receipt.id)} onRemove={() => remove(receipt.id)} />
                    <Divider variant="middle" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </List>
            <Box>
              <TextButton negativeMargins={LEFT_ONLY} startIcon={<PlusSmall />} onClick={() => fileInput.current?.click()}>
                Lägg till fler kvitton
              </TextButton>
            </Box>
          </Stack>
        )}
      </PageLayout>

      <ReceiptSheet
        receipt={receipts.find((r) => r.id === openId && r.status === "done") ?? null}
        onClose={() => setOpenId(null)}
        onToggleItem={toggleItem}
        onRemove={remove}
      />

      <AnimatePresence>
        {isDragActive && (
          <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            sx={{
              position: "fixed",
              inset: 0,
              zIndex: (theme) => theme.zIndex.modal,
              display: "grid",
              placeItems: "center",
              bgcolor: "background.default",
            }}
          >
            <Stack useFlexGap spacing={1} sx={{ alignItems: "center", textAlign: "center", px: 2 }}>
              <Typography variant="h1">Släpp kvittona här</Typography>
              <Typography variant="bodyRegular" color="text.secondary">
                Bilder och PDF går bra
              </Typography>
            </Stack>
          </Box>
        )}
      </AnimatePresence>
    </Box>
  )
}

type RowProps = { receipt: Receipt; onOpen: () => void; onRetry: () => void; onRemove: () => void }

function ReceiptRow({ receipt, onOpen, onRetry, onRemove }: RowProps) {
  const image = <ListImage variant="square" src={receipt.previewUrl || undefined} alt="" />

  if (receipt.status === "reading") {
    return (
      <ListItem component="div">
        {image}
        <ListItemText primary={receipt.fileName} secondary="Läser kvittot" />
        <CircularProgress ariaLabel="Läser kvittot" />
      </ListItem>
    )
  }

  if (receipt.status === "error") {
    return (
      <ListItem component="div" sx={{ flexWrap: "wrap" }}>
        {image}
        <ListItemText
          primary={receipt.fileName}
          secondary={
            <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: "error.main" }}>
              <WarningSmall aria-hidden /> {receipt.error}
            </Box>
          }
        />
        <Box sx={{ display: "flex", gap: 2, width: "100%", pl: 9 }}>
          <TextButton onClick={onRetry}>Försök igen</TextButton>
          <TextButton onClick={onRemove}>Ta bort</TextButton>
        </Box>
      </ListItem>
    )
  }

  const blocked = receipt.items.filter((i) => BLOCKED_KINDS[i.kind]).length
  const secondary = receiptMeta(receipt)

  return (
    <ListItemButton disableLiSemantics onClick={onOpen}>
      {image}
      <ListItemText
        primary={receipt.store}
        secondary={secondary}
        tertiary={blocked ? `${blocked} ${blocked === 1 ? "rad ersätts" : "rader ersätts"} inte` : undefined}
        primaryMeta={formatKr(receipt.total ?? 0)}
      />
      <ListItemIcon iconPosition="end" isChevronIcon>
        <ChevronRight />
      </ListItemIcon>
    </ListItemButton>
  )
}
