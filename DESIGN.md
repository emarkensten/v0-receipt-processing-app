---
name: SJ Design System
description: SJ:s designsystem. Den visuella världen är given och ska förfinas, aldrig ersättas.
---

# Design System: SJ Design System

> **Till kodagenter och designskills (till exempel impeccable):** den här prototypen använder SJ:s befintliga designsystem. Den visuella världen är **given**, och allt arbete är *refinement*, aldrig *redesign*. Välj inte typsnitt, färgpalett, skuggor, radier eller dekorationer. De kommer från SJ:s komponenter och tema. Förbättra hierarki, flöde, avstånd, tydlighet, text och tillgänglighet inom ramarna nedan.
>
> Källor, i den här ordningen: SJ:s Storybook (MCP `sj-storybook`), SJ:s designwebb i Sanity (MCP `sj-design-system`, `get_guideline_page_content`) och de installerade paketens `.d.ts`. Den här filen sammanfattar dem. Är det oklart är det källorna som gäller.

## Overview

SJ:s digitala designfilosofi utgår från **rörelse**: att hjälpa människor framåt, både på resan och i ett digitalt flöde. Gränssnittet ska vara **enkelt, pålitligt, mänskligt och härligt** (SJ:s värdeord). Uttrycket är lugnt och luftigt. Innehåll står direkt på sidan och avgränsas av avstånd och rubriker, inte av ramar. Varumärket syns i precisa detaljer: den gröna huvudknappen, SJ Sans, färdiga reskomponenter och ett varmt tilltal.

Det här är app-UI där **användaren ska få något gjort** (i impeccables termer läget *Operate*): överblickbarhet, konsekvens och förutsägbara mönster går före expressivitet.

## Colors

Alla färger kommer från temat (`generateThemeOptions` i `@sj-ab/component-library.styles.themes`) och används via MUI-paletten i `sx`: `text.primary`, `text.secondary`, `background.default`, `divider`, `primary.main` och så vidare. **Inga hårdkodade färger.** Ljust läge, mörkt läge och högkontrast följer automatiskt av temat.

- **Grönt (primary)** betyder handling och framsteg: `FlowButton`, valda tillstånd.
- **Statusfärger** kommer via komponentvarianter (`Card variant="information" | "critical" | "urgent" | "success"`, `SystemMessage`, `InformationCard variant`), inte som egna bakgrunder.
- Förlita dig aldrig på färg ensam: komplettera med text eller ikon.

## Typography

SJ Sans via `Typography` från `@sj-ab/component-library.ui.typography`. Använd de nuvarande varianterna: `largeTitleEmphasized`, `title1Emphasized`, `title2Emphasized`, `title3Emphasized`, `subtitleRegular`, `bodyRegular`, `subheadlineRegular`, `caption1Regular` och `h1`–`h4`. De äldre varianterna (`body1`, `caption`, `heading*`, `link`, `overline`, `subtitle1`) är utfasade.

### Hierarchy

En `h1` per sida (den som AppBar följer via `headingRef`), `h2` för sektioner och `bodyRegular` för brödtext. Sekundär information skrivs i `color="text.secondary"`, inte i mindre storlek utan skäl.

## Layout

Från SJ:s riktlinjer i Sanity (*Avstånd*, *Grid*, *Layoutregioner*, *Informationstäthet*):

- **Avstånd:** **16px är standard** mellan element (`spacing={2}` / `p: 2`). Öka i steg om **8px** i undantagsfall, till exempel mellan två stycken text eller mellan sektioner (`spacing={3}` = 24px). Minska i steg om **4px** för finjustering, till exempel mellan en liten rubrik och brödtext (`spacing={1.5}` = 12px, `spacing={1}` = 8px). Temats enhet är 8px.
- **Grid:** 16px sidomarginaler och 16px rännor som standard, ökas i steg om 8px. Rännor ska inte vara bredare än marginalerna. **Maxbredd** är 1200px som standard, med 400, 600, 800, 1000, 1200, 1400 och 1600 som tillåtna värden. Formulär och flöden: 600.
- **Layoutregioner:** icke-modala vyer har **App Bar, Body och Navigation Bar**. På surfplatta och dator kan Navigation Bar bytas mot Navigation Rail eller Navigation Drawer. Modala vyer (Sheet, SideSheet, fullskärmsdialog) har **App Bar och Body**, och kan ha en **Bottom Bar Container** fast i nederkanten.
- **Vertikalt avstånd i kod:** `<Stack useFlexGap spacing={2}>`. Utan `useFlexGap` kan komponenternas egna marginaler äta upp avståndet.
- **Linjering:** allt ska linjera i vänsterkant. Listor, accordions, switchar, checkboxar, radioknappar och textknappar ligger i linje med rubrikerna, och klickytan får sticka ut i marginalen. Använd negativ marginal till vänster (se AGENTS.md).
- **Informationstäthet:** list- och fältkomponenter finns i storlekarna sm, md, lg och xl (xl är standard, glesast). Använd tätare storlekar med eftertanke, för långa listor, tabeller och formulär. Klickytor ska vara minst **44×44px** på touch.
- **Mobil först:** 375px bredd först, sedan större skärmar.

## Elevation & Depth

Djup skapas med **lager**, inte med ramar och skuggor på innehåll: `Sheet`, `SideSheet`, `Dialog`, `Menu`, `Popper` och `Tooltip`. Detaljer och val öppnas ovanpå sidan. Lägg inga egna skuggor. Komponenternas egen elevation räcker (Storybook: `guidelines-elevation`).

## Shapes

Radier och former kommer från komponenterna. Sätt inga egna `borderRadius` och rita inga egna ramar runt innehåll.

## Components

Bara SJ:s komponenter från Bit (`@sj-ab/component-library.ui.*`). Rå MUI används bara för layoutprimitiver som saknar SJ-motsvarighet (`Box`, `Grid`, `useMediaQuery`).

### Buttons

Knapphierarki (Sanity: *Knapphierarki*): **en huvudhandling per vy** med `FlowButton`. Sekundära handlingar tar `FlowButton colorVariant="secondary"` eller `TextButton`. Knappar finns i sm, md, lg och xl (standard xl). `IconButton` kräver `ariaLabel`.

### Cards / Containers

**SJ använder sällan kort.** Kort förekommer bara som färdiga kortkomponenter för ett visst syfte: `DepartureCard`, `JourneyCard`, `TicketCard`, `InformationCard`, `EditorialCard`, `PhotoCard`, `CampaignCard`, `ProductCard`, `SwitchCard`, `RadioCard`, `CheckboxCard`, `AccordionCard` och `ErrorSummaryCard`. Allt annat, som formulär, sektioner, listor och sammanfattningar, ligger direkt på sidan.

### Travel

Reskomponenterna används alltid före egna rader för resedata: `DepartureCard`, `JourneyCard`, `JourneySummary`, `RouteDescription`, `TransportSummary`, `TravelTime`, `PriceObject`, `TicketCard` och `StationPicker`. En detaljvy för en resa består av `JourneySummary` och `RouteDescription`, inte av egna rader med ikon och etikett. Se tabellen i AGENTS.md.

### Lists

`List` + `ListItemButton` + `ListItemText` (+ `ListItemIcon` med chevron) och `Divider` mellan raderna.

### Empty states

`EmptyState`. Följ SJ:s mönster för tomma tillstånd (Sanity: *Tomma tillstånd*): ej inloggad, offline, inget svar från servern, sidan finns inte, ingen behörighet. Ett tomt val i ett flöde, till exempel en fullbokad dag, ska ha en väg vidare: visa närmaste dag eller avgång med plats.

## Do's and Don'ts

**Gör:**
- Låt innehåll stå direkt på sidan med 16px som grundavstånd.
- Använd SJ:s färdiga kort- och reskomponenter där de finns.
- Öppna detaljer i Sheet eller SideSheet.
- Skriv som SJ (Sanity: *Tonläge*, *UX-writing*): mänskligt och sympatiskt, i ögonhöjd, varmt och lättsamt men inte babbligt. Du-form, aktiv röst, kort och konkret, inga tankstreck.
- Visa läget innan användaren trycker. Fullbokade dagar och slutsålda avgångar märks med text ("Fullt", "3 platser kvar"), inte bara med färg.
- Säg vad som saknas när användaren inte kan gå vidare, med SJ:s valideringstexter ("Välj en avgång"), i stället för en grå huvudknapp utan förklaring.
- Låt en bekräftelse svara på "vad händer nu?": vad som är bokat, nästa steg och en tydlig avslutning ("Klar").
- Låt vågräta rader med datum eller chips skrolla i `ScrollableContainer`. Inget får gå utanför sidomarginalen.
- Kolla mobil och desktop, ljust och mörkt läge.

**Gör inte:**
- Lägg inte innehåll i kort i kort, ramar i ramar eller "tiles" runt sektioner.
- Använd inga egna typsnitt, färger, gradienter, skuggor, glaseffekter eller dekorativa illustrationer.
- Använd inte emojis i gränssnittet. Använd SJ:s ikoner.
- Använd inga andra UI-bibliotek eller Tailwind.
- Rita inte om en komponent som redan finns i SJ:s bibliotek.
