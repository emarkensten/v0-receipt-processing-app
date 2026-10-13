"use client"

import dynamic from "next/dynamic"

// Appen renderas bara i webbläsaren. Då väljs SJ:s ljusa eller mörka tema direkt
// efter systemets läge, utan att serverns HTML och klientens första rendering skiljer sig.
const App = dynamic(() => import("@/components/App").then((m) => m.App), { ssr: false })

export default function Page() {
  return <App />
}
