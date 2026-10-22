# rättRätt

rättRätt är en middagsplanerare där användare kan hitta maträtter, slumpa fram matsedlar, spara personliga val och dela egna maträtter med andra användare.

**App:** [rättRätt](https://rattratt.vercel.app/)
**Backend API:** [Render](https://raettraett-api.onrender.com/api/dishes)
**GitHub:** [Repository](https://github.com/st-ruth/raettraett)

## Teknikstack

* **Frontend:** React, TypeScript och Vite
* **Backend:** Node.js och Express
* **Databas och autentisering:** Supabase
* **Tester:** Jest och React Testing Library
* **Driftsättning:** Vercel och Render

## Funktioner

* Slumpa fram maträtter och markera dem som Ja, Nej eller Kanske.
* Söka, filtrera och sortera maträtter.
* Skapa och spara en personlig måltidsplan.
* Lägga till maträtter som delas med andra användare.
* Registrera konto och logga in.
* Växla mellan ljust och mörkt tema.

## Starta lokalt

Du behöver Node.js, npm och ett konfigurerat Supabase-projekt.

Skapa lokala .env-filer med de miljövariabler som behövs. Lägg inte upp filer som innehåller hemligheter i Git.

**Frontend, i projektroten:**
`VITE_API_URL`, `VITE_SUPABASE_URL` och `VITE_SUPABASE_PUBLISHABLE_KEY`.

**Backend, i `server/.env`:**
`SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` och `PORT`.

Starta backend i en terminal:

```bash
cd server
npm install
npm run dev
```

Starta frontend i en separat terminal från projektroten:

```bash
npm install
npm run dev
```

Frontend körs normalt på `http://localhost:5173` och backend på `http://localhost:3000`.

## Tester

Kör från projektroten:

```bash
npm test -- --runInBand
```

## Framtida förbättringar

* Möjlighet att navigera mellan olika veckor i kalendern.
* Ytterligare förbättringar av användargränssnitt och tillgänglighet.
