# BOLERO — Gestionale

Sistema operativo digitale per un'azienda di montaggio, tende, pergole e pergotende.
Stack: Next.js 16 (App Router) · TypeScript · Prisma · SQLite (dev) / PostgreSQL (produzione) ·
NextAuth v5 · Tailwind CSS · Vercel AI SDK + Claude.

## Stato del progetto

**Fasi 1–8 completate:**

| Fase | Contenuto |
|---|---|
| 1 | Autenticazione, ruoli (Titolare/Ufficio/Collaboratore), permessi configurabili, shell responsive |
| 2 | Clienti, calendario, preventivi (PDF, versionamento) |
| 3 | Prodotti, schede di misurazione dinamiche, foto |
| 4 | Anteprima 3D parametrica delle misure |
| 5 | Workflow a 15 stadi (Contatto → Chiuso) con storico transizioni |
| 6 | Chat interna per cliente, timeline unificata |
| 7 | Notifiche, fatture/pagamenti, promemoria con approvazione umana obbligatoria |
| 8 | AI Orchestrator ("Parla con Bolero") — Claude via Anthropic API, tool a permessi, conferma umana su ogni azione |

Le sezioni **Fatture**, **Workflow**, **AI** ecc. sono tutte attive nel menu principale.

## Setup

### 1. Database

**Sviluppo locale (già configurato):** SQLite, zero setup — `DATABASE_URL="file:./dev.db"` in `.env`.

**Produzione:** passa a PostgreSQL (es. [Supabase](https://supabase.com)) cambiando
`provider = "postgresql"` in `prisma/schema.prisma` e la relativa `DATABASE_URL`.

### 2. Installazione e migrazione

```bash
npm install
npm run db:push      # crea le tabelle nel database
npm run db:seed      # crea i 3 ruoli e l'utente titolare di default
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

### Credenziali di primo accesso (create dal seed)

```
email:    titolare@bolero.local
password: Bolero2026!
```

Cambia la password al primo accesso creando un nuovo utente titolare da
*Impostazioni* e disattivando quello di default, oppure aggiornandola direttamente
da Prisma Studio (`npm run db:studio`).

### 3. Integrazioni esterne (opzionali)

Vedi *Impostazioni → Integrazioni* nell'app per lo stato di connessione. Nessuna è
richiesta per usare il gestionale: senza credenziali, le relative sezioni mostrano
un messaggio chiaro invece di fallire silenziosamente.

| Servizio | Variabile | Abilita |
|---|---|---|
| Claude (AI Orchestrator) | `ANTHROPIC_API_KEY` | La sezione "Parla con Bolero" |
| Google Calendar / Sheets | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Sincronizzazione (da implementare) |
| Resend (email) | `RESEND_API_KEY` | Invio reale dei promemoria approvati |

## Comandi utili

| Comando | Descrizione |
|---|---|
| `npm run dev` | Avvia il server di sviluppo |
| `npm run build` | Build di produzione |
| `npm run lint` | Controllo lint |
| `npm run db:push` | Sincronizza lo schema Prisma col database (dev) |
| `npm run db:migrate` | Crea una migrazione versionata |
| `npm run db:studio` | Apre l'editor visuale del database |
| `npm run db:seed` | Popola ruoli e utente titolare iniziali |

## Struttura

```
src/
├── app/
│   ├── (dashboard)/       # Shell autenticata: dashboard, clienti, calendario, ...
│   ├── login/
│   └── api/
│       ├── auth/           # NextAuth
│       ├── ai/              # Chat orchestrator + conferma azioni
│       ├── chat/             # Chat interna (polling)
│       ├── notifications/
│       ├── upload/           # Storage locale foto (dev)
│       └── preventivi/[id]/pdf/
├── components/
│   ├── layout/             # Sidebar, topbar, notifiche, menu utente
│   ├── three/               # Configuratore 3D (React Three Fiber)
│   └── ui/                  # Componenti riutilizzabili
├── lib/
│   ├── auth.ts              # Configurazione NextAuth
│   ├── permissions.ts       # Registro permessi e preset ruoli
│   ├── labels.ts             # Etichette e stati (IT) condivisi dalla UI
│   ├── dimensions.ts          # Mappatura campi dinamici → dimensioni 3D
│   ├── notify.ts               # Helper notifiche in-app
│   └── ai/                      # Tool AI, orchestrator, esecuzione azioni confermate
prisma/
├── schema.prisma
└── seed.ts
```

I permessi non sono hard-coded: sono salvati come JSON su ogni `Role` nel database
(`src/lib/permissions.ts` contiene solo i preset iniziali usati dal seed) e possono
essere modificati in futuro da un'interfaccia di amministrazione senza toccare il codice.

## Il principio dell'AI Orchestrator

L'AI non ha mai accesso diretto al database. I suoi "tool" di sola lettura (cerca
clienti, riepiloga un cliente) girano subito; qualsiasi azione che modifica dati
(creare un appuntamento, avanzare un workflow, approvare un preventivo) viene
solo **proposta** — salvata come `AiAction` in stato `PENDING` — e mostrata
all'utente con il pattern "Ho capito questo: … [Conferma] [Modifica]". L'esecuzione
reale avviene solo dopo un click esplicito, con un secondo controllo dei permessi
lato server indipendente dal modello.
