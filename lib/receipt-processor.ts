import { generateObject } from "ai"
import { mistral } from "@ai-sdk/mistral"
import { Mistral } from "@mistralai/mistralai"
import { receiptSchema } from "./schema"
import { receiptPrompt } from "./prompt"
import type { Receipt } from "./types"

export class ReceiptProcessor {
  async #processDocument({ documentUrl }: { documentUrl: string }) {
    if (!documentUrl) {
      throw new Error("Document URL is required")
    }

    try {
      console.log("[v0] Starting AI processing with Mistral")
      
      // Check if it's a PDF - use OCR API
      if (documentUrl.startsWith('data:application/pdf')) {
        console.log("[v0] Processing PDF with Mistral OCR API")
        return await this.#processPDF(documentUrl)
      } else {
        console.log("[v0] Processing image with Mistral Vision API")
        return await this.#processImage(documentUrl)
      }
    } catch (error) {
      console.error("[v0] Receipt processing error:", error)

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error("Kvittobearbetning tog för lång tid. Försök igen.")
        }
        if (error.message.includes("API key")) {
          throw new Error("API-nyckel saknas eller är ogiltig. Kontrollera konfigurationen.")
        }
        if (error.message.includes("rate limit")) {
          throw new Error("För många förfrågningar. Vänta en stund och försök igen.")
        }
        if (error.message.includes("network") || error.message.includes("fetch")) {
          throw new Error("Nätverksfel. Kontrollera din internetanslutning och försök igen.")
        }
        if (error.message.includes("401") || error.message.includes("unauthorized")) {
          throw new Error("API-nyckel är ogiltig. Kontrollera din Mistral API-nyckel.")
        }
      }

      throw new Error("Kunde inte bearbeta kvittot. Försök igen eller kontakta support.")
    }
  }

  async #processImage(documentUrl: string) {
    const result = await generateObject({
      model: mistral("mistral-medium-latest"),
      schema: receiptSchema,
      abortSignal: AbortSignal.timeout(30000), // 30 second timeout
      messages: [
        {
          role: "system",
          content: receiptPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "image",
              image: documentUrl,
            },
          ],
        },
      ],
    })

    console.log("[v0] AI processing completed successfully")
    return result.object
  }

  async #processPDF(documentUrl: string) {
    const apiKey = process.env.MISTRAL_API_KEY
    if (!apiKey) {
      throw new Error("MISTRAL_API_KEY environment variable is required")
    }

    const client = new Mistral({ apiKey })
    
    console.log("[v0] Processing PDF with direct base64 OCR...")
    
    // Use direct base64 PDF processing (according to docs)
    const ocrResponse = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: "document_url",
        documentUrl: documentUrl,
      },
      includeImageBase64: false
    })

    // Get the extracted text
    const extractedText = ocrResponse.pages?.map(page => page.markdown).join('\n\n') || ''
    console.log("[v0] OCR extracted text length:", extractedText.length)

    // Use the extracted text with structured generation
    const result = await generateObject({
      model: mistral("mistral-medium-latest"),
      schema: receiptSchema,
      abortSignal: AbortSignal.timeout(30000),
      messages: [
        {
          role: "system",
          content: receiptPrompt,
        },
        {
          role: "user",
          content: `Här är texten extraherad från ett kvitto:\n\n${extractedText}`,
        },
      ],
    })

    console.log("[v0] AI processing completed successfully")
    return result.object
  }

  public async getReceipt(params: { documentUrl: string }): Promise<Receipt> {
    const result = await this.#processDocument(params)

    const categoryMapping: Record<string, Receipt["category"]> = {
      Mat: "Mat",
      Boende: "Boende",
      "Alternativ transport": "Transport",
      "Ej godkänd": "Övrigt",
    }

    return {
      id: crypto.randomUUID(),
      image_url: params.documentUrl,
      type: "expense" as const,
      category: categoryMapping[result.sj_validation.category] || "Övrigt",
      date: result.date,
      amount: result.total_amount,
      currency: result.currency,
      name: result.store_name,
      website: result.website ?? null,
      tax_amount: result.tax_amount ?? null,
      tax_rate: result.tax_rate ?? null,
      tax_type: result.tax_type ?? null,
      language: result.language,
      metadata: {
        register_number: result.register_number ?? null,
        cashier_name: result.cashier_name ?? null,
        email: result.email ?? null,
      },
      sj_approval: {
        status: result.sj_validation.approval_status,
        reason: result.sj_validation.warning_message,
        category_mapped: result.sj_validation.category,
        contains_alcohol: result.sj_validation.contains_alcohol,
        contains_tobacco: result.sj_validation.contains_tobacco,
        is_reimbursable: result.sj_validation.is_reimbursable,
      },
    }
  }
}
