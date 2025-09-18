import { z } from "zod"

export const sjValidationSchema = z.object({
  category: z.enum(["Mat", "Boende", "Alternativ transport", "Ej godkänd"]).describe("SJ category mapping"),
  is_reimbursable: z.boolean().describe("Whether this expense is reimbursable according to SJ rules"),
  contains_alcohol: z.boolean().describe("Whether the receipt contains alcohol purchases"),
  contains_tobacco: z.boolean().describe("Whether the receipt contains tobacco purchases"),
  warning_message: z.string().nullable().optional().describe("Warning message if there are issues"),
  approval_status: z.enum(["approved", "rejected", "warning"]).describe("Approval status based on SJ rules"),
})

export const receiptSchema = z.object({
  store_name: z.string().describe("Name of the store or merchant"),
  total_amount: z.number().describe("Total amount on the receipt"),
  currency: z.string().describe("Currency code (e.g., SEK, EUR, USD)"),
  date: z.string().describe("Date of the transaction in ISO format"),
  tax_amount: z.number().nullable().optional().describe("Tax amount if available"),
  tax_rate: z.number().nullable().optional().describe("Tax rate percentage if available"),
  tax_type: z.string().nullable().optional().describe("Type of tax (e.g., VAT, GST)"),
  language: z.string().describe("Language of the receipt"),
  website: z.string().nullable().optional().describe("Website of the merchant"),
  email: z.string().nullable().optional().describe("Email address if found on receipt"),
  register_number: z.string().nullable().optional().describe("Cash register number"),
  cashier_name: z.string().nullable().optional().describe("Cashier name if available"),
  items: z
    .array(
      z.object({
        name: z.string(),
        price: z.number(),
        quantity: z.number().optional(),
      }),
    )
    .optional()
    .describe("Individual items on the receipt"),
  sj_validation: sjValidationSchema.describe("SJ-specific validation and categorization"),
})
