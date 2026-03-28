'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Trash2,
  Info,
  ArrowLeft,
  Save,
  Send,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { Client, Quote, QuoteLine, Company } from '@/types/database'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LineItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  tax_rate: number
}

interface InvoiceFormClientProps {
  clients: Client[]
  company: Company
  userId: string
  fromQuote: Quote | null
  quoteLines: QuoteLine[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function newLine(): LineItem {
  return {
    id: crypto.randomUUID(),
    description: '',
    quantity: 1,
    unit_price: 0,
    tax_rate: 21,
  }
}

function addDays(date: Date, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InvoiceFormClient({
  clients,
  company,
  userId,
  fromQuote,
  quoteLines,
}: InvoiceFormClientProps) {
  const router = useRouter()

  // Client selection
  const [clientMode, setClientMode] = useState<'existing' | 'new'>(
    fromQuote ? 'existing' : clients.length > 0 ? 'existing' : 'new',
  )
  const [selectedClientId, setSelectedClientId] = useState(
    fromQuote?.client_id ?? '',
  )
  const [newClientName, setNewClientName] = useState('')
  const [newClientEmail, setNewClientEmail] = useState('')

  // Dates
  const invoiceDueDays =
    (company.settings as Record<string, unknown>)?.invoice_due_days as number | undefined
  const defaultDueDays = invoiceDueDays ?? 30

  const [issueDate, setIssueDate] = useState(todayISO())
  const [dueDate, setDueDate] = useState(addDays(new Date(), defaultDueDays))

  // Notes
  const [notes, setNotes] = useState('')

  // Lines
  const [lines, setLines] = useState<LineItem[]>(() => {
    if (quoteLines.length > 0) {
      return quoteLines.map((ql) => ({
        id: crypto.randomUUID(),
        description: ql.description,
        quantity: ql.quantity,
        unit_price: ql.unit_price,
        tax_rate: ql.tax_rate,
      }))
    }
    return [newLine()]
  })

  // Saving state
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Computed totals
  const totals = useMemo(() => {
    const subtotal = lines.reduce(
      (sum, l) => sum + l.quantity * l.unit_price,
      0,
    )

    // Group VAT
    const vatMap = new Map<number, number>()
    for (const l of lines) {
      const vat = l.quantity * l.unit_price * (l.tax_rate / 100)
      vatMap.set(l.tax_rate, (vatMap.get(l.tax_rate) ?? 0) + vat)
    }
    const vatBreakdown = Array.from(vatMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([rate, amount]) => ({ rate, amount }))

    const taxTotal = vatBreakdown.reduce((s, v) => s + v.amount, 0)
    const total = subtotal + taxTotal

    return { subtotal, vatBreakdown, taxTotal, total }
  }, [lines])

  // Line handlers
  const updateLine = useCallback(
    (id: string, field: keyof LineItem, value: string | number) => {
      setLines((prev) =>
        prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)),
      )
    },
    [],
  )

  const removeLine = useCallback((id: string) => {
    setLines((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((l) => l.id !== id)
    })
  }, [])

  const addLine = useCallback(() => {
    setLines((prev) => [...prev, newLine()])
  }, [])

  // Submit
  const handleSubmit = async (sendImmediately: boolean) => {
    setError(null)
    setSaving(true)

    try {
      const payload: Record<string, unknown> = {
        due_date: dueDate,
        notes,
        status: sendImmediately ? 'sent' : 'draft',
        lines: lines.map((l, i) => ({
          description: l.description,
          quantity: l.quantity,
          unit_price: l.unit_price,
          tax_rate: l.tax_rate,
          sort_order: i,
        })),
      }

      if (clientMode === 'existing') {
        payload.client_id = selectedClientId
      } else {
        payload.client_name = newClientName
        payload.client_email = newClientEmail
      }

      if (fromQuote) {
        payload.quote_id = fromQuote.id
      }

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Er is een fout opgetreden.')
        return
      }

      // If sendImmediately, also trigger the send endpoint
      if (sendImmediately && data.invoice?.id) {
        await fetch(`/api/invoices/${data.invoice.id}/send`, {
          method: 'POST',
        })
      }

      router.push(`/app/invoices/${data.invoice.id}`)
    } catch {
      setError('Er is een onverwachte fout opgetreden.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <PageHeader
        title="Nieuwe factuur"
        description="Maak een nieuwe factuur aan"
        actions={
          <Button
            variant="ghost"
            onClick={() => router.push('/app/invoices')}
          >
            <ArrowLeft className="h-4 w-4" />
            Terug
          </Button>
        }
      />

      {/* From quote banner */}
      {fromQuote && (
        <div className="mb-6 flex items-start gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              Aangemaakt vanuit offerte {fromQuote.quote_number}
            </p>
            <p className="text-sm text-blue-700 mt-0.5">
              De regels en klantgegevens zijn overgenomen uit de offerte.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Client */}
        <Card title="Klant">
          <div className="space-y-4">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="client_mode"
                  checked={clientMode === 'existing'}
                  onChange={() => setClientMode('existing')}
                  className="accent-[#111112]"
                />
                Bestaande klant
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="client_mode"
                  checked={clientMode === 'new'}
                  onChange={() => setClientMode('new')}
                  className="accent-[#111112]"
                />
                Nieuwe klant
              </label>
            </div>

            {clientMode === 'existing' ? (
              <Select
                label="Klant"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
              >
                <option value="">Selecteer een klant...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </Select>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Bedrijfsnaam"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Bedrijf B.V."
                />
                <Input
                  label="E-mailadres"
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="info@bedrijf.nl"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Dates */}
        <Card title="Datums">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Factuurdatum"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
            <Input
              label="Vervaldatum"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </Card>

        {/* Line items */}
        <Card title="Factuurregels">
          <div className="space-y-3">
            {/* Header */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-xs font-medium text-zinc-500 px-1">
              <div className="col-span-4">Omschrijving</div>
              <div className="col-span-2 text-right">Aantal</div>
              <div className="col-span-2 text-right">Prijs</div>
              <div className="col-span-2 text-right">BTW %</div>
              <div className="col-span-1 text-right">Totaal</div>
              <div className="col-span-1" />
            </div>

            {lines.map((line) => {
              const lineTotal = line.quantity * line.unit_price
              return (
                <div
                  key={line.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start"
                >
                  <div className="sm:col-span-4">
                    <Input
                      placeholder="Omschrijving"
                      value={line.description}
                      onChange={(e) =>
                        updateLine(line.id, 'description', e.target.value)
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Aantal"
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(
                          line.id,
                          'quantity',
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="text-right"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Prijs"
                      value={line.unit_price}
                      onChange={(e) =>
                        updateLine(
                          line.id,
                          'unit_price',
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="text-right"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Select
                      value={String(line.tax_rate)}
                      onChange={(e) =>
                        updateLine(
                          line.id,
                          'tax_rate',
                          parseFloat(e.target.value),
                        )
                      }
                      options={[
                        { value: '0', label: '0%' },
                        { value: '9', label: '9%' },
                        { value: '21', label: '21%' },
                      ]}
                    />
                  </div>
                  <div className="sm:col-span-1 flex items-center justify-end h-9">
                    <span className="text-sm font-mono text-zinc-700">
                      {formatCurrency(lineTotal)}
                    </span>
                  </div>
                  <div className="sm:col-span-1 flex items-center justify-end h-9">
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      disabled={lines.length <= 1}
                      className="p-1 text-zinc-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}

            <Button variant="secondary" size="sm" onClick={addLine}>
              <Plus className="h-4 w-4" />
              Regel toevoegen
            </Button>
          </div>

          {/* Totals */}
          <div className="mt-6 border-t border-zinc-200 pt-4">
            <div className="flex flex-col items-end space-y-1">
              <div className="flex justify-between w-56 text-sm">
                <span className="text-zinc-500">Subtotaal</span>
                <span className="font-mono">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>
              {totals.vatBreakdown.map((v) => (
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
              <div className="flex justify-between w-56 text-sm font-semibold border-t border-zinc-200 pt-2 mt-1">
                <span>Totaal</span>
                <span className="font-mono">
                  {formatCurrency(totals.total)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Notes */}
        <Card title="Opmerkingen">
          <Textarea
            placeholder="Optionele opmerkingen of betalingsinstructies..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end pb-8">
          <Button
            variant="secondary"
            onClick={() => handleSubmit(false)}
            loading={saving}
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            Opslaan als concept
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            loading={saving}
            disabled={saving}
          >
            <Send className="h-4 w-4" />
            Opslaan &amp; versturen
          </Button>
        </div>
      </div>
    </div>
  )
}
