import { type NextRequest, NextResponse } from "next/server"
import { ReceiptProcessor } from "@/lib/receipt-processor"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] API route called")
    const { documentUrl } = await request.json()
    console.log("[v0] Document URL received:", documentUrl ? "present" : "missing")
    
    if (documentUrl) {
      console.log("[v0] Document URL format:", documentUrl.substring(0, 50) + "...")
      
      // Ensure proper format for Mistral API
      if (!documentUrl.startsWith('data:') && !documentUrl.startsWith('https://')) {
        console.log("[v0] Invalid document format, needs data: or https: prefix")
        return NextResponse.json({ error: "Invalid document format" }, { status: 400 })
      }
      
      // Ensure it's a supported format (images or PDF)
      if (documentUrl.startsWith('data:') && !documentUrl.match(/^data:(image\/(png|jpeg|jpg|gif|webp)|application\/pdf);base64,/)) {
        console.log("[v0] Unsupported file format")
        return NextResponse.json({ 
          error: "Endast bildfiler (PNG, JPG, JPEG, GIF, WebP) och PDF-filer stöds." 
        }, { status: 400 })
      }
    }

    if (!documentUrl) {
      console.log("[v0] Missing document URL")
      return NextResponse.json({ error: "Document URL is required" }, { status: 400 })
    }

    const processor = new ReceiptProcessor()
    console.log("[v0] Starting receipt processing")
    const result = await processor.getReceipt({ documentUrl })
    console.log("[v0] Receipt processing completed successfully")

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Receipt processing error:", error)

    const errorMessage = error instanceof Error ? error.message : "Ett oväntat fel inträffade"
    console.log("[v0] Returning error response:", errorMessage)

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
