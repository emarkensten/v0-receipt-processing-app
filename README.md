# Ersättning vid försening

Prototyp för SJ: resenären fotograferar kvittona från en försenad resa och ser direkt vad hen kan få tillbaka.

- **Claude Sonnet 5.5** (`claude-sonnet-5-5`) läser kvittot, klassar varje rad (mat, hotell, transport, alkohol, tobak, övrigt) och skriver en kort sammanfattning. Strukturerad output via Zod, se `app/api/process-receipt/route.ts`.
- **SJ:s designsystem** från Bit (`@sj-ab/component-library.*`) med SJ:s tema i ljust och mörkt läge och högkontrast. Detaljer öppnas i `Sheet`, huvudhandlingen ligger i en fast `BottomBarContainer`.
- **Rörelse** med `motion`: sidorna glider i sidled på mobil, kvitton glider in i listan och beloppet räknas upp. Respekterar minskad rörelse.
- **Regler** i `lib/reimbursement.ts`: tak per kategori (inte per kvitto) efter resans längd och försening, enligt EU 2021/782 och lag 2015:953. Beloppen är prototypens uppskattningar.

## Kom igång

```bash
npm install
cp .env.example .env.local   # lägg in ANTHROPIC_API_KEY
npm run dev
```

SJ:s paket hämtas från Bit Cloud via `.npmrc`. Tryck på "Prova med tre exempelkvitton" för en demo utan egna kvitton (`public/exempel`, ritade med `scripts/make-sample-receipts.mjs`).

På Vercel behövs miljövariabeln `ANTHROPIC_API_KEY`.
