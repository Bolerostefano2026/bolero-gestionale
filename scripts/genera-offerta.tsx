import { renderToFile, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import path from "path";

/**
 * Genera il PDF dell'offerta commerciale, pronto per la stampa su A4.
 * Uso: npx tsx scripts/genera-offerta.tsx
 */

const COPPER = "#A8682A";
const INK = "#1C1814";
const INK2 = "#4A453F";
const INK3 = "#8C8680";
const FOG = "#D8D2C8";
const SUNKEN = "#F2EDE4";
const COPPER_BG = "#FBF4EA";

const s = StyleSheet.create({
  page: { paddingTop: 42, paddingBottom: 56, paddingHorizontal: 48, fontSize: 9.5, fontFamily: "Helvetica", color: INK2, lineHeight: 1.5 },

  hdr: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottomWidth: 2, borderBottomColor: COPPER, paddingBottom: 12, marginBottom: 18 },
  brand: { fontSize: 19, fontFamily: "Helvetica-Bold", color: COPPER, letterSpacing: 2 },
  brandSub: { fontSize: 6.5, color: INK3, letterSpacing: 1.4, marginTop: 3 },
  docBox: { alignItems: "flex-end" },
  docTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 3 },
  docMeta: { fontSize: 8, color: INK2 },

  parties: { flexDirection: "row", gap: 24, marginBottom: 20 },
  party: { flex: 1 },
  lbl: { fontSize: 6.5, fontFamily: "Helvetica-Bold", color: INK3, letterSpacing: 1.2, marginBottom: 4 },
  pName: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 2 },
  pLine: { fontSize: 8.5, color: INK2, marginBottom: 1.5 },

  h2: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: INK, marginTop: 16, marginBottom: 7, paddingBottom: 3, borderBottomWidth: 0.5, borderBottomColor: FOG },
  h3: { fontSize: 9, fontFamily: "Helvetica-Bold", color: INK, marginTop: 10, marginBottom: 4 },
  p: { marginBottom: 6 },
  b: { fontFamily: "Helvetica-Bold", color: INK },

  li: { flexDirection: "row", marginBottom: 2.5, paddingRight: 8 },
  liDot: { width: 10, color: COPPER },
  liTxt: { flex: 1 },

  tHead: { flexDirection: "row", backgroundColor: SUNKEN, paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: FOG },
  tHeadTxt: { fontSize: 6.5, fontFamily: "Helvetica-Bold", color: INK3, letterSpacing: 0.8 },
  tRow: { flexDirection: "row", paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: FOG },
  tRowTot: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 6, borderTopWidth: 1.2, borderTopColor: INK },
  c1: { flex: 1.1, color: INK },
  c2: { flex: 2 },
  cNum: { width: 78, textAlign: "right" },
  totTxt: { fontFamily: "Helvetica-Bold", color: INK, fontSize: 10 },

  priceBox: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: COPPER_BG, borderWidth: 1, borderColor: COPPER, borderRadius: 3, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 8 },
  priceK: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: INK },
  priceSub: { fontSize: 8, color: INK2, marginTop: 1 },
  priceV: { fontSize: 15, fontFamily: "Helvetica-Bold", color: COPPER },

  note: { backgroundColor: "#FBF3E0", borderLeftWidth: 2.5, borderLeftColor: "#8A6B1A", paddingVertical: 7, paddingHorizontal: 10, marginVertical: 8, fontSize: 8.5 },

  clause: { marginBottom: 8 },
  clauseN: { fontSize: 8, fontFamily: "Helvetica-Bold", color: COPPER, marginBottom: 1.5 },
  clauseP: { fontSize: 8.5 },

  sign: { flexDirection: "row", gap: 40, marginTop: 26, paddingTop: 14, borderTopWidth: 0.5, borderTopColor: FOG },
  signCol: { flex: 1 },
  signLine: { borderBottomWidth: 0.8, borderBottomColor: INK3, marginTop: 34, marginBottom: 4 },
  signCap: { fontSize: 7.5, color: INK3 },

  footer: { position: "absolute", bottom: 26, left: 48, right: 48, borderTopWidth: 0.5, borderTopColor: FOG, paddingTop: 6, flexDirection: "row", justifyContent: "space-between" },
  footTxt: { fontSize: 7, color: INK3 },
});

function Li({ children }: { children: string }) {
  return (
    <View style={s.li}>
      <Text style={s.liDot}>•</Text>
      <Text style={s.liTxt}>{children}</Text>
    </View>
  );
}

function Clause({ n, t, children }: { n: string; t: string; children: React.ReactNode }) {
  return (
    <View style={s.clause} wrap={false}>
      <Text style={s.clauseN}>
        {n}  {t}
      </Text>
      <Text style={s.clauseP}>{children}</Text>
    </View>
  );
}

const MODULI: [string, string][] = [
  ["Clienti", "Anagrafica completa con cronologia unificata di ogni contatto, lavoro e documento"],
  ["Calendario", "Appuntamenti, sopralluoghi e montaggi con assegnazione ai collaboratori"],
  ["Preventivi", "Creazione, versionamento storico, generazione PDF, gestione stati fino all'approvazione"],
  ["Prodotti e misure", "Schede di rilevamento personalizzabili per ogni prodotto, con foto da telefono"],
  ["Anteprima 3D", "Visualizzazione tridimensionale generata dalle misure rilevate"],
  ["Workflow", "Avanzamento dei lavori su 15 fasi, dal primo contatto alla chiusura, con storico"],
  ["Fatture e pagamenti", "Emissione, registrazione incassi, rilevamento automatico degli insoluti"],
  ["Comunicazione", "Chat interna collegata ai clienti e notifiche automatiche"],
  ["Assistente AI", "Riepilogo operativo giornaliero e ricerca in linguaggio naturale, con conferma su ogni modifica"],
  ["Ricerca globale", "Ricerca istantanea su clienti, preventivi, lavori, misure e fatture"],
];

const CANONE: [string, string, string][] = [
  ["Sviluppo evolutivo", "8 ore al mese di sviluppo di nuove funzioni concordate", "CHF 500.—"],
  ["Supporto", "Assistenza per problemi e domande, risposta entro 24 ore lavorative", "CHF 200.—"],
  ["Manutenzione", "Aggiornamenti, correzioni e aggiornamenti di sicurezza", "CHF 180.—"],
  ["Infrastruttura", "Hosting, banca dati, backup automatici, servizio AI", "CHF 120.—"],
];

function Offerta() {
  return (
    <Document title="Offerta BOLERO" author="Daniele Tarantino">
      <Page size="A4" style={s.page}>
        <View style={s.hdr}>
          <View>
            <Text style={s.brand}>BOLERO</Text>
            <Text style={s.brandSub}>GESTIONALE AZIENDALE SU MISURA</Text>
          </View>
          <View style={s.docBox}>
            <Text style={s.docTitle}>Offerta n. ______________</Text>
            <Text style={s.docMeta}>Data: ____ / ____ / 2026</Text>
            <Text style={s.docMeta}>Validità: 30 giorni</Text>
          </View>
        </View>

        <View style={s.parties}>
          <View style={s.party}>
            <Text style={s.lbl}>FORNITORE</Text>
            <Text style={s.pName}>Daniele Tarantino</Text>
            <Text style={s.pLine}>_______________________________</Text>
            <Text style={s.pLine}>_______________________________</Text>
            <Text style={s.pLine}>danieletarantino01@gmail.com</Text>
            <Text style={s.pLine}>Tel. ___________________________</Text>
          </View>
          <View style={s.party}>
            <Text style={s.lbl}>COMMITTENTE</Text>
            <Text style={s.pName}>_______________________________</Text>
            <Text style={s.pLine}>_______________________________</Text>
            <Text style={s.pLine}>_______________________________</Text>
            <Text style={s.pLine}>All'attenzione di:</Text>
            <Text style={s.pLine}>_______________________________</Text>
          </View>
        </View>

        <Text style={s.h2}>1. Oggetto</Text>
        <Text style={s.p}>
          Fornitura in licenza d&apos;uso del gestionale aziendale <Text style={s.b}>BOLERO</Text>, sviluppato
          su misura per l&apos;attività di montaggio, tende, pergole e pergotende del Committente, e relativo
          servizio continuativo di manutenzione, supporto e sviluppo evolutivo.
        </Text>

        <Text style={s.h2}>2. Cosa comprende la fornitura</Text>
        <Text style={s.p}>
          Il sistema è <Text style={s.b}>già realizzato, installato e funzionante</Text>, accessibile da
          computer, tablet e telefono tramite indirizzo web riservato, con accesso protetto da credenziali
          personali per ciascun utente.
        </Text>

        <View style={s.tHead}>
          <Text style={[s.tHeadTxt, s.c1]}>MODULO</Text>
          <Text style={[s.tHeadTxt, s.c2]}>FUNZIONE</Text>
        </View>
        {MODULI.map(([m, f]) => (
          <View style={s.tRow} key={m}>
            <Text style={s.c1}>{m}</Text>
            <Text style={s.c2}>{f}</Text>
          </View>
        ))}

        <Text style={[s.p, { marginTop: 8 }]}>
          Sono compresi: configurazione iniziale, creazione degli utenti con i rispettivi livelli di accesso,
          caricamento dei dati esistenti forniti dal Committente e mezza giornata di formazione in sede.
        </Text>

        <Text style={s.h2}>3. Corrispettivo</Text>

        <View style={s.priceBox}>
          <View>
            <Text style={s.priceK}>Fornitura e avvio</Text>
            <Text style={s.priceSub}>Una tantum, alla firma</Text>
          </View>
          <Text style={s.priceV}>CHF 7&apos;500.—</Text>
        </View>

        <View style={s.priceBox}>
          <View>
            <Text style={s.priceK}>Servizio continuativo</Text>
            <Text style={s.priceSub}>Mensile, dal mese successivo all&apos;avvio</Text>
          </View>
          <Text style={s.priceV}>CHF 1&apos;000.—/mese</Text>
        </View>

        <Text style={{ fontSize: 8, color: INK3 }}>
          Importi al netto dell&apos;IVA, se dovuta. Fatturazione dell&apos;una tantum alla firma; canone
          fatturato mensilmente o trimestralmente a scelta del Committente.
        </Text>

        <View style={s.footer} fixed>
          <Text style={s.footTxt}>Offerta BOLERO — Daniele Tarantino</Text>
          <Text style={s.footTxt} render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} di ${totalPages}`} />
        </View>
      </Page>

      <Page size="A4" style={s.page}>
        <Text style={s.h2}>4. Cosa comprende il canone mensile</Text>
        <Text style={s.p}>
          Il canone non è una semplice assistenza: comprende un monte ore di sviluppo garantito, con cui il
          gestionale continua a crescere secondo le necessità del Committente.
        </Text>

        <View style={s.tHead}>
          <Text style={[s.tHeadTxt, s.c1]}>VOCE</Text>
          <Text style={[s.tHeadTxt, s.c2]}>CONTENUTO</Text>
          <Text style={[s.tHeadTxt, s.cNum]}>VALORE</Text>
        </View>
        {CANONE.map(([v, c, i]) => (
          <View style={s.tRow} key={v}>
            <Text style={s.c1}>{v}</Text>
            <Text style={s.c2}>{c}</Text>
            <Text style={s.cNum}>{i}</Text>
          </View>
        ))}
        <View style={s.tRowTot}>
          <Text style={[s.c1, s.totTxt]}>Totale mensile</Text>
          <Text style={s.c2}> </Text>
          <Text style={[s.cNum, s.totTxt]}>CHF 1&apos;000.—</Text>
        </View>

        <View style={s.note}>
          <Text>
            <Text style={s.b}>Le 8 ore mensili</Text> sono concordate di volta in volta con il Committente e
            destinate alle priorità che indica. Le ore non utilizzate si accumulano fino a un massimo di 16 ore,
            per permettere di concentrare il lavoro su interventi più corposi. Ore eccedenti su richiesta:
            CHF 120.— all&apos;ora.
          </Text>
        </View>

        <Text style={s.h3}>Sviluppi già individuati</Text>
        <Text style={[s.p, { fontSize: 8.5 }]}>
          Con le ore comprese nel canone verranno realizzati progressivamente, secondo le priorità che il
          Committente indicherà:
        </Text>
        <Li>Adeguamento completo ai requisiti svizzeri di fatturazione, inclusa la QR-fattura</Li>
        <Li>Gestione fornitori con confronto delle offerte e riservatezza dei dati di fornitura</Li>
        <Li>Registro contabile di fatture e spese, con esportazione per il fiduciario</Li>
        <Li>Rendering 3D integrato nel preventivo consegnato al cliente</Li>
        <Li>Archivio documenti per cliente</Li>
        <Li>Strumenti di comunicazione interna tra il personale</Li>

        <Text style={s.h2}>5. Condizioni</Text>

        <Clause n="5.1" t="Durata">
          Il servizio continuativo ha una durata minima di 12 mesi dalla data di avvio. Trascorso tale periodo
          prosegue a tempo indeterminato, con facoltà di disdetta per entrambe le parti mediante preavviso
          scritto di 60 giorni.
        </Clause>

        <Clause n="5.2" t="Proprietà del software">
          Il codice sorgente resta di proprietà del Fornitore. Al Committente è concessa una licenza d&apos;uso
          perpetua, illimitata nel numero di utenti e non trasferibile, valida anche in caso di cessazione del
          servizio continuativo.
        </Clause>

        <Clause n="5.3" t="Proprietà dei dati">
          Tutti i dati inseriti nel gestionale — clienti, preventivi, fatture, documenti, fotografie — sono e
          restano di esclusiva proprietà del Committente. Il Fornitore li tratta unicamente per l&apos;erogazione
          del servizio e non ne fa altro uso.
        </Clause>

        <Clause n="5.4" t="Continuità e uscita">
          In caso di cessazione del rapporto, per qualsiasi causa, il Fornitore consegna entro 30 giorni
          l&apos;esportazione completa dei dati in formato leggibile e una copia del software funzionante, con la
          documentazione necessaria a trasferirlo ad altro tecnico. Il Committente non resta in alcun caso
          prigioniero del sistema.
        </Clause>

        <Clause n="5.5" t="Infrastruttura">
          Il servizio è erogato su infrastruttura professionale con banca dati ubicata nell&apos;Unione Europea e
          backup automatici quotidiani. Su richiesta del Committente è possibile valutare lo spostamento in
          territorio svizzero, con adeguamento del canone.
        </Clause>

        <Clause n="5.6" t="Limiti di responsabilità">
          Il Fornitore garantisce il corretto funzionamento delle funzioni realizzate e interviene tempestivamente
          in caso di malfunzionamento. La correttezza fiscale e contabile dei documenti emessi resta in capo al
          Committente e al suo fiduciario, che ne validano la conformità prima dell&apos;uso verso terzi.
        </Clause>

        <Clause n="5.7" t="Esclusioni">
          Non sono compresi: licenze di software di terzi eventualmente richieste, consulenza fiscale o contabile,
          formazione oltre quella indicata al punto 2, migrazione di dati da sistemi non concordati, interventi
          resi necessari da uso improprio.
        </Clause>

        <Clause n="5.8" t="Riservatezza">
          Il Fornitore si impegna a mantenere riservata ogni informazione aziendale, commerciale e tecnica di cui
          venga a conoscenza, anche dopo la cessazione del rapporto.
        </Clause>

        <Text style={s.h2}>6. Accettazione</Text>
        <Text style={[s.p, { fontSize: 8.5 }]}>
          La sottoscrizione della presente offerta vale come conferma d&apos;ordine. Il servizio ha avvio entro
          5 giorni lavorativi dalla firma.
        </Text>

        <View style={s.sign}>
          <View style={s.signCol}>
            <Text style={s.lbl}>IL FORNITORE</Text>
            <View style={s.signLine} />
            <Text style={s.signCap}>Daniele Tarantino — Luogo e data</Text>
          </View>
          <View style={s.signCol}>
            <Text style={s.lbl}>IL COMMITTENTE</Text>
            <View style={s.signLine} />
            <Text style={s.signCap}>Timbro e firma — Luogo e data</Text>
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footTxt}>Offerta BOLERO — Daniele Tarantino</Text>
          <Text style={s.footTxt} render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} di ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

const out = path.join(process.cwd(), "Offerta-BOLERO.pdf");
renderToFile(<Offerta />, out).then(() => console.log("PDF generato:", out));
