'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Send,
  Edit3,
  Trash2,
  XCircle,
  CheckCircle,
  Eye,
  FileText,
  Clock,
  Calendar,
  Receipt,
  Sparkles,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  CalendarPlus,
  ChevronDown,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Dropdown } from '@/components/ui/dropdown'
import { PageHeader } from '@/components/layout/page-header'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { Quote, QuoteLine, QuoteEvent, Client } from '@/types/database'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QuoteWithDetails = Quote & {
  client: Pick<Client, 'id' | 'name' | 'email' | 'phone' | 'address_line1' | 'postal_code' | 'city'>
  quote_lines: QuoteLine[]
  quote_events: QuoteEvent[]
}

interface QuoteDetailClientProps {
  quote: QuoteWithDetails
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_BADGE_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  draft: 'warning',
  pending: 'warning',
  sent: 'info',
  viewed: 'info',
  accepted: 'success',
  lost: 'danger',
  rejected: 'danger',
  expired: 'danger',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Concept',
  sent: 'Verzonden',
  viewed: 'Bekeken',
  accepted: 'Geaccepteerd',
  lost: 'Verloren',
  rejected: 'Afgewezen',
  expired: 'Verlopen',
}

function statusBadgeVariant(status: string) {
  return STATUS_BADGE_VARIANT[status] ?? 'default'
}

function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status
}

// ---------------------------------------------------------------------------
// Event type helpers
// ---------------------------------------------------------------------------

const EVENT_ICONS: Record<string, React.ReactNode> = {
  created: <FileText className="h-4 w-4 text-zinc-400" />,
  sent: <Send className="h-4 w-4 text-blue-500" />,
  viewed: <Eye className="h-4 w-4 text-blue-500" />,
  accepted: <CheckCircle className="h-4 w-4 text-green-500" />,
  rejected: <XCircle className="h-4 w-4 text-red-500" />,
  lost: <XCircle className="h-4 w-4 text-red-500" />,
  edited: <Edit3 className="h-4 w-4 text-amber-500" />,
  reminder_sent: <Mail className="h-4 w-4 text-blue-400" />,
  status_changed: <Clock className="h-4 w-4 text-zinc-400" />,
}

const EVENT_LABELS: Record<string, string> = {
  created: 'Offerte aangemaakt',
  sent: 'Offerte verzonden',
  viewed: 'Offerte bekeken door klant',
  accepted: 'Offerte geaccepteerd',
  rejected: 'Offerte afgewezen',
  lost: 'Gemarkeerd als verloren',
  edited: 'Offerte bewerkt',
  reminder_sent: 'Herinnering verzonden',
  status_changed: 'Status gewijzigd',
}

function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat('nl-NL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

// ---------------------------------------------------------------------------
// Client info card
// ---------------------------------------------------------------------------

function ClientInfoCard({
  client,
}: {
  client: QuoteWithDetails['client']
}) {
  return (
    <Card title="Klantgegevens">
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900">{client.name}</p>
        </div>
        {client.email && (
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <Mail className="h-4 w-4 text-zinc-400 shrink-0" />
            <a href={`mailto:${client.email}`} className="hover:text-blue-600 truncate">
              {client.email}
            </a>
          </div>
        )}
        {client.phone && (
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <Phone className="h-4 w-4 text-zinc-400 shrink-0" />
            <a href={`tel:${client.phone}`} className="hover:text-blue-600">
              {client.phone}
            </a>
          </div>
        )}
        {client.address_line1 && (
          <div className="flex items-start gap-2 text-sm text-zinc-600">
            <MapPin className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
            <div>
              <p>{client.address_line1}</p>
              {(client.postal_code || client.city) && (
                <p>
                  {client.postal_code} {client.city}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Line items table
// ---------------------------------------------------------------------------

function LineItemsTable({ lines }: { lines: QuoteLine[] }) {
  return (
    <Card title="Regels">
      <div className="overflow-x-auto -mx-5">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Omschrijving
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                Aantal
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                Prijs
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                BTW
              </th>
              <th className="px-5 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                Totaal
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {lines.map((line) => (
              <tr key={line.id}>
                <td className="px-5 py-3 text-sm text-zinc-900">
                  {line.description}
                </td>
                <td className="px-3 py-3 text-right text-sm text-zinc-700">
                  {line.quantity}
                </td>
                <td className="px-3 py-3 text-right text-sm text-zinc-700">
                  {formatCurrency(line.unit_price)}
                </td>
                <td className="px-3 py-3 text-right text-sm text-zinc-700">
                  {line.tax_rate}%
                </td>
                <td className="px-5 py-3 text-right text-sm font-medium text-zinc-900">
                  {formatCurrency(line.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Totals card
// ---------------------------------------------------------------------------

function TotalsSection({ quote }: { quote: QuoteWithDetails }) {
  const discountAmount =
    quote.discount_value && quote.discount_type === 'percentage'
      ? (quote.subtotal * quote.discount_value) / 100
      : quote.discount_value ?? 0

  return (
    <Card>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500">Subtotaal</span>
          <span className="text-zinc-900">{formatCurrency(quote.subtotal)}</span>
        </div>
        {quote.discount_value && quote.discount_value > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">
              Korting
              {quote.discount_type === 'percentage'
                ? ` (${quote.discount_value}%)`
                : ''}
            </span>
            <span className="text-red-600">-{formatCurrency(discountAmount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500">BTW</span>
          <span className="text-zinc-900">{formatCurrency(quote.tax_amount)}</span>
        </div>
        <div className="border-t border-zinc-200 pt-2 flex items-center justify-between">
          <span className="text-base font-semibold text-zinc-900">Totaal</span>
          <span className="text-lg font-bold text-zinc-900">
            {formatCurrency(quote.total)}
          </span>
        </div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Notes section
// ---------------------------------------------------------------------------

function NotesSection({ quote }: { quote: QuoteWithDetails }) {
  if (!quote.introduction && !quote.conclusion) return null

  return (
    <Card title="Notities">
      <div className="space-y-4">
        {quote.introduction && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1">
              Introductie
            </p>
            <p className="text-sm text-zinc-700 whitespace-pre-wrap">
              {quote.introduction}
            </p>
          </div>
        )}
        {quote.conclusion && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1">
              Afsluiting
            </p>
            <p className="text-sm text-zinc-700 whitespace-pre-wrap">
              {quote.conclusion}
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Validity & terms
// ---------------------------------------------------------------------------

function ValidityCard({ quote }: { quote: QuoteWithDetails }) {
  const isExpired =
    quote.valid_until && new Date(quote.valid_until) < new Date()

  return (
    <Card title="Geldigheid">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500">Aangemaakt</span>
          <span className="text-zinc-900">{formatDate(quote.created_at)}</span>
        </div>
        {quote.valid_until && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Geldig tot</span>
            <span className={cn('font-medium', isExpired ? 'text-red-600' : 'text-zinc-900')}>
              {formatDate(quote.valid_until)}
              {isExpired && ' (verlopen)'}
            </span>
          </div>
        )}
        {quote.sent_at && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Verzonden op</span>
            <span className="text-zinc-900">{formatDate(quote.sent_at)}</span>
          </div>
        )}
        {quote.accepted_at && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Geaccepteerd op</span>
            <span className="text-green-600 font-medium">{formatDate(quote.accepted_at)}</span>
          </div>
        )}
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Status card with actions
// ---------------------------------------------------------------------------

function StatusCard({
  quote,
  onStatusChange,
  onSend,
  onDelete,
  loading,
}: {
  quote: QuoteWithDetails
  onStatusChange: (status: string) => void
  onSend: () => void
  onDelete: () => void
  loading: boolean
}) {
  const router = useRouter()

  return (
    <Card title="Status">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Badge variant={statusBadgeVariant(quote.status)}>
            {statusLabel(quote.status)}
          </Badge>
        </div>

        <div className="space-y-2">
          {/* Primary action based on status */}
          {quote.status === 'draft' && (
            <Button
              className="w-full"
              onClick={onSend}
              loading={loading}
            >
              <Send className="h-4 w-4" />
              Verzenden
            </Button>
          )}

          {(quote.status === 'sent' || quote.status === 'viewed') && (
            <Button
              className="w-full"
              onClick={onSend}
              loading={loading}
            >
              <Send className="h-4 w-4" />
              Opnieuw verzenden
            </Button>
          )}

          {quote.status === 'accepted' && (
            <Button
              className="w-full"
              onClick={() => router.push(`/app/invoices/new?quote_id=${quote.id}`)}
            >
              <Receipt className="h-4 w-4" />
              Maak factuur
            </Button>
          )}

          {/* Edit - always available for draft/sent */}
          {(quote.status === 'draft' || quote.status === 'sent') && (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => router.push(`/app/quotes/${quote.id}/edit`)}
            >
              <Edit3 className="h-4 w-4" />
              Bewerken
            </Button>
          )}

          {/* Mark as lost */}
          {quote.status !== 'accepted' && quote.status !== 'lost' && (
            <Button
              variant="ghost"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onStatusChange('lost')}
              loading={loading}
            >
              <XCircle className="h-4 w-4" />
              Markeer als verloren
            </Button>
          )}

          {/* Mark as accepted - for sent/viewed */}
          {(quote.status === 'sent' || quote.status === 'viewed') && (
            <Button
              variant="ghost"
              className="w-full text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={() => onStatusChange('accepted')}
              loading={loading}
            >
              <CheckCircle className="h-4 w-4" />
              Markeer als geaccepteerd
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// AI talking point card
// ---------------------------------------------------------------------------

function AiTalkingPointCard({ quote }: { quote: QuoteWithDetails }) {
  const talkingPoint =
    (quote.metadata as Record<string, unknown>)?.ai_talking_point as string | undefined

  if (!talkingPoint) return null

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 shrink-0">
          <Sparkles className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-900 mb-1">AI Gesprekspunt</p>
          <p className="text-sm text-blue-800">{talkingPoint}</p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

function Timeline({ events }: { events: QuoteEvent[] }) {
  if (events.length === 0) return null

  return (
    <Card title="Tijdlijn">
      <div className="space-y-0">
        {events.map((event, index) => (
          <div key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
            {/* Connector line */}
            {index < events.length - 1 && (
              <div className="absolute left-[11px] top-6 bottom-0 w-px bg-zinc-200" />
            )}
            {/* Icon */}
            <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white border border-zinc-200">
              {EVENT_ICONS[event.event_type] ?? (
                <Clock className="h-3.5 w-3.5 text-zinc-400" />
              )}
            </div>
            {/* Content */}
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm text-zinc-900">
                {EVENT_LABELS[event.event_type] ?? event.event_type}
              </p>
              {event.description && (
                <p className="mt-0.5 text-xs text-zinc-500">{event.description}</p>
              )}
              <p className="mt-1 text-xs text-zinc-400">
                {formatDateTime(event.created_at)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Quick actions card
// ---------------------------------------------------------------------------

function QuickActionsCard({ quote }: { quote: QuoteWithDetails }) {
  const router = useRouter()

  return (
    <Card title="Snelle acties">
      <div className="space-y-2">
        <button
          onClick={() => router.push(`/app/quotes/${quote.id}/edit`)}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          <Edit3 className="h-4 w-4 text-zinc-400" />
          Offerte bewerken
        </button>
        {quote.status === 'accepted' && (
          <button
            onClick={() => router.push(`/app/invoices/new?quote_id=${quote.id}`)}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            <Receipt className="h-4 w-4 text-zinc-400" />
            Factuur aanmaken
          </button>
        )}
        <button
          onClick={() => router.push(`/app/agenda/new?quote_id=${quote.id}&client_id=${quote.client_id}`)}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          <CalendarPlus className="h-4 w-4 text-zinc-400" />
          Afspraak inplannen
        </button>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Follow-up date display
// ---------------------------------------------------------------------------

function FollowUpCard({ quote }: { quote: QuoteWithDetails }) {
  const followUpDate = (quote.metadata as Record<string, unknown>)?.follow_up_date as
    | string
    | undefined

  if (!followUpDate) return null

  const isPast = new Date(followUpDate) < new Date()

  return (
    <Card title="Follow-up">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full shrink-0',
            isPast ? 'bg-red-50' : 'bg-blue-50'
          )}
        >
          <Calendar className={cn('h-4 w-4', isPast ? 'text-red-500' : 'text-blue-500')} />
        </div>
        <div>
          <p className={cn('text-sm font-medium', isPast ? 'text-red-700' : 'text-zinc-900')}>
            {formatDate(followUpDate)}
          </p>
          {isPast && (
            <p className="text-xs text-red-500">Verlopen</p>
          )}
        </div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function QuoteDetailClient({ quote: initialQuote }: QuoteDetailClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [quote, setQuote] = useState(initialQuote)
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const handleStatusChange = useCallback(
    async (newStatus: string) => {
      setLoading(true)
      const prev = quote.status

      // Optimistic update
      setQuote((q) => ({ ...q, status: newStatus }))

      const updatePayload: Record<string, unknown> = { status: newStatus }
      if (newStatus === 'sent') updatePayload.sent_at = new Date().toISOString()
      if (newStatus === 'viewed') updatePayload.viewed_at = new Date().toISOString()
      if (newStatus === 'accepted') updatePayload.accepted_at = new Date().toISOString()

      const { error } = await supabase
        .from('quotes')
        .update(updatePayload)
        .eq('id', quote.id)

      if (error) {
        console.error('Failed to update status:', error)
        setQuote((q) => ({ ...q, status: prev }))
      }

      setLoading(false)
    },
    [supabase, quote.id, quote.status]
  )

  const handleSend = useCallback(async () => {
    setLoading(true)
    const { error } = await supabase
      .from('quotes')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', quote.id)

    if (!error) {
      setQuote((q) => ({
        ...q,
        status: 'sent',
        sent_at: new Date().toISOString(),
      }))
    } else {
      console.error('Failed to send quote:', error)
    }
    setLoading(false)
  }, [supabase, quote.id])

  const handleDelete = useCallback(async () => {
    setLoading(true)
    const { error } = await supabase.from('quotes').delete().eq('id', quote.id)

    if (!error) {
      router.push('/app/quotes')
    } else {
      console.error('Failed to delete quote:', error)
      setLoading(false)
    }
  }, [supabase, quote.id, router])

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.push('/app/quotes')}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Terug naar offertes
      </button>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-zinc-900">
            {quote.quote_number}
          </h1>
          <Badge variant={statusBadgeVariant(quote.status)}>
            {statusLabel(quote.status)}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {quote.status === 'accepted' && (
            <Button
              onClick={() => router.push(`/app/invoices/new?quote_id=${quote.id}`)}
            >
              <Receipt className="h-4 w-4" />
              Maak factuur
            </Button>
          )}

          {(quote.status === 'draft' || quote.status === 'sent') && (
            <Button
              variant="secondary"
              onClick={() => router.push(`/app/quotes/${quote.id}/edit`)}
            >
              <Edit3 className="h-4 w-4" />
              Bewerken
            </Button>
          )}

          <Dropdown
            trigger={
              <Button variant="secondary" iconOnly>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
            items={[
              ...(quote.status === 'draft'
                ? [
                    {
                      label: 'Verzenden',
                      icon: <Send className="h-4 w-4" />,
                      onClick: handleSend,
                    },
                  ]
                : []),
              ...(quote.status === 'sent' || quote.status === 'viewed'
                ? [
                    {
                      label: 'Opnieuw verzenden',
                      icon: <Send className="h-4 w-4" />,
                      onClick: handleSend,
                    },
                    {
                      label: 'Markeer als geaccepteerd',
                      icon: <CheckCircle className="h-4 w-4" />,
                      onClick: () => handleStatusChange('accepted'),
                    },
                  ]
                : []),
              ...(quote.status !== 'accepted' && quote.status !== 'lost'
                ? [
                    {
                      label: 'Markeer als verloren',
                      icon: <XCircle className="h-4 w-4" />,
                      onClick: () => handleStatusChange('lost'),
                      danger: true,
                    },
                  ]
                : []),
              {
                label: 'Verwijderen',
                icon: <Trash2 className="h-4 w-4" />,
                onClick: () => setDeleteConfirm(true),
                danger: true,
              },
            ]}
            align="right"
          />
        </div>
      </div>

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800 mb-3">
            Weet je zeker dat je offerte <strong>{quote.quote_number}</strong> wilt
            verwijderen? Dit kan niet ongedaan worden gemaakt.
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              loading={loading}
            >
              Ja, verwijderen
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeleteConfirm(false)}
            >
              Annuleren
            </Button>
          </div>
        </div>
      )}

      {/* Two column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column (wider) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          {quote.title && (
            <Card>
              <h2 className="text-lg font-semibold text-zinc-900">{quote.title}</h2>
            </Card>
          )}

          {/* Client info */}
          <ClientInfoCard client={quote.client} />

          {/* Line items */}
          {quote.quote_lines.length > 0 && (
            <LineItemsTable lines={quote.quote_lines} />
          )}

          {/* Totals */}
          <TotalsSection quote={quote} />

          {/* Notes */}
          <NotesSection quote={quote} />

          {/* Validity */}
          <ValidityCard quote={quote} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Status card */}
          <StatusCard
            quote={quote}
            onStatusChange={handleStatusChange}
            onSend={handleSend}
            onDelete={handleDelete}
            loading={loading}
          />

          {/* AI Talking point */}
          <AiTalkingPointCard quote={quote} />

          {/* Timeline */}
          <Timeline events={quote.quote_events} />

          {/* Follow-up */}
          <FollowUpCard quote={quote} />

          {/* Quick actions */}
          <QuickActionsCard quote={quote} />
        </div>
      </div>
    </div>
  )
}
