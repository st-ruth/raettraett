# rättRätt

rättRätt är en middagsplanerare där användare kan hitta maträtter, slumpa fram matsedlar, spara personliga val och dela egna maträtter med andra användare.

**Publicerad app:** [rättRätt](https://rattratt.vercel.app)
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

Du behöver Node.js och npm.
Vid lokal utveckling krävs miljövariabler för Supabase-anslutningen och backendens API-adress. Inga nyckelvärden eller hemligheter ingår i repot.

**1. Starta backend** i en terminal:

```bash
cd server
npm install
npm run dev
```

**2. Starta frontend** i en separat terminal från projektroten:

```bash
npm install
npm run dev
```

Frontend öppnas normalt på `http://localhost:5173` och backend körs på `http://localhost:3000`.

## Tester

Kör testerna från projektroten:

```bash
npm test -- --runInBand
```

## Framtida förbättringar

* Möjlighet att navigera mellan olika veckor i kalendern.
* Ytterligare förbättringar av användargränssnitt och tillgänglighet.
