"use client"

import { useState, type ReactNode } from "react"
import { Box, FormGroup, RadioGroup } from "@mui/material"
import Checkbox from "@sj-ab/component-library.ui.checkbox"
import FlowButton from "@sj-ab/component-library.ui.flow-button"
import FormControlLabel from "@sj-ab/component-library.ui.form-control-label"
import { WarningSmall } from "@sj-ab/component-library.ui.icons"
import Radio from "@sj-ab/component-library.ui.radio"
import Stack from "@sj-ab/component-library.ui.stack"
import Typography from "@sj-ab/component-library.ui.typography"
import { PageLayout } from "@/components/PageLayout"
import type { Category, Delay, Distance, Trip } from "@/lib/reimbursement"

const LEFT = { left: true }

type Props = {
  initial: Partial<Trip>
  onBack: () => void
  onDone: (trip: Trip) => void
}

export function TripStep({ initial, onBack, onDone }: Props) {
  const [distance, setDistance] = useState<Distance | undefined>(initial.distance)
  const [delay, setDelay] = useState<Delay | undefined>(initial.delay)
  const [sjProvided, setSjProvided] = useState<Record<Category, boolean>>(
    initial.sjProvided ?? { Mat: false, Boende: false, Transport: false },
  )
  const [showErrors, setShowErrors] = useState(false)

  const submit = () => {
    if (!distance || !delay) {
      setShowErrors(true)
      document.getElementById(!distance ? "distance-label" : "delay-label")?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    onDone({ distance, delay, sjProvided })
  }

  return (
    <PageLayout
      title="Om resan"
      intro="Tre snabba frågor, så räknar vi ut vad du kan få tillbaka."
      onBack={onBack}
      bottomBar={
        <FlowButton fullWidth onClick={submit}>
          Visa min ersättning
        </FlowButton>
      }
    >
      <Question id="distance-label" title="Hur lång var resan?" error={showErrors && !distance ? "Välj hur lång resan var" : undefined}>
        <RadioGroup aria-labelledby="distance-label" value={distance ?? ""} onChange={(e) => setDistance(e.target.value as Distance)}>
          <Option value="short" label="Kortare än 15 mil" hint="Till exempel Stockholm–Uppsala" />
          <Option value="long" label="15 mil eller längre" hint="Till exempel Stockholm–Göteborg" />
        </RadioGroup>
      </Question>

      <Question id="delay-label" title="Hur sen kom du fram?" error={showErrors && !delay ? "Välj hur sen du kom fram" : undefined}>
        <RadioGroup aria-labelledby="delay-label" value={delay ?? ""} onChange={(e) => setDelay(e.target.value as Delay)}>
          <Option value="20-59" label="20–59 minuter" />
          <Option value="60-119" label="1–2 timmar" />
          <Option value="120+" label="Mer än 2 timmar" />
        </RadioGroup>
      </Question>

      <Question id="provided-label" title="Ordnade SJ något åt dig?" hint="Det som SJ redan ordnat ersätts inte en gång till.">
        <FormGroup aria-labelledby="provided-label">
          {(
            [
              ["Mat", "Mat eller dryck"],
              ["Boende", "Hotell"],
              ["Transport", "Taxi eller buss"],
            ] as const
          ).map(([key, label]) => (
            <FormControlLabel
              key={key}
              negativeMargins={LEFT}
              label={label}
              control={
                <Checkbox
                  name={`sj-provided-${key}`}
                  checked={sjProvided[key]}
                  onChange={(_, checked) => setSjProvided((s) => ({ ...s, [key]: checked }))}
                />
              }
            />
          ))}
        </FormGroup>
      </Question>
    </PageLayout>
  )
}

function Question({ id, title, hint, error, children }: { id: string; title: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <Stack useFlexGap spacing={1} component="fieldset" sx={{ border: 0, m: 0, p: 0, minWidth: 0 }}>
      <Typography id={id} variant="h2" component="legend" sx={{ p: 0, mb: hint ? 0.5 : 1 }}>
        {title}
      </Typography>
      {hint && (
        <Typography variant="bodyRegular" color="text.secondary" sx={{ mb: 1 }}>
          {hint}
        </Typography>
      )}
      {children}
      {error && (
        <Box role="alert" sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "error.main" }}>
          <WarningSmall aria-hidden />
          <Typography variant="subheadlineRegular" color="inherit">
            {error}
          </Typography>
        </Box>
      )}
    </Stack>
  )
}

function Option({ value, label, hint }: { value: string; label: string; hint?: string }) {
  return (
    <FormControlLabel
      value={value}
      negativeMargins={LEFT}
      control={<Radio />}
      label={
        hint ? (
          <Box sx={{ py: 1 }}>
            <Typography variant="bodyRegular" component="span" sx={{ display: "block" }}>
              {label}
            </Typography>
            <Typography variant="subheadlineRegular" component="span" color="text.secondary">
              {hint}
            </Typography>
          </Box>
        ) : (
          label
        )
      }
    />
  )
}
