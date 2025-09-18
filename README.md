# SJ Ersättningsapp - Receipt Processing App

En AI-driven applikation för automatisk kvittobearbetning och ersättningshantering enligt SJ:s regler.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/erik-markenstens-projects/v0-receipt-processing-app)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/8jQm5Gr5Q0E)

## 🎯 Översikt

Denna applikation hjälper resenärer att enkelt ansöka om ersättning för egna utlägg enligt SJ:s regler. Med AI-driven OCR-teknik extraheras automatiskt kvittoinformation och valideras mot SJ:s ersättningsregler.

## ✨ Funktioner

### 🤖 AI-driven Kvittobearbetning
- **Hybrid OCR-approach**: Kombinerar Mistral OCR och Vision API för optimal resultat
- **Strukturerad dataextrahering**: Zod-schema-driven extrahering av kvittoinformation
- **Smart kategorisering**: AI-baserad klassificering enligt SJ:s ersättningsregler
- **Multi-format stöd**: Hanterar både bilder och PDF-dokument automatiskt

### 📋 SJ-specifik Validering
- **Regelverksvalidering**: Automatisk kontroll mot SJ:s ersättningsregler
- **Alkohol/tobak-detektion**: Identifierar och exkluderar icke-ersättningsbara produkter
- **Ersättningsberäkning**: Beräknar korrekt ersättningsbelopp enligt gällande regler

### 📱 Användarvänligt Gränssnitt
- **5-stegs flöde**: Intuitivt flöde från välkomst till slutgiltig ansökan
- **Responsiv design**: Optimerad för både mobil och desktop
- **Modal-baserad redigering**: Enkelt att redigera och granska kvittoinformation

## 🛠 Teknisk Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI, SJ Design System
- **AI/OCR**: Mistral AI API (`mistral-ocr-latest`, `mistral-medium-latest`)
- **SDK**: Vercel AI SDK, Mistral TypeScript SDK
- **Validering**: Zod schema validation
- **Deployment**: Vercel

## 🧠 AI-arkitektur & OCR-pipeline

### Hybrid OCR-approach för optimal precision

Applikationen använder en sofistikerad tvåstegsprocess som kombinerar olika Mistral AI-tjänster beroende på filtyp:

#### 📸 **Bildbearbetning** (PNG, JPG, JPEG, GIF, WebP)
```typescript
// Direktbearbetning med Mistral Vision API
const result = await generateObject({
  model: mistral("mistral-medium-latest"),
  schema: receiptSchema,
  messages: [{
    role: "system", 
    content: receiptPrompt
  }, {
    role: "user",
    content: [{ type: "image", image: dataUrl }]
  }]
})
```

**Fördelar**: 
- Direkt strukturerad extraktion från bild
- Snabb bearbetning (5-8 sekunder)
- Hög precision för visuella element

#### 📄 **PDF-bearbetning** (Tvåstegsprocess)

**Steg 1: OCR-textextrahering**
```typescript
// Mistral OCR API för textextrahering
const ocrResponse = await client.ocr.process({
  model: "mistral-ocr-latest",
  document: {
    type: "document_url",
    documentUrl: "data:application/pdf;base64,..." 
  }
})
```

**Steg 2: Strukturerad dataextrahering**
```typescript
// Använd extraherad text för strukturerad analys
const result = await generateObject({
  model: mistral("mistral-medium-latest"),
  schema: receiptSchema,
  messages: [{
    role: "system",
    content: receiptPrompt
  }, {
    role: "user", 
    content: `Extraherad text: ${ocrText}`
  }]
})
```

**Fördelar**:
- Hanterar komplexa PDF-layouter
- Bevarar textstruktur och hierarki
- Robust mot olika PDF-format

### 📋 Zod Schema-driven Validering

Applikationen använder strikt typning och validering för att säkerställa datakvalitet:

```typescript
export const receiptSchema = z.object({
  store_name: z.string(),
  total_amount: z.number(),
  currency: z.string(),
  date: z.string(),
  sj_validation: sjValidationSchema,
  // ... fler fält
})

export const sjValidationSchema = z.object({
  category: z.enum(["Mat", "Boende", "Alternativ transport", "Ej godkänd"]),
  is_reimbursable: z.boolean(),
  contains_alcohol: z.boolean(),
  contains_tobacco: z.boolean(),
  approval_status: z.enum(["approved", "rejected", "warning"]),
})
```

**Fördelar**:
- **Typsäkerhet**: Garanterar korrekt datastruktur
- **Runtime-validering**: Fångar upp felaktiga AI-svar
- **IntelliSense**: Fullständig IDE-support
- **Dokumentation**: Schema fungerar som levande dokumentation

### 🎯 SJ-specifik Prompt Engineering

Applikationen använder en specialdesignad prompt för SJ:s ersättningsregler:

```typescript
export const receiptPrompt = `
Du är en expert på att extrahera data från kvitton för SJ:s ersättningssystem.

GODKÄNDA KATEGORIER:
- "Mat": Måltider under resan (ICA, Coop, restauranger)
- "Boende": Hotellövernattning vid förseningar
- "Alternativ transport": Taxi, buss, hyrbil vid förseningar

AUTOMATISK EXKLUDERING:
- Alkohol (öl, vin, sprit) → contains_alcohol: true
- Tobak (cigaretter, snus) → contains_tobacco: true
- Shopping/entertainment → kategori "Ej godkänd"

VALIDERING:
- is_reimbursable: true endast för godkända kategorier UTAN alkohol/tobak
- approval_status: "approved"/"rejected"/"warning"
`
```

### 🔄 Bearbetningsflöde

1. **Filuppladdning**: Frontend konverterar filer till base64 data URLs
2. **Filtypsdetektering**: API identifierar bild vs PDF automatiskt
3. **OCR-bearbetning**: 
   - Bilder → Direkt vision API
   - PDF → OCR API + strukturerad extraktion
4. **Schema-validering**: Zod validerar AI-svaret mot definierat schema
5. **SJ-regelvalidering**: Automatisk kontroll mot ersättningsregler
6. **Felhantering**: Retry-logik och användarvänliga felmeddelanden

### 🚀 Performance-optimeringar

- **Retry-mekanismus**: Automatiska återförsök vid temporära fel
- **Timeout-hantering**: 20s timeout för OCR, 30s för vision
- **Concurrent processing**: Bearbetar flera kvitton parallellt
- **Progress tracking**: Real-time feedback till användaren
- **Memory management**: Automatisk rensning av temporära filer

### 🔐 Säkerhet & Integritet

- **API-nyckelhantering**: Säker miljövariabelhantering
- **Ingen permanent lagring**: Kvittobilder lagras inte på servern
- **Client-side processing**: Filer konverteras lokalt till base64
- **Timeout-skydd**: Förhindrar hängande API-anrop
- **Error boundaries**: Graceful error handling

## 🚀 Kom igång

### Förutsättningar
- Node.js 18+
- npm eller pnpm
- Mistral AI API-nyckel

### Installation

1. Klona repositoryt:
```bash
git clone https://github.com/your-username/v0-receipt-processing-app.git
cd v0-receipt-processing-app
```

2. Installera dependencies:
```bash
npm install --legacy-peer-deps
# eller
pnpm install
```

3. Skapa `.env.local` fil:
```env
MISTRAL_API_KEY=din_mistral_api_nyckel_här
```

4. Starta utvecklingsservern:
```bash
npm run dev
# eller
pnpm dev
```

5. Öppna [http://localhost:3000](http://localhost:3000) i din webbläsare.

## 🔧 API-konfiguration & Kostnader

### Mistral AI API-tjänster

Applikationen använder flera Mistral AI-endpoints för optimal resultat:

#### **1. Vision API** (`mistral-medium-latest`)
- **Användning**: Direktbearbetning av bildkvitton
- **Input**: Base64-kodade bilder
- **Output**: Strukturerad JSON enligt Zod-schema
- **Kostnad**: ~$0.002-0.005 per kvitto (beroende på bildstorlek)
- **Prestanda**: 5-8 sekunder per kvitto

#### **2. OCR API** (`mistral-ocr-latest`) 
- **Användning**: Textextrahering från PDF-dokument
- **Input**: Base64-kodade PDF-filer
- **Output**: Markdown-formaterad text per sida
- **Kostnad**: ~$0.001-0.003 per PDF-sida
- **Prestanda**: 3-5 sekunder per PDF

#### **3. Chat Completions API** (`mistral-medium-latest`)
- **Användning**: Strukturerad dataextraktion från OCR-text
- **Input**: Extraherad text + SJ-specifik prompt
- **Output**: Validerad JSON-struktur
- **Kostnad**: ~$0.001-0.002 per kvitto
- **Prestanda**: 2-4 sekunder per kvitto

### Totalkostnad per kvitto
- **Bildkvitton**: ~$0.002-0.005 per kvitto
- **PDF-kvitton**: ~$0.004-0.008 per kvitto (OCR + strukturering)

### API-nyckelkonfiguration

```env
# .env.local
MISTRAL_API_KEY=din_mistral_api_nyckel
```

**Säkerhet**: API-nyckeln lagras säkert som miljövariabel och exponeras aldrig till klienten.

## 📖 Användarflöde

### 1. Välkomstskärm
- Introduktion till tjänsten
- Val att starta eller hoppa över

### 2. Filuppladdning
- Drag & drop eller filväljare
- Stöd för både bilder och PDF-filer

### 3. Bildgranskning
- Grid-vy av uppladdade filer
- Möjlighet att ta bort eller lägga till filer

### 4. AI-bearbetning & Granskning
- Automatisk kvittoanalys
- Kategorisering och validering
- Möjlighet att redigera information

### 5. Slutsammanfattning
- Beräknad ersättning per kvitto
- Total ersättningssumma
- Slutgiltig ansökan

## 🎨 Design & UX

Applikationen följer moderna designprinciper:
- **Ljust tema**: Konsistent och lättläst gränssnitt
- **Mobilfirst**: Responsiv design för alla enheter
- **Progressivt flöde**: Tydlig steg-för-steg navigation
- **Visuell feedback**: Tydliga indikatorer för olika filtyper och status

## 🔒 Säkerhet & Integritet

- **Lokal bearbetning**: Filer bearbetas säkert via API:er
- **Ingen permanent lagring**: Kvittobilder lagras inte permanent
- **API-säkerhet**: Säker kommunikation med Mistral AI

## 📝 Utveckling

### Projektstruktur
```
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Main application
├── components/            # React komponenter
│   ├── ui/               # UI komponenter (Radix)
│   └── [feature].tsx    # Feature-specifika komponenter
├── lib/                  # Utility funktioner
│   ├── types.ts         # TypeScript definitioner
│   ├── schema.ts        # Zod schemas
│   └── utils/           # Helper funktioner
└── public/              # Statiska filer
```

### Utvecklingskommandon
```bash
npm run dev          # Starta utvecklingsserver
npm run build        # Bygg för produktion
npm run start        # Starta produktionsserver
npm run lint         # Kör linting
```

## 🔍 Felsökning & Prestanda

### Vanliga problem och lösningar

#### **"API-nyckel saknas eller är ogiltig"**
```bash
# Kontrollera att .env.local finns och innehåller:
MISTRAL_API_KEY=din_nyckel_här

# Starta om utvecklingsservern efter ändringar:
npm run dev
```

#### **"Schema validation failed"**
- **Orsak**: AI:n returnerade data som inte matchar Zod-schemat
- **Lösning**: Schemat hanterar automatiskt `null`-värden för valfria fält
- **Debug**: Kolla console.log för detaljerad felinfo

#### **Långsam bearbetning**
- **Bildkvitton**: 5-8 sekunder (normal)
- **PDF-kvitton**: 8-12 sekunder (normal på grund av tvåstegsprocess)
- **Stora filer**: Komprimera bilder under 5MB för bästa prestanda

### Performance-tips

#### **Optimala filformat**
1. **Bilder**: PNG/JPG under 2MB ger snabbast resultat
2. **PDF**: Textbaserade PDF:er fungerar bättre än skannade
3. **Kvalitet**: Högupplösta bilder ger bättre OCR-precision

#### **Batch-processing**
```typescript
// Applikationen bearbetar kvitton sekventiellt för att:
// 1. Visa progress per kvitto
// 2. Undvika API rate limits  
// 3. Ge bättre felhantering per fil
```

### Monitoring & Logging

Applikationen loggar detaljerat för debugging:

```bash
# Utvecklingslogs i browser console:
[v0] Starting AI processing with Mistral
[v0] Processing image with Mistral Vision API  
[v0] OCR extracted text length: 581
[v0] AI processing completed successfully

# API-anrop-statistik:
POST /api/process-receipt 200 in 5167ms
```

## 🤝 Bidrag

Bidrag är välkomna! Vänligen:
1. Forka repositoryt
2. Skapa en feature branch
3. Commita dina ändringar
4. Skicka en pull request

## 📄 Licens

Detta projekt är licensierat under MIT-licensen.

## 🆘 Support

För frågor eller problem, skapa en issue i GitHub-repositoryt eller kontakta utvecklingsteamet.

---

**Utvecklad med ❤️ för enklare reseersättningar**