# rättRätt

rättRätt är en middagsplanerare där användare kan hitta maträtter, slumpa fram en matsedel, spara personliga val och lägga till egna maträtter som delas med andra användare.

**App:** [rättRätt – kalender](https://app-tau-nine-19.vercel.app/kalender)
**Backend API:** [Hämta maträtter](https://raettraett-api.onrender.com/api/dishes)
**GitHub:** [Projektets repository](https://github.com/st-ruth/raettraett)

## Tekniker

React, TypeScript, Vite, Node.js, Express, Supabase, Jest och React Testing Library. Frontend är publicerad på Vercel och backend på Render.

## Funktioner

* Slumpa fram maträtter och markera dem som Ja, Nej eller Kanske.
* Söka, filtrera och sortera sparade maträtter.
* Skapa och spara en personlig måltidsplan i kalendern.
* Lägga till maträtter som delas med andra användare.
* Registrera konto, logga in och hantera personliga val.
* Växla mellan ljust och mörkt tema.

## Hur appen fungerar

Grundrätterna lagras i `server/dishes.json`. Express-backenden hämtar dem och kombinerar dem med delade maträtter från Supabase. Nya delade maträtter skickas via Express till Supabase.

Inloggning, personliga statusar och måltidsplaner hanteras direkt från frontend mot Supabase.

## Installation och lokal start

Du behöver Node.js, npm och ett konfigurerat Supabase-projekt.

### Miljövariabler

Skapa en `.env`-fil i projektroten för frontend:

```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=din-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=din-publika-supabase-nyckel
```

Skapa även `server/.env` för backend:

```env
SUPABASE_URL=din-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=din-publika-supabase-nyckel
PORT=3000
```

Ersätt exempelvärdena med dina egna. Lägg aldrig in lösenord eller hemliga nycklar i README eller Git. `.env`-filer ska inte checkas in.

### 1. Starta backend

Öppna en terminal:

```bash
cd server
npm install
npm run dev
```

Backenden körs på `http://localhost:3000`.

### 2. Starta frontend

Öppna en separat terminal från projektroten:

```bash
npm install
npm run dev
```

Frontend körs på `http://localhost:5173`.

## Tester och byggen

Kör kommandona från projektroten:

```bash
npm test -- --runInBand
npm run lint
npm run build
```

Bygg backend från `server/` med:

```bash
npm run build
```

## Kända begränsningar och framtida förbättringar

* Render kan försättas i viloläge, vilket gör att den första förfrågan kan ta längre tid.
* Navigering mellan olika veckor i kalendern kan utvecklas vidare.
* Kalenderns och de personliga listornas data hanteras direkt från frontend mot Supabase. Dessa dataflöden skulle kunna flyttas till Express i framtiden.
* SQL-migreringar för att återskapa databasens tabeller och behörighetsregler ingår inte i repositoryt.
