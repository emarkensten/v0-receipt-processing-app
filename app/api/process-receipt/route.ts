import { type NextRequest, NextResponse } from "next/server"
import { ReceiptProcessor } from "@/lib/receipt-processor"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] API route called")
    const { documentUrl } = await request.json()
    console.log("[v0] Document URL received:", documentUrl ? "present" : "missing")

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
