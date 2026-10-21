# rättRätt

rättRätt är en middagsplanerare. Man bläddrar bland maträtter och markerar vilka man vill ha (Ja), inte vill ha (Nej) eller är osäker på (Kanske). Appen slumpar sedan fram en matsedel för kommande veckor utifrån de rätter man valt Ja på.

**Publicerad app:** https://raettraett.netlify.app/
**API (Render):** https://raettraett-api.onrender.com/api/dishes
**Repo:** https://github.com/st-ruth/raettraett

> Backenden ligger på Renders gratisplan och somnar efter en stunds inaktivitet. Första laddningen kan därför ta upp till en minut.

## Tekniker

- **Frontend:** React 19, TypeScript, Vite, React Router
- **Backend:** Node.js, Express 5, TypeScript
- **Tredjepartstjänst:** Supabase (inloggning och databas)
- **Tester:** Jest och React Testing Library
- **Driftsättning:** Netlify (frontend) och Render (backend)

## Viktiga funktioner

- **Sök inspo:** slumpa fram rätter och markera dem som Ja, Nej eller Kanske
- **Sparat:** lista över dina rätter med flikar, sökning och filter (proteintyp, snabblagat) samt sortering
- **Kalender:** matsedel för 35 dagar framåt. Man kan slumpa en dag eller hela planen, byta rätt och låsa dagar så de inte slumpas om
- **Startsidan** visar dagens middag
- **Konto:** registrera dig och logga in med Supabase Auth. Personliga listor sparas per användare
- **Egna rätter:** inloggade användare kan lägga till rätter i den gemensamma receptbanken
- **Laddnings- och felhantering** för hämtning av recept
- **Ljust och mörkt tema**
- **Tillgänglighet:** semantisk HTML, tangentbordsnavigering och modaler med fokusfälla som stängs med Esc

## Hur appen hänger ihop

```
React (frontend)
   ├── GET/POST /api/dishes ──► Express (backend) ──► Supabase (shared_dishes)
   │                                   └── läser även server/dishes.json (basrätter)
   └── inloggning och personliga listor ──► Supabase direkt
```

Express-servern slår ihop basrätterna i `server/dishes.json` med användarskapade rätter från Supabase. Vid sparande av en ny rätt verifierar servern användarens inloggningstoken mot Supabase innan något skrivs. CORS är begränsat till den publicerade frontend-adressen och `localhost:5173`.

## Mappstruktur

```
src/
├── components/   UI-komponenter (DishCard, modaler, Navbar)
├── context/      Auth-, Dish- och Theme-kontext
├── hooks/        Egna hooks (useDishFilter, useAccessibleModal)
├── layouts/      Gemensam layout
├── pages/        Sidor (Home, Randomizer, Saved, Calendar)
├── services/     API-anrop (api.ts) och Supabase-klient
├── styles/       CSS
└── types/        TypeScript-gränssnitt
server/           Express-server och basrätter (dishes.json)
tests/            Jest-tester
```

## Installation och start lokalt

Du behöver Node.js installerat.

### 1. Backend (i en terminal)

```bash
cd server
npm install
npm run dev
```

Servern startar på http://localhost:3000.

### 2. Frontend (i en annan terminal, från projektroten)

```bash
npm install
npm run dev
```

Frontend startar på http://localhost:5173.

## Miljövariabler

Skapa `.env`-filer med dina egna värden från Supabase-projektet. Filerna ligger i `.gitignore` och ska inte läggas upp.

**Frontend** (`.env` i projektroten):

```
VITE_SUPABASE_URL=<din Supabase-URL>
VITE_SUPABASE_PUBLISHABLE_KEY=<din publika (publishable/anon) nyckel>
VITE_API_URL=http://localhost:3000
```

**Backend** (`server/.env`):

```
SUPABASE_URL=<din Supabase-URL>
VITE_SUPABASE_PUBLISHABLE_KEY=<din publika (publishable/anon) nyckel>
PORT=3000
```

I den publicerade versionen sätts samma variabler i Netlify (frontend, där `VITE_API_URL` pekar på Render-servern) och i Render (backend).

## Tester

Kör från projektroten:

```bash
npm test
```

Testerna täcker bland annat filtrering på proteintyp och snabblagat, laddnings- och felmeddelanden, att slumpningen bara sker bland rätter markerade Ja, att personliga statusar hålls isär mellan användare, sparande av ny rätt via servern med sessionstoken och att utloggade besökare stoppas.

## Tekniska val

- **Context API** för inloggning, tema och receptdata, så att inga props behöver skickas genom flera komponentlager.
- **Backend som mellanhand mot Supabase:** receptbanken hämtas och sparas via Express, som även verifierar användarens token. Personliga statusar och inloggning hanteras direkt mot Supabase med radnivåsäkerhet (RLS).
- **Prestanda:** `useMemo` för filtrering och sortering, och `React.memo` på `DishCard` så att kort i listor inte ritas om i onödan.
- **Typning:** gränssnitt för rätter och matsedel i `src/types`, och svar från servern valideras med type guards innan de används.

## Kända problem och vidareutveckling

- Utveckla navigering mellan veckor i matsedelsvyn på 30 dagar.
- Matsedeln sparas inte i databasen utan nollställs när sidan laddas om. Nästa steg vore att spara den per användare i Supabase.
- Några valideringsmeddelanden i formulär och i dagsredigeringen visas fortfarande med `alert()` och borde bytas mot meddelanden i sidan.
- Valideringen av rätter och listorna med proteintyper och kolhydrater finns både i frontend och backend. De borde delas i en gemensam modul.
- Startsidan och kalendern visar ingen egen laddnings- eller felstatus för receptdatan.
- Basrätterna i `server/dishes.json` kan inte redigeras i appen, och på Renders gratisplan är filsystemet tillfälligt.
- Backenden på Renders gratisplan somnar, vilket ger en lång första laddning.