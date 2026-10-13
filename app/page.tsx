"use client"

import { useMemo, useState } from "react"
import { AnimatePresence, MotionConfig, motion } from "motion/react"
import { useMediaQuery } from "@mui/material"
import { DoneStep } from "@/components/steps/DoneStep"
import { ReceiptsStep } from "@/components/steps/ReceiptsStep"
import { SummaryStep } from "@/components/steps/SummaryStep"
import { TripStep } from "@/components/steps/TripStep"
import { calculate, type Trip } from "@/lib/reimbursement"
import { useReceipts } from "@/lib/use-receipts"

const STEPS = ["receipts", "trip", "summary", "done"] as const
type Step = (typeof STEPS)[number]

export default function Home() {
  const receipts = useReceipts()
  const [step, setStep] = useState<Step>("receipts")
  const [direction, setDirection] = useState<1 | -1>(1)
  // Som SJ:s PageTransition: sidorna glider i sidled på mobil och tonar in på större skärmar.
  const slide = useMediaQuery("(max-width: 599px)")
  const [trip, setTrip] = useState<Trip | null>(null)

  const go = (next: Step) => {
    setDirection(STEPS.indexOf(next) > STEPS.indexOf(step) ? 1 : -1)
    setStep(next)
    window.scrollTo({ top: 0 })
  }

  const calculation = useMemo(() => (trip ? calculate(receipts.receipts, trip) : null), [receipts.receipts, trip])
  const offset = slide ? 48 : 0
  const page = (match: Step, node: React.ReactNode) =>
    step === match && (
      <motion.div
        key={match}
        custom={direction}
        initial={{ opacity: 0, x: direction * offset }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: direction * -offset, transition: { duration: 0.12 } }}
        transition={{ type: "spring", stiffness: 420, damping: 40 }}
      >
        {node}
      </motion.div>
    )

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait" initial={false}>
      {page("receipts", <ReceiptsStep {...receipts} onContinue={() => go("trip")} />)}
      {page(
        "trip",
        <TripStep
          initial={trip ?? {}}
          onBack={() => go("receipts")}
          onDone={(t) => {
            setTrip(t)
            go("summary")
          }}
        />,
      )}
      {page(
        "summary",
        calculation && trip && (
          <SummaryStep calculation={calculation} trip={trip} onBack={() => go("trip")} onSubmit={() => go("done")} />
        ),
      )}
      {page(
        "done",
        <DoneStep
          amount={calculation?.totalPayout ?? 0}
          onDone={() => {
            receipts.reset()
            setTrip(null)
            go("receipts")
          }}
        />,
      )}
      </AnimatePresence>
    </MotionConfig>
  )
}
