"use client"

import { useEffect, useMemo, type ReactNode } from "react"
import { CssBaseline, ThemeProvider, createTheme, useMediaQuery } from "@mui/material"
import { generateThemeOptions } from "@sj-ab/component-library.styles.themes"

/** SJ:s tema. Följer systemets ljusa/mörka läge och högkontrast. */
export function Providers({ children }: { children: ReactNode }) {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)", { noSsr: true })
  const moreContrast = useMediaQuery("(prefers-contrast: more)", { noSsr: true })
  const mode = prefersDark ? "dark" : "light"

  const theme = useMemo(() => createTheme(generateThemeOptions(mode, moreContrast)), [mode, moreContrast])

  useEffect(() => {
    document.documentElement.style.colorScheme = mode
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", theme.palette.background.default)
  }, [mode, theme])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
