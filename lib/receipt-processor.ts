import { generateObject } from "ai"
import { mistral } from "@ai-sdk/mistral"
import { Mistral } from "@mistralai/mistralai"
import { parseReceipt, validateConfig, type ParsedReceipt } from "./ocr/hybrid-receipt-parser"
import { receiptSchema } from "./schema"
import { receiptPrompt } from "./prompt"
import type { Receipt, ReceiptItem } from "./types"

export class ReceiptProcessor {
  async #processDocument({ documentUrl }: { documentUrl: string }) {
    if (!documentUrl) {
      throw new Error("Document URL is required")
    }

    try {
      // Check if it's a PDF - use Mistral OCR API
      if (documentUrl.startsWith("data:application/pdf")) {
        return await this.#processPDF(documentUrl)
      } else {
        // Use hybrid OCR for images
        return await this.#processImageWithHybridOCR(documentUrl)
      }
    } catch (error) {
      console.error("[v0] Receipt processing error:", error)

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error("Kvittobearbetning tog för lång tid. Försök igen.")
        }
        if (error.message.includes("API key") || error.message.includes("API-nyckel")) {
          throw new Error("API-nyckel saknas eller är ogiltig. Kontrollera konfigurationen.")
        }
        if (error.message.includes("rate limit")) {
          throw new Error("För många förfrågningar. Vänta en stund och försök igen.")
        }
        if (error.message.includes("network") || error.message.includes("fetch")) {
          throw new Error("Nätverksfel. Kontrollera din internetanslutning och försök igen.")
        }
        if (error.message.includes("401") || error.message.includes("unauthorized")) {
          throw new Error("API-nyckel är ogiltig. Kontrollera dina API-nycklar.")
        }
        // Pass through OCR-specific errors
        if (error.message.includes("OCR") || error.message.includes("Alla OCR")) {
          throw error
        }
      }

      throw new Error("Kunde inte bearbeta kvittot. Försök igen eller kontakta support.")
    }
  }

  async #processImageWithHybridOCR(documentUrl: string): Promise<any> {
    // Convert base64 to buffer
    const base64Content = documentUrl.includes(",")
      ? documentUrl.split(",")[1]
      : documentUrl
    const imageBuffer = Buffer.from(base64Content, "base64")

    // Use hybrid OCR parser
    const ocrResult = await parseReceipt(imageBuffer)

    console.log(`[v0] OCR result from ${ocrResult.ocr_source} (confidence: ${(ocrResult.ocr_confidence * 100).toFixed(1)}%)`)

    // Now use LLM to validate and add SJ-specific categorization
    return await this.#addSJValidation(ocrResult, documentUrl)
  }

  async #addSJValidation(ocrResult: ParsedReceipt, documentUrl: string) {
    // Use Mistral to add SJ validation on top of OCR results
    const validation = validateConfig()

    // If we have Mistral available, use it for SJ validation
    if (validation.availableProviders.includes("mistral") && process.env.MISTRAL_API_KEY) {
      try {
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
              content: [
                {
                  type: "image",
                  image: documentUrl,
                },
              ],
            },
          ],
        })

        // Merge OCR data with SJ validation
        return {
          ...result.object,
          store_name: ocrResult.store_name || result.object.store_name,
          total_amount: ocrResult.total_amount || result.object.total_amount,
          date: ocrResult.date || result.object.date,
          items: ocrResult.items || result.object.items,
          ocr_source: ocrResult.ocr_source,
          ocr_confidence: ocrResult.ocr_confidence,
        }
      } catch (error) {
        console.warn("[v0] Mistral validation failed, using default SJ validation")
      }
    }

    // Fallback: Create default SJ validation based on OCR result
    return this.#createDefaultSJValidation(ocrResult)
  }

  #createDefaultSJValidation(ocrResult: ParsedReceipt) {
    // Simple heuristics for SJ validation
    const storeName = ocrResult.store_name.toLowerCase()

    console.log(`[SJ Validation] Store: ${ocrResult.store_name}`)
    console.log(`[SJ Validation] Items count: ${ocrResult.items?.length || 0}`)
    if (ocrResult.items) {
      console.log(`[SJ Validation] Items:`, ocrResult.items.map(i => i.name).join(", "))
    }

    // Determine category based on store name
    let category: "Mat" | "Boende" | "Alternativ transport" | "Ej godkänd" = "Mat"
    if (
      storeName.includes("hotel") ||
      storeName.includes("hotell") ||
      storeName.includes("scandic") ||
      storeName.includes("best western") ||
      storeName.includes("clarion")
    ) {
      category = "Boende"
    } else if (
      storeName.includes("taxi") ||
      storeName.includes("uber") ||
      storeName.includes("bolt") ||
      storeName.includes("hyrbil") ||
      storeName.includes("hertz") ||
      storeName.includes("europcar")
    ) {
      category = "Alternativ transport"
    } else if (
      storeName.includes("h&m") ||
      storeName.includes("åhléns") ||
      storeName.includes("stadium") ||
      storeName.includes("elgiganten")
    ) {
      category = "Ej godkänd"
    }

    // Alcohol keywords (Swedish and English)
    const alcoholKeywords = [
      "öl", "beer", "lager", "ale", "ipa", "pilsner", "stout",
      "vin", "wine", "rött", "vitt", "rosé", "bubbel", "champagne", "prosecco",
      "sprit", "spirits", "whisky", "whiskey", "vodka", "gin", "rom", "rum", "cognac", "brandy",
      "cider", "drink", "cocktail", "grogg", "drinkar",
      "alkohol", "alc", "stark", "systembolaget",
      "margarita", "mojito", "daiquiri", "negroni", "aperol"
    ]

    // Tobacco keywords (Swedish and English)
    const tobaccoKeywords = [
      "cigarr", "cigar", "cigarett", "cigarette",
      "snus", "tobak", "tobacco", "nikotin", "nicotine",
      "röka", "smoke", "vape", "e-cig"
    ]

    // Check for alcohol/tobacco in items
    let containsAlcohol = false
    let containsTobacco = false

    if (ocrResult.items && ocrResult.items.length > 0) {
      for (const item of ocrResult.items) {
        const itemName = item.name.toLowerCase()

        // Check alcohol
        for (const keyword of alcoholKeywords) {
          if (itemName.includes(keyword)) {
            console.log(`[SJ Validation] Alcohol detected: "${item.name}" matches "${keyword}"`)
            containsAlcohol = true
            break
          }
        }

        // Check tobacco
        for (const keyword of tobaccoKeywords) {
          if (itemName.includes(keyword)) {
            console.log(`[SJ Validation] Tobacco detected: "${item.name}" matches "${keyword}"`)
            containsTobacco = true
            break
          }
        }
      }
    } else {
      console.log("[SJ Validation] No items to check for alcohol/tobacco")
    }

    console.log(`[SJ Validation] Result: alcohol=${containsAlcohol}, tobacco=${containsTobacco}`)

    const isReimbursable = category !== "Ej godkänd" && !containsAlcohol && !containsTobacco
    const approvalStatus = isReimbursable
      ? "approved"
      : containsAlcohol || containsTobacco
      ? "rejected"
      : category === "Ej godkänd"
      ? "rejected"
      : "warning"

    let warningMessage = null
    if (containsAlcohol) {
      warningMessage = "Kvittot innehåller alkohol som ej ersätts"
    } else if (containsTobacco) {
      warningMessage = "Kvittot innehåller tobak som ej ersätts"
    } else if (category === "Ej godkänd") {
      warningMessage = "Denna typ av utgift ersätts ej av SJ"
    }

    return {
      store_name: ocrResult.store_name,
      total_amount: ocrResult.total_amount,
      currency: ocrResult.currency,
      date: ocrResult.date,
      tax_amount: ocrResult.tax_amount,
      tax_rate: ocrResult.tax_rate,
      tax_type: ocrResult.tax_type,
      language: ocrResult.language,
      website: ocrResult.website,
      email: ocrResult.email,
      register_number: ocrResult.register_number,
      cashier_name: ocrResult.cashier_name,
      items: ocrResult.items,
      sj_validation: {
        category,
        is_reimbursable: isReimbursable,
        contains_alcohol: containsAlcohol,
        contains_tobacco: containsTobacco,
        warning_message: warningMessage,
        approval_status: approvalStatus,
      },
      ocr_source: ocrResult.ocr_source,
      ocr_confidence: ocrResult.ocr_confidence,
    }
  }

  async #processPDF(documentUrl: string) {
    const apiKey = process.env.MISTRAL_API_KEY
    if (!apiKey) {
      throw new Error("MISTRAL_API_KEY krävs för PDF-bearbetning")
    }

    const client = new Mistral({ apiKey })

    // Use direct base64 PDF processing
    const ocrResponse = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: "document_url",
        documentUrl: documentUrl,
      },
      includeImageBase64: false,
    })

    // Get the extracted text
    const extractedText = ocrResponse.pages?.map((page) => page.markdown).join("\n\n") || ""

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

    return result.object
  }

  public async getReceipt(params: { documentUrl: string }): Promise<Receipt & { ocr_source?: string; ocr_confidence?: number }> {
    const result = await this.#processDocument(params)

    const categoryMapping: Record<string, Receipt["category"]> = {
      Mat: "Mat",
      Boende: "Boende",
      "Alternativ transport": "Transport",
      "Ej godkänd": "Övrigt",
    }

    // Process items with alcohol/tobacco flags from AI classification
    const processedItems: ReceiptItem[] = (result.items || []).map((item: { name: string; price: number; quantity?: number; is_alcohol?: boolean; is_tobacco?: boolean }, index: number) => {
      const itemIsAlcohol = item.is_alcohol || false
      const itemIsTobacco = item.is_tobacco || false

      return {
        id: `item-${index}-${crypto.randomUUID().slice(0, 8)}`,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        selected: !itemIsAlcohol && !itemIsTobacco, // Auto-deselect alcohol/tobacco
        isAlcohol: itemIsAlcohol,
        isTobacco: itemIsTobacco,
      }
    })

    // Calculate selected total
    const selectedTotal = processedItems
      .filter(item => item.selected)
      .reduce((sum, item) => sum + item.price * item.quantity, 0)

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
      items: processedItems,
      selectedTotal,
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
      ocr_source: result.ocr_source,
      ocr_confidence: result.ocr_confidence,
    }
  }
}
