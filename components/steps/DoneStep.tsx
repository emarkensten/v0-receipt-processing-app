"use client"

import { motion } from "motion/react"
import { Box } from "@mui/material"
import { DoneFilledChecked } from "@sj-ab/component-library.ui.icons"
import FlowButton from "@sj-ab/component-library.ui.flow-button"
import Stack from "@sj-ab/component-library.ui.stack"
import Typography from "@sj-ab/component-library.ui.typography"
import { SubmittedReceipts } from "@/components/SubmittedReceipts"
import { formatKr, type Receipt } from "@/lib/reimbursement"

type Props = { amount: number; receipts: Receipt[]; onDone: () => void }

/** Bekräftelsen svarar på "vad händer nu?" och avslutar flödet. */
export function DoneStep({ amount, receipts, onDone }: Props) {
  // MotionConfig i App.tsx stänger av rörelsen för den som valt minskad rörelse.
  const enter = (delay: number) =>
    ({
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      transition: { delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] },
    }) as const

  return (
    <Box component="main" sx={{ maxWidth: 600, mx: "auto", px: 2, pt: { xs: 8, sm: 12 }, pb: 6 }}>
      <Stack useFlexGap spacing={3} sx={{ textAlign: "center", alignItems: "center" }}>
        <motion.div {...enter(0)}>
          <Box sx={{ color: "primary.main", display: "flex", "& svg": { width: 64, height: 64 } }}>
            <DoneFilledChecked aria-hidden />
          </Box>
        </motion.div>
        <motion.div {...enter(0.15)}>
          <Stack useFlexGap spacing={1}>
            <Typography variant="h1">Tack, vi har fått din ansökan</Typography>
            <Typography variant="bodyRegular" color="text.secondary">
              Vi går igenom kvittona och betalar ut {formatKr(amount)} inom 30 dagar. Du får ett mejl när pengarna är på väg.
            </Typography>
          </Stack>
        </motion.div>
        <motion.div {...enter(0.3)} style={{ width: "100%" }}>
          <FlowButton fullWidth onClick={onDone}>
            Klar
          </FlowButton>
        </motion.div>
        <motion.div {...enter(0.45)} style={{ width: "100%", textAlign: "left" }}>
          <SubmittedReceipts id="done-receipts" title="Det här skickade du in" receipts={receipts} />
        </motion.div>
      </Stack>
    </Box>
  )
}
