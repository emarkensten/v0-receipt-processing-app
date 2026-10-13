"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "motion/react"
import { Box } from "@mui/material"
import Dialog from "@sj-ab/component-library.ui.dialog"
import Typography from "@sj-ab/component-library.ui.typography"

type Props = {
  open: boolean
  src: string
  title: string
  onClose: () => void
}

/**
 * Kvittot i helskärm. Tryck på bilden för att zooma in där du tryckte,
 * dra eller skrolla för att flytta, och tryck igen för att se hela kvittot.
 */
export function ReceiptViewer({ open, src, title, onClose }: Props) {
  const scroller = useRef<HTMLDivElement>(null)
  const [zoomed, setZoomed] = useState(false)
  const headingRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) setZoomed(false)
  }, [open])

  const toggleZoom = (event: React.MouseEvent<HTMLImageElement>) => {
    const box = scroller.current
    if (!box) return
    if (zoomed) {
      setZoomed(false)
      return
    }
    // Zooma in mot punkten man tryckte på, så att det man ville läsa hamnar mitt i bild.
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    setZoomed(true)
    requestAnimationFrame(() => {
      box.scrollTo({
        left: x * box.scrollWidth - box.clientWidth / 2,
        top: y * box.scrollHeight - box.clientHeight / 2,
      })
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      ariaLabel={`Kvittot från ${title}`}
      enteringDirection="up"
      AppBarProps={{
        title,
        headingRef,
        navigationButtons: [{ label: "Stäng", ariaLabel: "Stäng", variant: "close", action: onClose }],
      }}
    >
      <Typography ref={headingRef} variant="h2" component="h2" sx={{ px: 2, pb: 1 }}>
        {title}
      </Typography>
      <Box
        ref={scroller}
        sx={{
          height: "calc(100dvh - 120px)",
          overflow: zoomed ? "auto" : "hidden",
          display: zoomed ? "block" : "grid",
          placeItems: "center",
          px: zoomed ? 0 : 2,
          pb: 2,
        }}
      >
        <motion.img
          key={src}
          src={src}
          alt={`Kvittot från ${title}`}
          onClick={toggleZoom}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: "block",
            cursor: zoomed ? "zoom-out" : "zoom-in",
            ...(zoomed
              ? { width: "200%", maxWidth: "none", height: "auto" }
              : { maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }),
          }}
        />
      </Box>
      <Typography variant="subheadlineRegular" color="text.secondary" sx={{ px: 2, pb: 2, textAlign: "center" }} aria-live="polite">
        {zoomed ? "Tryck för att se hela kvittot" : "Tryck på kvittot för att zooma in"}
      </Typography>
    </Dialog>
  )
}
