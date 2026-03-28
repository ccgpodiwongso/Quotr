'use client'

import {
  CheckCircle2,
  CreditCard,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Invoice, InvoiceLine, Client, Company } from '@/types/database'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PublicInvoiceViewProps {
  invoice: Invoice
  lines: InvoiceLine[]
  client: Client
  company: Company
  molliePaymentUrl?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

export function PublicInvoiceView({
  invoice,
  lines,
  client,
  company,
  molliePaymentUrl,
}: PublicInvoiceViewProps) {
  const isPaid = invoice.status === 'paid'
  const isOverdue =
    invoice.status === 'sent' && new Date(invoice.due_date) < new Date()
  const vatGroups = groupVat(lines)
  const notes = ((invoice.metadata ?? {}) as Record<string, unknown>).notes as
    | string
    | undefined

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Paid banner */}
      {isPaid && (
        <div className="mb-6 flex items-center gap-3 rounded-md border border-green-200 bg-green-50 px-5 py-4">
          <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
          <div>
            <p className="text-base font-semibold text-green-800">Betaald</p>
            {invoice.paid_at && (
              <p className="text-sm text-green-700">
                Deze factuur is betaald op {formatDate(invoice.paid_at)}.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Invoice card */}
      <div className="bg-white border border-zinc-200 rounded-card shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100">
                <Building2 className="h-5 w-5 text-zinc-500" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-semibold text-zinc-900">
                {company.name}
              </h1>
              <p className="text-sm text-zinc-500">
                Factuur {invoice.invoice_number}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold font-mono text-zinc-900">
              {formatCurrency(invoice.total)}
            </p>
            {isPaid ? (
              <Badge variant="success">Betaald</Badge>
            ) : isOverdue ? (
              <Badge variant="danger">Verlopen</Badge>
            ) : (
              <Badge variant="info">Open</Badge>
            )}
          </div>
        </div>

        {/* Company + Client info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-6 py-5 border-b border-zinc-100">
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
              Van
            </p>
            <p className="text-sm font-semibold text-zinc-900">
              {company.name}
            </p>
            {company.address_line1 && (
              <p className="text-sm text-zinc-500">{company.address_line1}</p>
            )}
            {(company.postal_code || company.city) && (
              <p className="text-sm text-zinc-500">
                {[company.postal_code, company.city].filter(Boolean).join(' ')}
              </p>
            )}
            {company.kvk_number && (
              <p className="text-sm text-zinc-500">
                KVK: {company.kvk_number}
              </p>
            )}
            {company.btw_number && (
              <p className="text-sm text-zinc-500">
                BTW: {company.btw_number}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
              Aan
            </p>
            <p className="text-sm font-semibold text-zinc-900">
              {client.name}
            </p>
            {client.contact_person && (
              <p className="text-sm text-zinc-500">
                t.a.v. {client.contact_person}
              </p>
            )}
            {client.address_line1 && (
              <p className="text-sm text-zinc-500">{client.address_line1}</p>
            )}
            {(client.postal_code || client.city) && (
              <p className="text-sm text-zinc-500">
                {[client.postal_code, client.city].filter(Boolean).join(' ')}
              </p>
            )}
            <p className="text-sm text-zinc-500">{client.email}</p>
          </div>
        </div>

        {/* Dates */}
        <div className="flex gap-8 px-6 py-4 border-b border-zinc-100">
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Factuurdatum
            </p>
            <p className="text-sm text-zinc-900 mt-1">
              {formatDate(invoice.created_at)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Vervaldatum
            </p>
            <p className="text-sm text-zinc-900 mt-1">
              {formatDate(invoice.due_date)}
            </p>
          </div>
        </div>

        {/* Line items */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/50">
                <th className="text-left px-6 py-3 font-medium text-zinc-500">
                  Omschrijving
                </th>
                <th className="text-right px-4 py-3 font-medium text-zinc-500">
                  Aantal
                </th>
                <th className="text-right px-4 py-3 font-medium text-zinc-500">
                  Prijs
                </th>
                <th className="text-right px-4 py-3 font-medium text-zinc-500">
                  BTW
                </th>
                <th className="text-right px-6 py-3 font-medium text-zinc-500">
                  Totaal
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr
                  key={line.id}
                  className="border-b border-zinc-100 last:border-b-0"
                >
                  <td className="px-6 py-3 text-zinc-900">
                    {line.description}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-700">
                    {line.quantity}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-700">
                    {formatCurrency(line.unit_price)}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-500">
                    {line.tax_rate}%
                  </td>
                  <td className="px-6 py-3 text-right font-mono font-medium text-zinc-900">
                    {formatCurrency(line.quantity * line.unit_price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50/30">
          <div className="flex flex-col items-end space-y-1">
            <div className="flex justify-between w-56 text-sm">
              <span className="text-zinc-500">Subtotaal</span>
              <span className="font-mono">
                {formatCurrency(invoice.subtotal)}
              </span>
            </div>
            {vatGroups.map((v) => (
              <div
                key={v.rate}
                className="flex justify-between w-56 text-sm"
              >
                <span className="text-zinc-500">BTW {v.rate}%</span>
                <span className="font-mono">
                  {formatCurrency(v.amount)}
                </span>
              </div>
            ))}
            <div className="flex justify-between w-56 text-base font-semibold border-t border-zinc-300 pt-2 mt-1">
              <span>Totaal</span>
              <span className="font-mono">
                {formatCurrency(invoice.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {notes && (
          <div className="px-6 py-4 border-t border-zinc-100">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
              Opmerkingen
            </p>
            <p className="text-sm text-zinc-600 whitespace-pre-wrap">
              {notes}
            </p>
          </div>
        )}

        {/* Payment info */}
        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
            Betaalgegevens
          </p>
          <div className="text-sm text-zinc-600 space-y-0.5">
            {company.iban && <p>IBAN: {company.iban}</p>}
            <p>t.n.v. {company.name}</p>
            <p>o.v.v. {invoice.invoice_number}</p>
          </div>
        </div>

        {/* Pay now button */}
        {!isPaid && molliePaymentUrl && (
          <div className="px-6 py-5 border-t border-zinc-200">
            <a href={molliePaymentUrl}>
              <Button className="w-full justify-center" size="lg">
                <CreditCard className="h-4 w-4" />
                Betaal nu
              </Button>
            </a>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-zinc-400">
          Powered by{' '}
          <a
            href="https://quotr.nl"
            className="font-medium text-zinc-500 hover:text-zinc-700 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Quotr
          </a>
        </p>
      </div>
    </div>
  )
}
