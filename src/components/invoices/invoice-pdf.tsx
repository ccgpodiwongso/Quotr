import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer'
import type { Invoice, InvoiceLine, Client, Company } from '@/types/database'

// ---------------------------------------------------------------------------
// Register a clean sans-serif font (Helvetica is built-in)
// ---------------------------------------------------------------------------

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica' },
    { src: 'Helvetica-Bold', fontWeight: 'bold' },
  ],
})

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const colors = {
  primary: '#111112',
  muted: '#71717a',
  border: '#e4e4e7',
  background: '#fafafa',
  white: '#ffffff',
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: colors.primary,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 40,
    objectFit: 'contain' as const,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'right' as const,
  },
  invoiceNumber: {
    fontSize: 10,
    color: colors.muted,
    textAlign: 'right' as const,
    marginTop: 2,
  },
  // Parties
  partiesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  partyBlock: {
    width: '48%',
  },
  partyLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    color: colors.muted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  partyName: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  partyLine: {
    fontSize: 9,
    color: colors.muted,
    lineHeight: 1.5,
  },
  // Dates row
  datesRow: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dateBlock: {
    flexDirection: 'column',
  },
  dateLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    color: colors.muted,
    letterSpacing: 1,
    marginBottom: 3,
  },
  dateValue: {
    fontSize: 9,
  },
  // Table
  table: {
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  colDescription: { width: '40%' },
  colQuantity: { width: '12%', textAlign: 'right' as const },
  colUnitPrice: { width: '18%', textAlign: 'right' as const },
  colVat: { width: '12%', textAlign: 'right' as const },
  colTotal: { width: '18%', textAlign: 'right' as const },
  headerText: {
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    color: colors.muted,
    letterSpacing: 0.5,
  },
  cellText: {
    fontSize: 9,
  },
  cellMono: {
    fontSize: 9,
    fontFamily: 'Courier',
  },
  // Totals
  totalsContainer: {
    alignItems: 'flex-end' as const,
    marginBottom: 32,
  },
  totalsBox: {
    width: 220,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalsDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginVertical: 4,
  },
  totalsGrandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  totalsLabel: {
    fontSize: 9,
    color: colors.muted,
  },
  totalsValue: {
    fontSize: 9,
    fontFamily: 'Courier',
  },
  totalsGrandLabel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  totalsGrandValue: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Courier',
  },
  // Notes
  notesSection: {
    marginBottom: 24,
  },
  notesLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    color: colors.muted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: colors.muted,
    lineHeight: 1.6,
  },
  // Payment
  paymentSection: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 4,
    marginBottom: 24,
  },
  paymentLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    color: colors.muted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  paymentLine: {
    fontSize: 9,
    lineHeight: 1.6,
  },
  // Footer
  footer: {
    position: 'absolute' as const,
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: colors.muted,
  },
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(amount: number): string {
  return `\u20AC ${amount.toFixed(2).replace('.', ',')}`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Group VAT amounts by rate
function groupVat(lines: InvoiceLine[]): { rate: number; amount: number }[] {
  const map = new Map<number, number>()
  for (const line of lines) {
    const vatAmount = line.quantity * line.unit_price * (line.tax_rate / 100)
    map.set(line.tax_rate, (map.get(line.tax_rate) ?? 0) + vatAmount)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([rate, amount]) => ({ rate, amount }))
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface InvoicePdfProps {
  invoice: Invoice
  lines: InvoiceLine[]
  client: Client
  company: Company
}

export function InvoicePdfDocument({
  invoice,
  lines,
  client,
  company,
}: InvoicePdfProps) {
  const vatGroups = groupVat(lines)
  const notes = (invoice.metadata as Record<string, unknown>)?.notes as
    | string
    | undefined

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {company.logo_url ? (
              <Image src={company.logo_url} style={styles.logo} />
            ) : (
              <Text style={styles.companyName}>{company.name}</Text>
            )}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>FACTUUR</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
          </View>
        </View>

        {/* From / To */}
        <View style={styles.partiesRow}>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>Van</Text>
            <Text style={styles.partyName}>{company.name}</Text>
            {company.address_line1 && (
              <Text style={styles.partyLine}>{company.address_line1}</Text>
            )}
            {company.address_line2 && (
              <Text style={styles.partyLine}>{company.address_line2}</Text>
            )}
            {(company.postal_code || company.city) && (
              <Text style={styles.partyLine}>
                {[company.postal_code, company.city].filter(Boolean).join(' ')}
              </Text>
            )}
            {company.kvk_number && (
              <Text style={styles.partyLine}>KVK: {company.kvk_number}</Text>
            )}
            {company.btw_number && (
              <Text style={styles.partyLine}>BTW: {company.btw_number}</Text>
            )}
          </View>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>Aan</Text>
            <Text style={styles.partyName}>{client.name}</Text>
            {client.contact_person && (
              <Text style={styles.partyLine}>
                t.a.v. {client.contact_person}
              </Text>
            )}
            {client.address_line1 && (
              <Text style={styles.partyLine}>{client.address_line1}</Text>
            )}
            {client.address_line2 && (
              <Text style={styles.partyLine}>{client.address_line2}</Text>
            )}
            {(client.postal_code || client.city) && (
              <Text style={styles.partyLine}>
                {[client.postal_code, client.city].filter(Boolean).join(' ')}
              </Text>
            )}
            {client.kvk_number && (
              <Text style={styles.partyLine}>KVK: {client.kvk_number}</Text>
            )}
            {client.btw_number && (
              <Text style={styles.partyLine}>BTW: {client.btw_number}</Text>
            )}
          </View>
        </View>

        {/* Dates */}
        <View style={styles.datesRow}>
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>Factuurdatum</Text>
            <Text style={styles.dateValue}>{fmtDate(invoice.created_at)}</Text>
          </View>
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>Vervaldatum</Text>
            <Text style={styles.dateValue}>{fmtDate(invoice.due_date)}</Text>
          </View>
          {invoice.paid_at && (
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>Betaald op</Text>
              <Text style={styles.dateValue}>{fmtDate(invoice.paid_at)}</Text>
            </View>
          )}
        </View>

        {/* Line items table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, styles.colDescription]}>
              Omschrijving
            </Text>
            <Text style={[styles.headerText, styles.colQuantity]}>Aantal</Text>
            <Text style={[styles.headerText, styles.colUnitPrice]}>Prijs</Text>
            <Text style={[styles.headerText, styles.colVat]}>BTW</Text>
            <Text style={[styles.headerText, styles.colTotal]}>Totaal</Text>
          </View>
          {lines.map((line) => (
            <View key={line.id} style={styles.tableRow}>
              <Text style={[styles.cellText, styles.colDescription]}>
                {line.description}
              </Text>
              <Text style={[styles.cellMono, styles.colQuantity]}>
                {line.quantity}
              </Text>
              <Text style={[styles.cellMono, styles.colUnitPrice]}>
                {fmt(line.unit_price)}
              </Text>
              <Text style={[styles.cellText, styles.colVat]}>
                {line.tax_rate}%
              </Text>
              <Text style={[styles.cellMono, styles.colTotal]}>
                {fmt(line.quantity * line.unit_price)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotaal</Text>
              <Text style={styles.totalsValue}>{fmt(invoice.subtotal)}</Text>
            </View>
            {vatGroups.map((g) => (
              <View key={g.rate} style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>BTW {g.rate}%</Text>
                <Text style={styles.totalsValue}>{fmt(g.amount)}</Text>
              </View>
            ))}
            <View style={styles.totalsGrandRow}>
              <Text style={styles.totalsGrandLabel}>Totaal</Text>
              <Text style={styles.totalsGrandValue}>{fmt(invoice.total)}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Opmerkingen</Text>
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        )}

        {/* Payment info */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentLabel}>Betaalgegevens</Text>
          <Text style={styles.paymentLine}>
            Gelieve het bedrag van {fmt(invoice.total)} over te maken naar:
          </Text>
          {company.iban && (
            <Text style={styles.paymentLine}>IBAN: {company.iban}</Text>
          )}
          <Text style={styles.paymentLine}>
            t.n.v. {company.name}
          </Text>
          <Text style={styles.paymentLine}>
            o.v.v. {invoice.invoice_number}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {company.name}
            {company.kvk_number ? ` | KVK ${company.kvk_number}` : ''}
            {company.btw_number ? ` | BTW ${company.btw_number}` : ''}
          </Text>
          <Text style={styles.footerText}>{invoice.invoice_number}</Text>
        </View>
      </Page>
    </Document>
  )
}
