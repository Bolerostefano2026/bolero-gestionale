import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1C1814" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  brand: { fontSize: 20, fontWeight: 700, color: "#A8682A", letterSpacing: 2 },
  brandSub: { fontSize: 8, color: "#8C8680", marginTop: 2, letterSpacing: 1 },
  docTitle: { fontSize: 12, fontWeight: 700, textAlign: "right" },
  docMeta: { fontSize: 9, color: "#4A453F", textAlign: "right", marginTop: 2 },
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 8,
    color: "#8C8680",
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  clientName: { fontSize: 11, fontWeight: 700 },
  clientLine: { fontSize: 9, color: "#4A453F", marginTop: 1 },
  table: { marginTop: 8 },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "1 solid #D8D2C8",
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "0.5 solid #EDE7DC",
    paddingVertical: 6,
  },
  colDesc: { flex: 1 },
  colQty: { width: 60, textAlign: "right" },
  colPrice: { width: 80, textAlign: "right" },
  colTotal: { width: 80, textAlign: "right" },
  headerText: { fontSize: 8, color: "#8C8680", textTransform: "uppercase" },
  totals: { marginTop: 16, alignItems: "flex-end" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", width: 200, marginBottom: 3 },
  totalLabel: { fontSize: 9, color: "#4A453F" },
  totalValue: { fontSize: 9 },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
    marginTop: 6,
    paddingTop: 6,
    borderTop: "1 solid #1C1814",
  },
  grandTotalLabel: { fontSize: 11, fontWeight: 700 },
  grandTotalValue: { fontSize: 11, fontWeight: 700 },
  notes: { marginTop: 24, fontSize: 9, color: "#4A453F" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#8C8680",
    textAlign: "center",
  },
});

function money(n: number) {
  return `€ ${n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function QuotePdfDocument({
  number,
  createdAt,
  validUntil,
  client,
  items,
  subtotal,
  discount,
  vatRate,
  total,
  notes,
}: {
  number: string;
  createdAt: Date;
  validUntil: Date | null;
  client: { name: string; surname: string; address: string | null; city: string | null; email: string | null; phone: string | null };
  items: { description: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  discount: number;
  vatRate: number;
  total: number;
  notes: string | null;
}) {
  const taxable = Math.max(subtotal - discount, 0);
  const vatAmount = taxable * (vatRate / 100);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>BOLERO</Text>
            <Text style={styles.brandSub}>MONTAGGIO · TENDE · PERGOLE</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>Preventivo {number}</Text>
            <Text style={styles.docMeta}>
              Data: {createdAt.toLocaleDateString("it-IT")}
            </Text>
            {validUntil && (
              <Text style={styles.docMeta}>
                Valido fino al {validUntil.toLocaleDateString("it-IT")}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Cliente</Text>
          <Text style={styles.clientName}>
            {client.name} {client.surname}
          </Text>
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
            <Text style={[styles.colQty, styles.headerText]}>Quantità</Text>
            <Text style={[styles.colPrice, styles.headerText]}>Prezzo unit.</Text>
            <Text style={[styles.colTotal, styles.headerText]}>Totale</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{money(item.unitPrice)}</Text>
              <Text style={styles.colTotal}>{money(item.quantity * item.unitPrice)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotale</Text>
            <Text style={styles.totalValue}>{money(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sconto</Text>
            <Text style={styles.totalValue}>−{money(discount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IVA ({vatRate}%)</Text>
            <Text style={styles.totalValue}>{money(vatAmount)}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Totale</Text>
            <Text style={styles.grandTotalValue}>{money(total)}</Text>
          </View>
        </View>

        {notes && (
          <View style={styles.notes}>
            <Text style={styles.sectionLabel}>Note</Text>
            <Text>{notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          BOLERO — Documento generato automaticamente dal gestionale aziendale.
        </Text>
      </Page>
    </Document>
  );
}
