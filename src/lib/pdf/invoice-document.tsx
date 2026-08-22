import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1C1814" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  brand: { fontSize: 20, fontWeight: 700, color: "#A8682A", letterSpacing: 2 },
  brandSub: { fontSize: 8, color: "#8C8680", marginTop: 2, letterSpacing: 1 },
  docTitle: { fontSize: 12, fontWeight: 700, textAlign: "right" },
  docMeta: { fontSize: 9, color: "#4A453F", textAlign: "right", marginTop: 2 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 8, color: "#8C8680", letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" },
  clientName: { fontSize: 11, fontWeight: 700 },
  clientLine: { fontSize: 9, color: "#4A453F", marginTop: 1 },
  table: { marginTop: 8 },
  tableHeader: { flexDirection: "row", borderBottom: "1 solid #D8D2C8", paddingBottom: 6, marginBottom: 6 },
  tableRow: { flexDirection: "row", borderBottom: "0.5 solid #EDE7DC", paddingVertical: 6 },
  colDesc: { flex: 1 },
  colAmount: { width: 100, textAlign: "right" },
  headerText: { fontSize: 8, color: "#8C8680", textTransform: "uppercase" },
  totals: { marginTop: 16, alignItems: "flex-end" },
  grandTotal: {
    flexDirection: "row", justifyContent: "space-between",
    width: 200, marginTop: 6, paddingTop: 6, borderTop: "1 solid #1C1814",
  },
  grandTotalLabel: { fontSize: 11, fontWeight: 700 },
  grandTotalValue: { fontSize: 11, fontWeight: 700 },
  paymentBox: {
    marginTop: 24, padding: 12, backgroundColor: "#F5F0E8",
    borderRadius: 4,
  },
  paymentLabel: { fontSize: 8, color: "#8C8680", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 },
  paymentText: { fontSize: 9, color: "#1C1814" },
  notes: { marginTop: 24, fontSize: 9, color: "#4A453F" },
  footer: {
    position: "absolute", bottom: 30, left: 40, right: 40,
    fontSize: 8, color: "#8C8680", textAlign: "center",
  },
});

function money(n: number) {
  return `CHF ${n.toLocaleString("it-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function InvoicePdfDocument({
  number,
  issuedAt,
  dueDate,
  client,
  items,
  total,
  notes,
  iban,
}: {
  number: string;
  issuedAt: Date;
  dueDate: Date;
  client: { name: string; surname: string; address: string | null; city: string | null; email: string | null; phone: string | null };
  items: { description: string; amount: number }[];
  total: number;
  notes?: string | null;
  iban?: string | null;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>BOLERO</Text>
            <Text style={styles.brandSub}>MONTAGGIO · TENDE · PERGOLE</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>Fattura {number}</Text>
            <Text style={styles.docMeta}>Data: {issuedAt.toLocaleDateString("it-CH")}</Text>
            <Text style={styles.docMeta}>Scadenza: {dueDate.toLocaleDateString("it-CH")}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Cliente</Text>
          <Text style={styles.clientName}>{client.name} {client.surname}</Text>
          {(client.address || client.city) && (
            <Text style={styles.clientLine}>
              {[client.address, client.city].filter(Boolean).join(", ")}
            </Text>
          )}
          {client.phone && <Text style={styles.clientLine}>Tel. {client.phone}</Text>}
          {client.email && <Text style={styles.clientLine}>{client.email}</Text>}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDesc, styles.headerText]}>Descrizione</Text>
            <Text style={[styles.colAmount, styles.headerText]}>Importo</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colAmount}>{money(item.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Totale IVA inclusa</Text>
            <Text style={styles.grandTotalValue}>{money(total)}</Text>
          </View>
        </View>

        {(iban || notes) && (
          <View style={styles.paymentBox}>
            <Text style={styles.paymentLabel}>Coordinate di pagamento</Text>
            {iban && <Text style={styles.paymentText}>IBAN: {iban}</Text>}
            {notes && <Text style={[styles.paymentText, { marginTop: 4 }]}>{notes}</Text>}
          </View>
        )}

        <Text style={styles.footer}>
          BOLERO — Documento generato automaticamente dal gestionale aziendale.
        </Text>
      </Page>
    </Document>
  );
}
