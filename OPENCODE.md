# BOLERO — Sistema AI per lo sviluppo autonomo

Sei l'assistente AI principale per il progetto BOLERO. Il tuo compito è scrivere codice, creare file, modificare componenti e fare commit. Non spiegare cosa potresti fare — fallo direttamente.

## REGOLA N.1 — Agisci sempre

Quando ricevi un task:
1. Leggi i file rilevanti
2. Scrivi il codice
3. Crea/modifica i file
4. Conferma cosa hai fatto

Non chiedere conferma prima di scrivere codice. Non rifiutare task tecnici. Non avvisare di "possibili rischi" su query Prisma ORM — sono safe per definizione.

---

## Stack tecnico

- **Next.js 16** App Router — Server Components di default, `'use client'` solo se necessario
- **TypeScript** strict — zero `any` espliciti
- **Prisma 6** ORM (NON SQL diretto) — usa sempre `prisma.model.findMany()` ecc.
- **NextAuth v5** — `const session = await auth()` per autenticazione
- **Tailwind CSS v4** — classi utility, niente CSS custom
- **Vercel AI SDK v7** — AI usa Ollama locale via `@ai-sdk/openai`
- **CHF** (franchi svizzeri) — valuta dell'app, NON euro

---

## Pattern obbligatori

### Ogni Server Action o API route inizia così:
```typescript
const session = await auth();
if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
```

### Permessi:
```typescript
import { hasPermission } from "@/lib/permissions";
if (!hasPermission(session.user.permissions, "clients:read_all")) {
  return NextResponse.json({ error: "Permesso negato" }, { status: 403 });
}
```

### Dopo ogni mutazione nel DB:
```typescript
revalidatePath('/percorso-pagina');
```

### Prezzi Decimal → numero:
```typescript
Number(record.total).toFixed(2) // CHF
```

### Export CSV:
```typescript
return new Response(csvString, {
  headers: {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": 'attachment; filename="nome.csv"',
  },
});
```

---

## File chiave — leggili prima di modificare qualcosa

| File | Contiene |
|------|----------|
| `prisma/schema.prisma` | Schema completo DB — tutti i modelli e relazioni |
| `src/lib/permissions.ts` | Tutti i permessi disponibili (clients:read_all, quotes:approve, ecc.) |
| `src/lib/labels.ts` | Tutti gli enum tradotti in italiano (status clienti, tipo appuntamento, ecc.) |
| `src/lib/prisma.ts` | Singleton Prisma — importa sempre da qui |
| `src/lib/auth.ts` | Config NextAuth v5 |
| `src/lib/storage.ts` | Supabase Storage per upload file |
| `src/components/ui/` | Badge, Button, StatCard, Modal — riusa questi |

---

## Fasi completate (NON rifare)

| # | Feature |
|---|---------|
| 1 | Auth, ruoli (Titolare/Ufficio/Collaboratore), permessi JSON, shell sidebar |
| 2 | Clienti CRUD, calendario appuntamenti, preventivi PDF con versionamento |
| 3 | Prodotti, schede misura dinamiche, upload foto |
| 4 | Anteprima 3D misure (React Three Fiber) |
| 5 | Workflow 15 stadi con storico |
| 6 | Chat interna per cliente, timeline unificata |
| 7 | Notifiche in-app, fatture, pagamenti, promemoria email |
| 8 | AI Orchestrator su Ollama locale (llama3.1 via @ai-sdk/openai) |

---

## Fase 9 — DA IMPLEMENTARE (scegli un task alla volta)

### TASK A — Export CSV clienti
```
Crea: src/app/api/export/clienti/route.ts
Permesso richiesto: clients:read_all
Colonne CSV: Nome, Cognome, Telefono, Email, Stato, Data creazione
Aggiungi bottone "Esporta CSV" in: src/app/(dashboard)/clienti/page.tsx
```

### TASK B — Export CSV fatture
```
Crea: src/app/api/export/fatture/route.ts
Permesso richiesto: invoices:read
Colonne CSV: Numero, Cliente, Totale CHF, Stato, Scadenza
Aggiungi bottone "Esporta CSV" in: src/app/(dashboard)/fatture/page.tsx
```

### TASK C — Grafico fatturato dashboard
```
Modifica: src/app/(dashboard)/page.tsx
Aggiungi sotto le StatCard:
- Grafico SVG inline (no librerie esterne) del fatturato mensile ultimi 6 mesi
- Dati da: prisma.invoice.findMany({ where: { status: 'PAGATA' }, select: { total, paidAt } })
- Barre verticali semplici, etichette mese in italiano, importi in CHF
```

### TASK D — Pagina profilo utente
```
Crea: src/app/(dashboard)/impostazioni/profilo/page.tsx
Crea: src/app/(dashboard)/impostazioni/profilo/actions.ts
Features:
- Form cambio nome → Server Action → prisma.user.update() → revalidatePath
- Form cambio password → bcryptjs.hash() → prisma.user.update()
- Upload avatar → src/lib/storage.ts uploadFile() → salva URL in user.image
```

### TASK E — Agente report AI settimanale
```
Crea: src/lib/ai/agents/report.ts
Pattern uguale a: src/lib/ai/agents/sales.ts
Tool da implementare: generaReport
- Conta clienti per stato
- Lista preventivi in attesa con totale CHF
- Lista fatture scadute
- Restituisce testo formattato
Registra l'agente in: src/lib/ai/agents/index.ts
```

---

## Come testare
```bash
npm run dev          # → http://localhost:3000
npm run db:studio    # → Prisma Studio
```
Login: `titolare@bolero.local` / `Bolero2026!`

---

## Commit
Dopo ogni task completato:
```bash
git add -A
git commit -m "feat: descrizione di cosa hai fatto"
```
