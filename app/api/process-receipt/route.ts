import Anthropic from "@anthropic-ai/sdk"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { type NextRequest, NextResponse } from "next/server"
import { extractedReceiptSchema } from "@/lib/receipt-schema"

export const runtime = "nodejs"
export const maxDuration = 60

const MODEL = "claude-sonnet-5-5"

const SYSTEM_PROMPT = `Du läser kvitton åt SJ:s tjänst för ersättning vid försening.
Resenären har haft egna utlägg när tåget var försenat och vill få tillbaka pengarna.

Läs av kvittot exakt som det står. Gissa inte belopp. Radernas summa ska stämma med totalen så långt kvittot tillåter.
Klassa varje rad:
- mat_dryck: mat, fika, läsk, kaffe, vatten
- alkohol: öl, vin, cider, sprit, alkoholhaltiga drinkar (även lättöl över 2,25 %)
- tobak: cigaretter, snus, tobak
- boende: hotellnatt, frukost som ingår i rummet
- transport: taxi, buss, hyrbil, parkering i samband med resan
- ovrigt: tidningar, kläder, presenter och annat som inte hör till resan

Välj kvittots kategori efter vad det mesta gäller. Skriv sammanfattningen kort och vänligt, som SJ: du-form, aktiv röst, inga tankstreck.`

const client = new Anthropic()

const ACCEPTED = /^data:(image\/(png|jpeg|gif|webp)|application\/pdf);base64,/

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Tjänsten saknar API-nyckel." }, { status: 503 })
  }

  const { documentUrl } = (await request.json().catch(() => ({}))) as { documentUrl?: string }
  const match = documentUrl?.match(ACCEPTED)
  if (!documentUrl || !match) {
    return NextResponse.json({ error: "Ladda upp en bild (JPG, PNG, WebP) eller en PDF." }, { status: 400 })
  }

  const mediaType = match[1]
  const data = documentUrl.slice(match[0].length)
  const file: Anthropic.ContentBlockParam =
    mediaType === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
      : {
          type: "image",
          source: { type: "base64", media_type: mediaType as "image/png" | "image/jpeg" | "image/gif" | "image/webp", data },
        }

  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      output_config: { format: zodOutputFormat(extractedReceiptSchema), effort: "low" },
      messages: [{ role: "user", content: [file, { type: "text", text: "Läs av kvittot." }] }],
    })

    const receipt = response.parsed_output
    if (!receipt) {
      return NextResponse.json({ error: "Vi kunde inte läsa kvittot. Prova en skarpare bild." }, { status: 422 })
    }
    if (!receipt.is_receipt) {
      return NextResponse.json({ error: "Det här ser inte ut som ett kvitto." }, { status: 422 })
    }
    return NextResponse.json({ receipt, model: MODEL })
  } catch (error) {
    console.error("[process-receipt]", error)
    if (error instanceof Anthropic.RateLimitError || error instanceof Anthropic.InternalServerError) {
      return NextResponse.json({ error: "Det är hög belastning just nu. Försök igen om en stund." }, { status: 503 })
    }
    return NextResponse.json({ error: "Något gick fel när vi läste kvittot. Försök igen." }, { status: 500 })
  }
}
