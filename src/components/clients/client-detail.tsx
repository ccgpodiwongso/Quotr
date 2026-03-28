'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Receipt,
  CalendarDays,
  StickyNote,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import { ClientModal } from '@/components/clients/client-modal'
import type { Client, Quote, Invoice, Appointment } from '@/types/database'

type QuoteSummary = Pick<Quote, 'id' | 'quote_number' | 'title' | 'status' | 'total' | 'created_at'>
type InvoiceSummary = Pick<Invoice, 'id' | 'invoice_number' | 'status' | 'total' | 'due_date' | 'paid_at' | 'created_at'>
type AppointmentSummary = Pick<Appointment, 'id' | 'title' | 'start_time' | 'end_time' | 'status' | 'location'>

interface ClientDetailClientProps {
  client: Client
  quotes: QuoteSummary[]
  invoices: InvoiceSummary[]
  appointments: AppointmentSummary[]
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents)
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

const quoteStatusMap: Record<string, { label: string; variant: 'default' | 'info' | 'success' | 'warning' | 'danger' }> = {
  draft: { label: 'Concept', variant: 'default' },
  sent: { label: 'Verzonden', variant: 'info' },
  viewed: { label: 'Bekeken', variant: 'info' },
  accepted: { label: 'Geaccepteerd', variant: 'success' },
  rejected: { label: 'Afgewezen', variant: 'danger' },
  expired: { label: 'Verlopen', variant: 'warning' },
}

const invoiceStatusMap: Record<string, { label: string; variant: 'default' | 'info' | 'success' | 'warning' | 'danger' }> = {
  draft: { label: 'Concept', variant: 'default' },
  sent: { label: 'Verzonden', variant: 'info' },
  paid: { label: 'Betaald', variant: 'success' },
  overdue: { label: 'Te laat', variant: 'danger' },
  cancelled: { label: 'Geannuleerd', variant: 'warning' },
}

const appointmentStatusMap: Record<string, { label: string; variant: 'default' | 'info' | 'success' | 'warning' | 'danger' }> = {
  scheduled: { label: 'Gepland', variant: 'info' },
  completed: { label: 'Voltooid', variant: 'success' },
  cancelled: { label: 'Geannuleerd', variant: 'warning' },
  no_show: { label: 'No-show', variant: 'danger' },
}

export function ClientDetailClient({
  client,
  quotes,
  invoices,
  appointments,
}: ClientDetailClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSaved = useCallback(() => {
    toast('Klant bijgewerkt.', 'success')
    setModalOpen(false)
    router.refresh()
  }, [router, toast])

  const handleDelete = useCallback(async () => {
    if (!window.confirm(`Weet je zeker dat je "${client.name}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)) {
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        toast(data.error || 'Kon klant niet verwijderen.', 'error')
        return
      }
      toast('Klant verwijderd.', 'success')
      router.push('/app/clients')
    } catch {
      toast('Er is een onverwachte fout opgetreden.', 'error')
    } finally {
      setDeleting(false)
    }
  }, [client, router, toast])

  const address = [client.address_line1, client.address_line2, [client.postal_code, client.city].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={client.name}
        description={client.contact_person || undefined}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => router.push('/app/clients')}>
              <ArrowLeft className="h-4 w-4" />
              Terug
            </Button>
            <Button variant="secondary" onClick={() => setModalOpen(true)}>
              <Pencil className="h-4 w-4" />
              Bewerken
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              <Trash2 className="h-4 w-4" />
              Verwijderen
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client info card */}
        <div className="lg:col-span-1">
          <Card title="Contactgegevens">
            <div className="space-y-3">
              {client.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-zinc-400 shrink-0" />
                  <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline truncate">
                    {client.email}
                  </a>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-zinc-400 shrink-0" />
                  <a href={`tel:${client.phone}`} className="text-zinc-700 hover:underline">
                    {client.phone}
                  </a>
                </div>
              )}
              {address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span className="text-zinc-700">{address}</span>
                </div>
              )}
              {!client.email && !client.phone && !address && (
                <p className="text-sm text-zinc-400">Geen contactgegevens beschikbaar.</p>
              )}
            </div>

            {client.notes && (
              <div className="mt-4 pt-4 border-t border-zinc-100">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <StickyNote className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Notities</span>
                </div>
                <p className="text-sm text-zinc-600 whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}

            {(client.kvk_number || client.btw_number) && (
              <div className="mt-4 pt-4 border-t border-zinc-100 space-y-1.5">
                {client.kvk_number && (
                  <div className="text-sm">
                    <span className="text-zinc-500">KVK: </span>
                    <span className="text-zinc-700">{client.kvk_number}</span>
                  </div>
                )}
                {client.btw_number && (
                  <div className="text-sm">
                    <span className="text-zinc-500">BTW: </span>
                    <span className="text-zinc-700">{client.btw_number}</span>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Quotes, Invoices, Appointments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quotes */}
          <Card title={`Offertes (${quotes.length})`}>
            {quotes.length === 0 ? (
              <p className="text-sm text-zinc-400 py-4 text-center">Geen offertes voor deze klant.</p>
            ) : (
              <div className="divide-y divide-zinc-100 -mx-5">
                {quotes.map((quote) => {
                  const statusInfo = quoteStatusMap[quote.status] || { label: quote.status, variant: 'default' as const }
                  return (
                    <button
                      key={quote.id}
                      onClick={() => router.push(`/app/quotes/${quote.id}`)}
                      className="w-full text-left px-5 py-3 hover:bg-zinc-50 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-zinc-400 shrink-0" />
                          <span className="text-sm font-medium text-zinc-900 truncate">
                            {quote.quote_number}
                          </span>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </div>
                        {quote.title && (
                          <p className="text-xs text-zinc-500 mt-0.5 ml-6 truncate">{quote.title}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-medium text-zinc-900">{formatPrice(quote.total)}</span>
                        <p className="text-xs text-zinc-400">{formatDate(quote.created_at)}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Invoices */}
          <Card title={`Facturen (${invoices.length})`}>
            {invoices.length === 0 ? (
              <p className="text-sm text-zinc-400 py-4 text-center">Geen facturen voor deze klant.</p>
            ) : (
              <div className="divide-y divide-zinc-100 -mx-5">
                {invoices.map((invoice) => {
                  const statusInfo = invoiceStatusMap[invoice.status] || { label: invoice.status, variant: 'default' as const }
                  return (
                    <button
                      key={invoice.id}
                      onClick={() => router.push(`/app/invoices/${invoice.id}`)}
                      className="w-full text-left px-5 py-3 hover:bg-zinc-50 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Receipt className="h-4 w-4 text-zinc-400 shrink-0" />
                        <span className="text-sm font-medium text-zinc-900 truncate">
                          {invoice.invoice_number}
                        </span>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-medium text-zinc-900">{formatPrice(invoice.total)}</span>
                        <p className="text-xs text-zinc-400">
                          {invoice.paid_at ? `Betaald ${formatDate(invoice.paid_at)}` : `Vervalt ${formatDate(invoice.due_date)}`}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Appointments */}
          <Card title={`Afspraken (${appointments.length})`}>
            {appointments.length === 0 ? (
              <p className="text-sm text-zinc-400 py-4 text-center">Geen afspraken voor deze klant.</p>
            ) : (
              <div className="divide-y divide-zinc-100 -mx-5">
                {appointments.map((appointment) => {
                  const statusInfo = appointmentStatusMap[appointment.status] || { label: appointment.status, variant: 'default' as const }
                  return (
                    <div
                      key={appointment.id}
                      className="px-5 py-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CalendarDays className="h-4 w-4 text-zinc-400 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-zinc-900 truncate block">
                            {appointment.title}
                          </span>
                          <p className="text-xs text-zinc-500">
                            {formatDateTime(appointment.start_time)}
                            {appointment.location && ` \u2014 ${appointment.location}`}
                          </p>
                        </div>
                      </div>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      <ClientModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        client={client}
      />
    </div>
  )
}
