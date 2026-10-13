import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter"
import { Analytics } from "@vercel/analytics/next"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "Ersättning vid försening",
  description: "Fotografera kvittona från en försenad resa och se direkt vad du kan få tillbaka.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sv">
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
        <Analytics />
      </body>
    </html>
  )
}
