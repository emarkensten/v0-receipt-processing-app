import { DocumentAnalysisClient, AzureKeyCredential } from '@azure/ai-form-recognizer';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ParsedReceiptItem {
  name: string;
  price: number;
  quantity: number;
  is_alcohol?: boolean;
  is_tobacco?: boolean;
}

export interface ParsedReceipt {
  store_name: string;
  total_amount: number;
  currency: string;
  date: string;
  tax_amount?: number | null;
  tax_rate?: number | null;
  tax_type?: string | null;
  language: string;
  website?: string | null;
  email?: string | null;
  register_number?: string | null;
  cashier_name?: string | null;
  items?: ParsedReceiptItem[];
  ocr_source: 'azure' | 'gemini';
  ocr_confidence: number;
}

export function validateConfig(): { valid: boolean; availableProviders: string[]; errors: string[] } {
  const providers: string[] = [];
  const errors: string[] = [];

  if (process.env.AZURE_FORM_RECOGNIZER_ENDPOINT && process.env.AZURE_FORM_RECOGNIZER_KEY) {
    providers.push('azure');
  }

  if (process.env.GEMINI_API_KEY) {
    providers.push('gemini');
  }

  return {
    valid: providers.length > 0,
    availableProviders: providers,
    errors,
  };
}

/**
 * Validate item quality from Azure OCR
 * Returns true if items look suspicious and we should use Gemini instead
 */
function validateItems(
  items: Array<{ name: string; price: number; quantity: number }>,
  total?: number
): boolean {
  if (items.length === 0) {
    return true;
  }

  let suspiciousCount = 0;

  for (const item of items) {
    if (item.quantity > 8) suspiciousCount++;
    if (item.price > 0 && item.price < 0.5) suspiciousCount++;
    if (item.price > 2000) suspiciousCount++;
    if (!item.name || item.price === 0) suspiciousCount++;
  }

  if (suspiciousCount > items.length * 0.3) {
    return true;
  }

  if (total && total > 0) {
    const itemsTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const difference = Math.abs(itemsTotal - total);
    const percentDiff = (difference / total) * 100;
    if (percentDiff > 5) {
      console.log(`[OCR] Items sum (${itemsTotal.toFixed(2)}) differs from total (${total.toFixed(2)}) by ${percentDiff.toFixed(1)}%`);
      return true;
    }
  }

  return false;
}

/**
 * Main entry point: Parse receipt with Azure + Gemini hybrid approach
 */
export async function parseReceipt(imageBuffer: Buffer): Promise<ParsedReceipt> {
  const azureConfigured = process.env.AZURE_FORM_RECOGNIZER_ENDPOINT && process.env.AZURE_FORM_RECOGNIZER_KEY;
  const geminiConfigured = process.env.GEMINI_API_KEY;

  if (!azureConfigured && !geminiConfigured) {
    throw new Error('Varken Azure eller Gemini är konfigurerat. Lägg till API-nycklar.');
  }

  console.log(`[OCR] Available: Azure=${!!azureConfigured}, Gemini=${!!geminiConfigured}`);

  // Try Azure first if configured
  if (azureConfigured) {
    try {
      const azureResult = await parseWithAzure(imageBuffer);

      const hasLowConfidence = azureResult.ocr_confidence < 0.95;
      const hasSuspiciousItems = validateItems(azureResult.items || [], azureResult.total_amount);
      const hasMissingMerchant = !azureResult.store_name || azureResult.store_name === 'Okänd butik';

      if (hasLowConfidence) {
        console.log(`[OCR] Low Azure confidence (${azureResult.ocr_confidence.toFixed(2)}), trying Gemini`);
      } else if (hasSuspiciousItems) {
        console.log(`[OCR] Azure extracted suspicious items, trying Gemini`);
      } else if (hasMissingMerchant) {
        console.log(`[OCR] Azure missing merchant info, trying Gemini`);
      } else {
        console.log(`[OCR] Azure accepted (confidence: ${azureResult.ocr_confidence.toFixed(2)})`);
        // Always classify items with Gemini for alcohol/tobacco detection
        if (geminiConfigured && azureResult.items && azureResult.items.length > 0) {
          try {
            const classifiedItems = await classifyItemsWithGemini(azureResult.items);
            azureResult.items = classifiedItems;
            console.log(`[OCR] Items classified with Gemini AI`);
          } catch (classifyError) {
            console.log('[OCR] Gemini classification failed, using unclassified items');
          }
        }
        return azureResult;
      }

      // Try Gemini but merge Azure items if Gemini has fewer
      if (geminiConfigured) {
        try {
          const geminiResult = await parseWithGemini(imageBuffer);

          // Keep Azure items if they're better
          if (azureResult.items && azureResult.items.length > 0) {
            if (!geminiResult.items || geminiResult.items.length < azureResult.items.length) {
              console.log(`[OCR] Using Azure items (${azureResult.items.length}) with Gemini data`);
              geminiResult.items = azureResult.items;
            }
          }

          return geminiResult;
        } catch (geminiError) {
          console.log('[OCR] Gemini failed, using Azure result anyway');
          return azureResult;
        }
      }

      return azureResult;
    } catch (error) {
      console.error('[OCR] Azure error:', error instanceof Error ? error.message : error);
      console.log('[OCR] Azure failed, trying Gemini');
    }
  }

  // Fallback to Gemini
  if (geminiConfigured) {
    const geminiResult = await parseWithGemini(imageBuffer);
    console.log(`[OCR] Gemini accepted (confidence: ${geminiResult.ocr_confidence.toFixed(2)})`);
    return geminiResult;
  }

  throw new Error('Alla OCR-metoder misslyckades');
}

/**
 * Parse receipt using Azure Document Intelligence
 */
async function parseWithAzure(imageBuffer: Buffer): Promise<ParsedReceipt> {
  const endpoint = process.env.AZURE_FORM_RECOGNIZER_ENDPOINT!;
  const key = process.env.AZURE_FORM_RECOGNIZER_KEY!;

  console.log('[OCR] Attempting Azure...');
  const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(key));

  const poller = await client.beginAnalyzeDocument('prebuilt-receipt', imageBuffer);
  const result = await poller.pollUntilDone();

  const receipt = result.documents?.[0];
  if (!receipt) {
    throw new Error('No receipt found in image');
  }

  // Extract items
  const itemsField = receipt.fields?.['Items'];
  let itemsArray: any[] = [];

  if (itemsField) {
    if ('values' in itemsField && Array.isArray(itemsField.values)) {
      itemsArray = itemsField.values;
    } else if ('value' in itemsField && Array.isArray(itemsField.value)) {
      itemsArray = itemsField.value;
    }
  }

  const items = extractAzureItems(itemsArray);

  // Extract merchant
  const merchantNameField = receipt.fields?.['MerchantName'];
  const storeName = merchantNameField && 'value' in merchantNameField
    ? String(merchantNameField.value)
    : 'Okänd butik';

  // Extract total
  const totalField = receipt.fields?.['Total'];
  const totalAmount = totalField && 'value' in totalField
    ? Number(totalField.value)
    : 0;

  // Extract date
  const dateField = receipt.fields?.['TransactionDate'];
  let date = new Date().toISOString().split('T')[0];
  if (dateField && 'value' in dateField && dateField.value) {
    const d = dateField.value as Date;
    date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  console.log(`[OCR] Azure: ${storeName}, ${totalAmount} SEK, ${items.length} items`);

  return {
    store_name: storeName || 'Okänd butik',
    total_amount: totalAmount,
    currency: 'SEK',
    date,
    language: 'sv',
    items,
    ocr_source: 'azure',
    ocr_confidence: receipt.confidence || 0.8,
  };
}

/**
 * Classify items for alcohol/tobacco using Gemini AI
 */
async function classifyItemsWithGemini(items: ParsedReceiptItem[]): Promise<ParsedReceiptItem[]> {
  const apiKey = process.env.GEMINI_API_KEY!;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  const itemNames = items.map(item => item.name);

  const prompt = `Klassificera dessa produkter från ett kvitto. Returnera ENDAST valid JSON array:

Produkter: ${JSON.stringify(itemNames)}

Returnera en array med objekt för varje produkt:
[
  {"name": "produktnamn", "is_alcohol": true/false, "is_tobacco": true/false}
]

VIKTIGT:
- is_alcohol: true för öl, vin, sprit, cider, cava, champagne, prosecco, cocktails, drinkar, seltzer med alkohol, sangria, punch, glögg med alkohol, sake, likör, aperitif, digestif, starköl, lager, ale, IPA, och ALLA alkoholhaltiga drycker oavsett varumärke (t.ex. "Norrlands Guld", "Omaka Suntrip", "Stor Stark" är alkohol)
- is_tobacco: true för cigaretter, snus, tobak, vape, e-cigaretter
- ENDAST JSON array, ingen markdown`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  const cleanedText = responseText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  const classifications = JSON.parse(cleanedText);

  // Merge classifications back into items
  return items.map((item, index) => {
    const classification = classifications[index] || {};
    return {
      ...item,
      is_alcohol: classification.is_alcohol || false,
      is_tobacco: classification.is_tobacco || false,
    };
  });
}

/**
 * Parse receipt using Google Gemini
 */
async function parseWithGemini(imageBuffer: Buffer): Promise<ParsedReceipt> {
  const apiKey = process.env.GEMINI_API_KEY!;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  console.log('[OCR] Attempting Gemini...');

  const prompt = `Analysera detta kvitto (svenskt eller engelskt). Returnera ENDAST valid JSON:

{
  "store_name": "restaurangnamn eller butiksnamn",
  "total_amount": 450.00,
  "date": "2024-01-15",
  "items": [
    {
      "name": "varans namn",
      "price": 125.00,
      "quantity": 1,
      "is_alcohol": false,
      "is_tobacco": false
    }
  ],
  "confidence": 0.95
}

VIKTIGT:
1. Extrahera ALLA varor
2. is_alcohol: true för öl, vin, sprit, cider, cava, champagne, prosecco, cocktails, drinkar, seltzer med alkohol, sangria, punch, glögg med alkohol, sake, likör, aperitif, digestif, och ALLA alkoholhaltiga drycker oavsett varumärke
3. is_tobacco: true för cigaretter, snus, tobak, vape, e-cigaretter
4. Priser som nummer med decimaler (svenskt komma "2,90" → 2.9)
5. Date i YYYY-MM-DD format
6. ENDAST JSON, ingen markdown`;

  const mimeType = detectImageMimeType(imageBuffer);

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType,
      },
    },
  ]);

  const responseText = result.response.text();
  const cleanedText = responseText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  const json = JSON.parse(cleanedText);

  console.log(`[OCR] Gemini: ${json.store_name}, ${json.total_amount} SEK, ${json.items?.length || 0} items`);

  return {
    store_name: json.store_name || 'Okänd butik',
    total_amount: Number(json.total_amount) || 0,
    currency: 'SEK',
    date: json.date || new Date().toISOString().split('T')[0],
    language: 'sv',
    items: json.items?.map((item: any) => ({
      name: item.name || 'Unknown',
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      is_alcohol: item.is_alcohol || false,
      is_tobacco: item.is_tobacco || false,
    })),
    ocr_source: 'gemini',
    ocr_confidence: json.confidence || 0.85,
  };
}

/**
 * Extract items from Azure receipt response
 */
function extractAzureItems(items: any[]): ParsedReceiptItem[] {
  if (!Array.isArray(items)) return [];

  return items
    .map((item: any) => {
      const props = item.properties || {};
      const description = props.Description?.value || props.Description?.content;
      const quantity = Number(props.Quantity?.value || 1);
      const totalPrice = Number(props.TotalPrice?.value || 0);
      const unitPrice = Number(props.Price?.value || 0);

      let price = unitPrice;
      if (!price && totalPrice && quantity > 0) {
        price = totalPrice / quantity;
      } else if (!price) {
        price = totalPrice;
      }

      if (!description && !price) return null;

      return {
        name: String(description || 'Unknown Item'),
        price,
        quantity,
      };
    })
    .filter((item): item is ParsedReceiptItem => item !== null);
}

/**
 * Detect image MIME type from buffer
 */
function detectImageMimeType(buffer: Buffer): string {
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }
  if (buffer.length >= 12 && buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
    return 'image/heic';
  }
  return 'image/jpeg';
}
