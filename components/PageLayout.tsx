"use client"

import { useRef, type ReactNode } from "react"
import { Box, GlobalStyles } from "@mui/material"
import AppBar from "@sj-ab/component-library.ui.app-bar"
import BottomBarContainer from "@sj-ab/component-library.ui.bottom-bar-container"
import Stack from "@sj-ab/component-library.ui.stack"
import Typography from "@sj-ab/component-library.ui.typography"

type Props = {
  title: string
  intro?: ReactNode
  onBack?: () => void
  /** Huvudhandlingen, fast i nederkant. */
  bottomBar?: ReactNode
  children?: ReactNode
}

/** SJ:s layoutregioner: App Bar, Body och en fast Bottom Bar. Innehållet står direkt på sidan. */
export function PageLayout({ title, intro, onBack, bottomBar, children }: Props) {
  const headingRef = useRef<HTMLDivElement>(null)

  return (
    <>
      {onBack ? (
        <AppBar
          title={title}
          headingRef={headingRef}
          navigationButtons={[{ label: "Tillbaka", variant: "back", action: onBack }]}
        />
      ) : (
        <AppBar title={title} headingRef={headingRef} />
      )}
      <Box component="main" sx={{ maxWidth: 600, mx: "auto", px: 2, pt: 3, pb: bottomBar ? 18 : 6 }}>
        <Stack useFlexGap spacing={4}>
          <Stack useFlexGap spacing={1}>
            <Typography ref={headingRef} variant="h1">
              {title}
            </Typography>
            {intro && (
              <Typography variant="bodyRegular" color="text.secondary">
                {intro}
              </Typography>
            )}
          </Stack>
          {children}
        </Stack>
      </Box>
      {bottomBar && (
        <>
          <GlobalStyles styles={(theme) => ({ html: { scrollPaddingBottom: theme.spacing(18) } })} />
          <BottomBarContainer position="fixed" elevated sx={{ zIndex: "appBar", bgcolor: "background.default", px: 2, pt: 2, pb: "max(16px, env(safe-area-inset-bottom))" }}>
            <Box sx={{ maxWidth: 600, mx: "auto" }}>{bottomBar}</Box>
          </BottomBarContainer>
        </>
      )}
    </>
  )
}
