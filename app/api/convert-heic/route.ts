import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { base64Data, filename } = await request.json()

    if (!base64Data) {
      return NextResponse.json({ error: "Base64 data is required" }, { status: 400 })
    }

    // Dynamic import to handle server-side HEIC conversion
    const convert = (await import("heic-convert")).default
    const sharp = (await import("sharp")).default

    // Extract base64 content (remove data URL prefix if present)
    const base64Content = base64Data.includes(",")
      ? base64Data.split(",")[1]
      : base64Data

    // Convert base64 to buffer
    const inputBuffer = Buffer.from(base64Content, "base64")

    console.log(`[HEIC] Converting ${filename || "image"}, input size: ${inputBuffer.length} bytes`)

    // Convert HEIC to JPEG
    const outputBuffer = await convert({
      buffer: inputBuffer,
      format: "JPEG",
      quality: 0.92,
    })

    // Resize and compress with sharp
    const processedBuffer = await sharp(Buffer.from(outputBuffer))
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 92 })
      .toBuffer()

    console.log(`[HEIC] Conversion complete, output size: ${processedBuffer.length} bytes`)

    // Return as base64 data URL
    const outputBase64 = `data:image/jpeg;base64,${processedBuffer.toString("base64")}`

    return NextResponse.json({
      success: true,
      data: outputBase64,
      originalSize: inputBuffer.length,
      convertedSize: processedBuffer.length,
    })
  } catch (error) {
    console.error("[HEIC] Conversion error:", error)

    const errorMessage = error instanceof Error ? error.message : "HEIC-konvertering misslyckades"

    return NextResponse.json(
      {
        error: errorMessage,
        success: false,
      },
      { status: 500 }
    )
  }
}
