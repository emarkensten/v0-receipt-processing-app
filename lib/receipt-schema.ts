import { z } from "zod"

/** Vad Claude ska läsa ut ur ett kvitto. Allt som kan saknas är nullable, inte optional. */
export const extractedReceiptSchema = z.object({
  is_receipt: z.boolean().describe("false om bilden inte är ett kvitto eller en faktura"),
  store_name: z.string().describe("Butikens eller företagets namn som det står på kvittot"),
  date: z.string().nullable().describe("Köpdatum i formatet YYYY-MM-DD"),
  time: z.string().nullable().describe("Klockslag i formatet HH:MM"),
  currency: z.string().describe("ISO-valutakod, till exempel SEK eller EUR"),
  total_amount: z.number().describe("Totalsumma att betala"),
  vat_amount: z.number().nullable().describe("Momsbelopp om det står"),
  category: z
    .enum(["Mat", "Boende", "Transport", "Övrigt"])
    .describe("Mat = måltider, fika, livsmedel. Boende = hotell. Transport = taxi, buss, hyrbil. Övrigt = allt annat"),
  items: z
    .array(
      z.object({
        name: z.string().describe("Varans namn, med stor bokstav först och utan förkortningar om de är tydliga"),
        quantity: z.number(),
        line_total: z.number().describe("Radens totalpris (antal gånger styckpris)"),
        kind: z
          .enum(["mat_dryck", "alkohol", "tobak", "boende", "transport", "ovrigt"])
          .describe("alkohol = öl, vin, cider, sprit. tobak = cigaretter, snus. ovrigt = sådant som inte är mat, logi eller resa"),
      }),
    )
    .describe("Kvittots rader. Tom lista om raderna inte går att läsa"),
  summary: z
    .string()
    .describe("En mening på svenska i du-form om vad kvittot gäller och om något sticker ut, till exempel alkohol. Inga tankstreck."),
})

export type ExtractedReceipt = z.infer<typeof extractedReceiptSchema>
