"use client"

import { useEffect, useState } from "react"
import { animate, useReducedMotion } from "motion/react"
import { Box } from "@mui/material"
import Divider from "@sj-ab/component-library.ui.divider"
import FlowButton from "@sj-ab/component-library.ui.flow-button"
import { Bed, Bistro, Taxi } from "@sj-ab/component-library.ui.icons"
import InformationCard from "@sj-ab/component-library.ui.information-card"
import List from "@sj-ab/component-library.ui.list"
import ListItem from "@sj-ab/component-library.ui.list-item"
import ListItemIcon from "@sj-ab/component-library.ui.list-item-icon"
import ListItemText from "@sj-ab/component-library.ui.list-item-text"
import Stack from "@sj-ab/component-library.ui.stack"
import Typography from "@sj-ab/component-library.ui.typography"
import { PageLayout } from "@/components/PageLayout"
import { formatKr, type Calculation, type Category, type Trip } from "@/lib/reimbursement"

const ICON: Record<Category, React.ReactNode> = { Mat: <Bistro />, Boende: <Bed />, Transport: <Taxi /> }
const LABEL: Record<Category, string> = { Mat: "Mat och dryck", Boende: "Hotell", Transport: "Taxi och buss" }
const DELAY_LABEL: Record<Trip["delay"], string> = { "20-59": "20–59 minuter", "60-119": "1–2 timmar", "120+": "mer än 2 timmar" }

type Props = { calculation: Calculation; trip: Trip; onBack: () => void; onSubmit: () => void }

export function SummaryStep({ calculation, trip, onBack, onSubmit }: Props) {
  const { categories, excluded, totalSpent, totalPayout } = calculation
  const amount = useCountUp(totalPayout)
  const nothing = totalPayout === 0

  return (
    <PageLayout
      title="Din ersättning"
      onBack={onBack}
      bottomBar={
        <FlowButton fullWidth onClick={nothing ? onBack : onSubmit}>
          {nothing ? "Ändra svaren om resan" : "Skicka ansökan"}
        </FlowButton>
      }
    >
      <Stack useFlexGap spacing={1}>
        <Typography variant="bodyRegular" color="text.secondary">
          {nothing ? "Du kan tyvärr inte få något tillbaka" : "Du kan få tillbaka"}
        </Typography>
        <Typography variant="largeTitleEmphasized" component="p" aria-live="polite" sx={{ fontVariantNumeric: "tabular-nums" }}>
          {formatKr(amount)}
        </Typography>
        <Typography variant="bodyRegular" color="text.secondary">
          av {formatKr(totalSpent)} som du lagt ut, vid {trip.distance === "long" ? "en resa på 15 mil eller mer" : "en kortare resa"} och{" "}
          {DELAY_LABEL[trip.delay]} försening.
        </Typography>
      </Stack>

      {categories.length > 0 && (
        <Stack useFlexGap spacing={1}>
          <Typography variant="h2">Så har vi räknat</Typography>
          <List component="ul">
            <Divider component="li" variant="middle" />
            {categories.map((c) => (
              <Box component="li" key={c.category} sx={{ listStyle: "none" }}>
                <ListItem component="div">
                  <ListItemIcon iconPosition="start">{ICON[c.category]}</ListItemIcon>
                  <ListItemText
                    primary={LABEL[c.category]}
                    secondary={c.reason ?? (c.payout < c.claimed ? `Högst ${formatKr(c.cap)} för din försening` : `Hela beloppet ersätts`)}
                    primaryMeta={formatKr(c.payout)}
                    secondaryMeta={c.payout < c.claimed ? `av ${formatKr(c.claimed)}` : undefined}
                  />
                </ListItem>
                <Divider variant="middle" />
              </Box>
            ))}
          </List>
        </Stack>
      )}

      {excluded.length > 0 && (
        <Stack useFlexGap spacing={1}>
          <Typography variant="h2">Ersätts inte</Typography>
          <List component="ul">
            <Divider component="li" variant="middle" />
            {excluded.map((e, i) => (
              <Box component="li" key={`${e.name}-${i}`} sx={{ listStyle: "none" }}>
                <ListItem component="div">
                  <ListItemText primary={e.name} secondary={e.reason} primaryMeta={formatKr(e.amount)} />
                </ListItem>
                <Divider variant="middle" />
              </Box>
            ))}
          </List>
        </Stack>
      )}

      <InformationCard
        title="Det här är en uppskattning"
        titleVariant="h3"
        secondaryMeta="SJ:s kundtjänst går igenom kvittona och gör den slutliga bedömningen. Pengarna betalas ut inom 30 dagar."
      />
    </PageLayout>
  )
}

/** Räknar upp beloppet, så att det känns som ett resultat och inte bara en siffra. */
function useCountUp(target: number) {
  const reduce = useReducedMotion()
  const [value, setValue] = useState(reduce ? target : 0)
  useEffect(() => {
    if (reduce) {
      setValue(target)
      return
    }
    const controls = animate(0, target, { duration: 0.9, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setValue(Math.round(v)) })
    return () => controls.stop()
  }, [target, reduce])
  return value
}
