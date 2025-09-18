import { type NextRequest, NextResponse } from "next/server"
import { ReceiptProcessor } from "@/lib/receipt-processor"

export async function POST(request: NextRequest) {
  try {
    const { documentUrl } = await request.json()
      
    // Validate document URL
    if (!documentUrl) {
      return NextResponse.json({ error: "Document URL is required" }, { status: 400 })
    }
    
    // Ensure proper format for Mistral API
    if (!documentUrl.startsWith('data:') && !documentUrl.startsWith('https://')) {
      return NextResponse.json({ error: "Invalid document format" }, { status: 400 })
    }
    
      // Ensure it's a supported format (images or PDF)
      if (documentUrl.startsWith('data:') && !documentUrl.match(/^data:(image\/(png|jpeg|jpg|gif|webp|heic|heif)|application\/pdf);base64,/)) {
        return NextResponse.json({ 
          error: "Endast bildfiler (PNG, JPG, JPEG, GIF, WebP, HEIC) och PDF-filer stöds." 
        }, { status: 400 })
      }

    const processor = new ReceiptProcessor()
    const result = await processor.getReceipt({ documentUrl })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Receipt processing error:", error)

    const errorMessage = error instanceof Error ? error.message : "Ett oväntat fel inträffade"

    return NextResponse.json(
      {
        error: errorMessage,
        success: false,
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
