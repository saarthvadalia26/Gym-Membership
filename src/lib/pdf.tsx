import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { formatINR } from "./currency";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#0284c7",
    paddingBottom: 12,
    marginBottom: 24,
  },
  gymName: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#0284c7" },
  gymMeta: { fontSize: 9, color: "#64748b", marginTop: 4 },
  title: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: 1,
  },
  row: { flexDirection: "row", marginBottom: 8 },
  label: {
    width: 140,
    color: "#64748b",
    fontFamily: "Helvetica-Bold",
  },
  value: { flex: 1 },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    marginVertical: 16,
  },
  pricingBlock: {
    backgroundColor: "#f0f9ff",
    padding: 12,
    marginTop: 8,
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  pricingLabel: { fontSize: 11, color: "#475569" },
  pricingValue: { fontSize: 11, color: "#0f172a" },
  pricingDiscount: { fontSize: 11, color: "#059669", fontFamily: "Helvetica-Bold" },
  pricingDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#bae6fd",
    marginVertical: 6,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  totalLabel: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  totalValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#0284c7",
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    textAlign: "center",
    fontSize: 9,
    color: "#94a3b8",
  },
});

export interface ReceiptData {
  receiptNumber: string;
  issuedAt: Date;
  memberName: string;
  memberPhone: string;
  planName: string;
  startDate: Date;
  endDate: Date;
  durationDays: number;
  originalPricePaise: number | null;
  pricePaidPaise: number;
  gymName: string;
  gymAddress: string;
  gymPhone: string;
}

function ReceiptDocument({ data }: { data: ReceiptData }) {
  const subtotal = data.originalPricePaise ?? data.pricePaidPaise;
  const discount = Math.max(subtotal - data.pricePaidPaise, 0);
  const hasDiscount = discount > 0;
  const discountPercent = hasDiscount && subtotal > 0
    ? Math.round((discount / subtotal) * 100)
    : 0;

  return (
    <Document title={`Receipt ${data.receiptNumber}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.gymName}>{data.gymName}</Text>
          <Text style={styles.gymMeta}>{data.gymAddress}</Text>
          <Text style={styles.gymMeta}>Phone: {data.gymPhone}</Text>
        </View>

        <Text style={styles.title}>PAYMENT RECEIPT</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Receipt No.</Text>
          <Text style={styles.value}>{data.receiptNumber}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>{format(data.issuedAt, "dd MMM yyyy, hh:mm a")}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Member Name</Text>
          <Text style={styles.value}>{data.memberName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Phone Number</Text>
          <Text style={styles.value}>{data.memberPhone}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Plan</Text>
          <Text style={styles.value}>{data.planName} ({data.durationDays} days)</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Start Date</Text>
          <Text style={styles.value}>{format(data.startDate, "dd MMM yyyy")}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>End Date</Text>
          <Text style={styles.value}>{format(data.endDate, "dd MMM yyyy")}</Text>
        </View>

        <View style={styles.pricingBlock}>
          {hasDiscount && (
            <>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Subtotal</Text>
                <Text style={styles.pricingValue}>{formatINR(subtotal)}</Text>
              </View>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingDiscount}>
                  Discount{discountPercent > 0 ? ` (${discountPercent}%)` : ""}
                </Text>
                <Text style={styles.pricingDiscount}>
                  − {formatINR(discount)}
                </Text>
              </View>
              <View style={styles.pricingDivider} />
            </>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>{formatINR(data.pricePaidPaise)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Thank you for choosing {data.gymName}. This is a system-generated receipt.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderReceiptPdf(data: ReceiptData): Promise<Buffer> {
  return renderToBuffer(<ReceiptDocument data={data} />);
}

export function buildReceiptNumber(subscriptionId: string, issuedAt: Date): string {
  const datePart = format(issuedAt, "yyyyMMdd");
  const idPart = subscriptionId.slice(-6).toUpperCase();
  return `RCP-${datePart}-${idPart}`;
}
