// Ritar exempelkvitton till demon: node scripts/make-sample-receipts.mjs
import sharp from "sharp"

const W = 420
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;")
const row = (l, r = "") => ({ l, r })

async function receipt(file, lines) {
  const lh = 26
  const h = 60 + lines.length * lh + 40
  const text = lines
    .map((ln, i) => {
      const y = 60 + i * lh
      if (ln === "---") return `<line x1="24" x2="${W - 24}" y1="${y - 8}" y2="${y - 8}" stroke="#555" stroke-dasharray="4 4"/>`
      const weight = ln.bold ? "700" : "400"
      const size = ln.big ? 22 : 16
      const left = ln.center
        ? `<text x="${W / 2}" y="${y}" text-anchor="middle" font-size="${size}" font-weight="${weight}">${esc(ln.l)}</text>`
        : `<text x="28" y="${y}" font-size="${size}" font-weight="${weight}">${esc(ln.l)}</text>`
      const right = ln.r ? `<text x="${W - 28}" y="${y}" text-anchor="end" font-size="${size}" font-weight="${weight}">${esc(ln.r)}</text>` : ""
      return left + right
    })
    .join("")
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}">
    <rect width="100%" height="100%" fill="#fbfaf6"/>
    <g font-family="Menlo, Courier New, monospace" fill="#1d1d1b">${text}</g></svg>`
  await sharp(Buffer.from(svg)).rotate(0.6, { background: "#fbfaf6" }).jpeg({ quality: 88 }).toFile(file)
}

const c = (l, o = {}) => ({ l, center: true, ...o })

await receipt("public/exempel/kiosk.jpg", [
  c("STATIONSKIOSKEN", { big: true, bold: true }),
  c("Göteborg Centralstation"),
  c("Org.nr 559900-0001"),
  "---",
  row("2026-10-12", "17:42"),
  row("Kassa 3"),
  "---",
  row("Kaffe stor", "39,00"),
  row("Fralla ost & skinka", "55,00"),
  row("Kanelbulle", "32,00"),
  row("Ramlösa 50 cl", "29,00"),
  row("Mariestads 3,5% 50cl", "34,00"),
  "---",
  { l: "TOTALT SEK", r: "189,00", bold: true },
  row("Moms 12%", "16,71"),
  row("Moms 25%", "6,80"),
  "---",
  row("Kort VISA ************4821"),
  c("Tack för ditt köp!"),
])

await receipt("public/exempel/taxi.jpg", [
  c("VÄSTTAXI", { big: true, bold: true }),
  c("Org.nr 559900-0002"),
  c("Bil 4217  Förare ID 88213"),
  "---",
  row("Datum", "2026-10-12"),
  row("Start", "19:05"),
  row("Slut", "19:58"),
  row("Från", "Göteborg C"),
  row("Till", "Borås Resecentrum"),
  row("Sträcka", "64,2 km"),
  "---",
  row("Fast pris", "1 150,00"),
  { l: "ATT BETALA SEK", r: "1 150,00", bold: true },
  row("Varav moms 6%", "65,09"),
  "---",
  row("Betalt med kort"),
  c("Trevlig resa!"),
])

await receipt("public/exempel/hotell.jpg", [
  c("HOTELL SPÅRET", { big: true, bold: true }),
  c("Spårvägen 1, Göteborg"),
  c("Org.nr 559900-0003"),
  "---",
  row("Ankomst", "2026-10-12"),
  row("Avresa", "2026-10-13"),
  row("Rum 412, 1 natt"),
  "---",
  row("Logi enkelrum", "1 290,00"),
  row("Frukost ingår", "0,00"),
  row("Minibar vin 18,7 cl", "95,00"),
  "---",
  { l: "TOTALT SEK", r: "1 385,00", bold: true },
  row("Moms 12%", "138,21"),
  row("Moms 25%", "19,00"),
  "---",
  c("Välkommen åter!"),
])
console.log("klart")
