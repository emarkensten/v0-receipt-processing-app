import { type NextRequest, NextResponse } from "next/server"
import { ReceiptProcessor } from "@/lib/receipt-processor"
import { validateConfig } from "@/lib/ocr/hybrid-receipt-parser"

export async function POST(request: NextRequest) {
  // Validate config at request time (not cached)
  const configValidation = validateConfig()

  try {
    // Check if any OCR provider is configured
    if (!configValidation.valid) {
      console.error("[API] No OCR providers configured:", configValidation.errors)
      return NextResponse.json(
        {
          error: "Ingen OCR-tjänst är konfigurerad. Kontrollera miljövariabler.",
          details: configValidation.errors,
          success: false,
        },
        { status: 503 }
      )
    }

    const { documentUrl } = await request.json()

    // Validate document URL
    if (!documentUrl) {
      return NextResponse.json({ error: "Document URL is required" }, { status: 400 })
    }

    // Ensure proper format
    if (!documentUrl.startsWith("data:") && !documentUrl.startsWith("https://")) {
      return NextResponse.json({ error: "Invalid document format" }, { status: 400 })
    }

    // Ensure it's a supported format (images or PDF)
    if (
      documentUrl.startsWith("data:") &&
      !documentUrl.match(/^data:(image\/(png|jpeg|jpg|gif|webp|heic|heif)|application\/pdf);base64,/)
    ) {
      return NextResponse.json(
        {
          error: "Endast bildfiler (PNG, JPG, JPEG, GIF, WebP, HEIC) och PDF-filer stöds.",
        },
        { status: 400 }
      )
    }

    console.log(`[API] Processing receipt with providers: ${configValidation.availableProviders.join(", ")}`)

    const processor = new ReceiptProcessor()
    const result = await processor.getReceipt({ documentUrl })

    // Include OCR metadata in response
    return NextResponse.json({
      ...result,
      _meta: {
        ocr_source: result.ocr_source,
        ocr_confidence: result.ocr_confidence,
        available_providers: configValidation.availableProviders,
      },
    })
  } catch (error) {
    console.error("[API] Receipt processing error:", error)

    const errorMessage = error instanceof Error ? error.message : "Ett oväntat fel inträffade"

    // Determine appropriate status code
    let statusCode = 500
    if (errorMessage.includes("API-nyckel") || errorMessage.includes("API key")) {
      statusCode = 401
    } else if (errorMessage.includes("rate limit")) {
      statusCode = 429
    } else if (errorMessage.includes("timeout") || errorMessage.includes("tog för lång tid")) {
      statusCode = 504
    }

    return NextResponse.json(
      {
        error: errorMessage,
        success: false,
        available_providers: configValidation.availableProviders,
      },
      {
        status: statusCode,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  }
}
