'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  Download,
  Trash2,
  Edit,
  ExternalLink,
  CreditCard,
  Clock,
  AlertCircle,
  MailPlus,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Invoice, InvoiceLine, Client, Company } from '@/types/database'

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

interface InvoiceDetailClientProps {
  invoice: Invoice
  lines: InvoiceLine[]
  client: Client
  company: Company
}

const STATUS_MAP: Record<
  string,
  { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' }
> = {
  draft: { label: 'Concept', variant: 'default' },
  sent: { label: 'Verstuurd', variant: 'info' },
  paid: { label: 'Betaald', variant: 'success' },
  overdue: { label: 'Verlopen', variant: 'danger' },
}

function getEffectiveStatus(invoice: Invoice): string {
  if (invoice.status === 'sent' && new Date(invoice.due_date) < new Date()) {
    return 'overdue'
  }
  return invoice.status
}

function getStatusBadge(status: string) {
  const config = STATUS_MAP[status] ?? STATUS_MAP.draft
  return <Badge variant={config.variant}>{config.label}</Badge>
}

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

export function InvoiceDetailClient({
  invoice: initialInvoice,
  lines,
  client,
  company,
}: InvoiceDetailClientProps) {
  const router = useRouter()
  const [invoice, setInvoice] = useState(initialInvoice)
  const [loading, setLoading] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const effectiveStatus = getEffectiveStatus(invoice)
  const vatGroups = groupVat(lines)
  const metadata = (invoice.metadata ?? {}) as Record<string, unknown>
  const molliePaymentUrl = metadata.mollie_payment_url as string | undefined
  const notes = metadata.notes as string | undefined

  // Actions
  const handleSend = async () => {
    setLoading('send')
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/send`, {
        method: 'POST',
      })
      if (res.ok) {
        const data = await res.json()
        setInvoice((prev) => ({
          ...prev,
          status: 'sent',
          sent_at: data.sent_at,
        }))
      }
    } finally {
      setLoading(null)
    }
  }

  const handleMarkPaid = async () => {
    setLoading('paid')
    try {
      const now = new Date().toISOString()
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      })
      if (res.ok) {
        setInvoice((prev) => ({ ...prev, status: 'paid', paid_at: now }))
      }
    } finally {
      setLoading(null)
    }
  }

  const handleCreatePaymentLink = async () => {
    setLoading('mollie')
    try {
      const res = await fetch(
        `/api/invoices/${invoice.id}/mollie-payment`,
        { method: 'POST' },
      )
      if (res.ok) {
        const data = await res.json()
        setInvoice((prev) => ({
          ...prev,
          metadata: {
            ...(prev.metadata as Record<string, unknown>),
            mollie_payment_id: data.payment_id,
            mollie_payment_url: data.payment_url,
          },
        }))
      }
    } finally {
      setLoading(null)
    }
  }

  const handleDownloadPdf = () => {
    window.open(`/api/invoices/${invoice.id}/pdf`, '_blank')
  }

  const handleDelete = async () => {
    setLoading('delete')
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        router.push('/app/invoices')
      }
    } finally {
      setLoading(null)
      setDeleteOpen(false)
    }
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <PageHeader
        title={invoice.invoice_number}
        description={`Factuur voor ${client.name}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="ghost"
              onClick={() => router.push('/app/invoices')}
            >
              <ArrowLeft className="h-4 w-4" />
              Terug
            </Button>
            {invoice.status === 'draft' && (
              <Button
                variant="secondary"
                onClick={() =>
                  router.push(`/app/invoices/new?edit=${invoice.id}`)
                }
              >
                <Edit className="h-4 w-4" />
                Bewerken
              </Button>
            )}
            <Button variant="secondary" onClick={handleDownloadPdf}>
              <Download className="h-4 w-4" />
              PDF
            </Button>
            {invoice.status !== 'paid' && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice preview card */}
          <div className="bg-white border border-zinc-200 rounded-card shadow-sm overflow-hidden">
            {/* Header with status */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  {invoice.invoice_number}
                </h2>
                <p className="text-sm text-zinc-500 mt-0.5">
                  {formatDate(invoice.created_at)}
                </p>
              </div>
              {getStatusBadge(effectiveStatus)}
            </div>

            {/* Company + Client */}
            <div className="grid grid-cols-2 gap-6 px-6 py-5 border-b border-zinc-100">
              <div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                  Van
                </p>
                <p className="text-sm font-semibold text-zinc-900">
                  {company.name}
                </p>
                {company.address_line1 && (
                  <p className="text-sm text-zinc-500">
                    {company.address_line1}
                  </p>
                )}
                {(company.postal_code || company.city) && (
                  <p className="text-sm text-zinc-500">
                    {[company.postal_code, company.city]
                      .filter(Boolean)
                      .join(' ')}
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
                {company.iban && (
                  <p className="text-sm text-zinc-500">
                    IBAN: {company.iban}
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
                  <p className="text-sm text-zinc-500">
                    {client.address_line1}
                  </p>
                )}
                {(client.postal_code || client.city) && (
                  <p className="text-sm text-zinc-500">
                    {[client.postal_code, client.city]
                      .filter(Boolean)
                      .join(' ')}
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
              {invoice.paid_at && (
                <div>
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Betaald op
                  </p>
                  <p className="text-sm text-green-700 font-medium mt-1">
                    {formatDate(invoice.paid_at)}
                  </p>
                </div>
              )}
            </div>

            {/* Line items table */}
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
          </div>
        </div>

        {/* Sidebar — status actions */}
        <div className="space-y-6">
          {/* Status actions panel */}
          <Card title="Acties">
            <div className="space-y-3">
              {/* Draft actions */}
              {effectiveStatus === 'draft' && (
                <>
                  <Button
                    className="w-full justify-center"
                    onClick={handleSend}
                    loading={loading === 'send'}
                    disabled={loading !== null}
                  >
                    <Send className="h-4 w-4" />
                    Versturen naar klant
                  </Button>
                  <p className="text-xs text-zinc-500 text-center">
                    De factuur wordt per e-mail verstuurd naar {client.email}
                  </p>
                </>
              )}

              {/* Sent actions */}
              {effectiveStatus === 'sent' && (
                <>
                  <Button
                    className="w-full justify-center"
                    onClick={handleMarkPaid}
                    loading={loading === 'paid'}
                    disabled={loading !== null}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Markeer als betaald
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full justify-center"
                    onClick={handleSend}
                    loading={loading === 'send'}
                    disabled={loading !== null}
                  >
                    <MailPlus className="h-4 w-4" />
                    Opnieuw versturen
                  </Button>
                  {!molliePaymentUrl && (
                    <Button
                      variant="secondary"
                      className="w-full justify-center"
                      onClick={handleCreatePaymentLink}
                      loading={loading === 'mollie'}
                      disabled={loading !== null}
                    >
                      <CreditCard className="h-4 w-4" />
                      Betaallink aanmaken
                    </Button>
                  )}
                </>
              )}

              {/* Overdue actions */}
              {effectiveStatus === 'overdue' && (
                <>
                  <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-700">
                      Deze factuur is verlopen. De vervaldatum was{' '}
                      {formatDate(invoice.due_date)}.
                    </p>
                  </div>
                  <Button
                    className="w-full justify-center"
                    onClick={handleMarkPaid}
                    loading={loading === 'paid'}
                    disabled={loading !== null}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Markeer als betaald
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full justify-center"
                    onClick={handleSend}
                    loading={loading === 'send'}
                    disabled={loading !== null}
                  >
                    <MailPlus className="h-4 w-4" />
                    Herinnering versturen
                  </Button>
                </>
              )}

              {/* Paid status */}
              {effectiveStatus === 'paid' && (
                <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-3">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Betaald
                    </p>
                    {invoice.paid_at && (
                      <p className="text-sm text-green-700 mt-0.5">
                        op {formatDate(invoice.paid_at)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Mollie payment link */}
          {molliePaymentUrl && (
            <Card title="Betaallink">
              <div className="space-y-3">
                <p className="text-sm text-zinc-600">
                  Er is een Mollie betaallink aangemaakt voor deze factuur.
                </p>
                <a
                  href={molliePaymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Betaallink openen
                </a>
              </div>
            </Card>
          )}

          {/* Info card */}
          <Card title="Details">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Klant</span>
                <span className="text-zinc-900 font-medium">{client.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Factuurdatum</span>
                <span className="text-zinc-900">
                  {formatDate(invoice.created_at)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Vervaldatum</span>
                <span className="text-zinc-900">
                  {formatDate(invoice.due_date)}
                </span>
              </div>
              {invoice.sent_at && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Verstuurd op</span>
                  <span className="text-zinc-900">
                    {formatDate(invoice.sent_at)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-500">Totaal</span>
                <span className="text-zinc-900 font-mono font-semibold">
                  {formatCurrency(invoice.total)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Factuur verwijderen"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Annuleren
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={loading === 'delete'}
            >
              Verwijderen
            </Button>
          </>
        }
      >
        <p className="text-sm text-zinc-600">
          Weet je zeker dat je factuur{' '}
          <strong>{invoice.invoice_number}</strong> wilt verwijderen? Dit kan
          niet ongedaan worden gemaakt.
        </p>
      </Modal>
    </div>
  )
}
