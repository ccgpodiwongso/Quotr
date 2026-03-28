'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  ChevronDown,
  GripVertical,
  FileText,
  Trash2,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Tabs, TabList, TabTrigger, TabPanel } from '@/components/ui/tabs'
import { Dropdown } from '@/components/ui/dropdown'
import { PageHeader } from '@/components/layout/page-header'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { Quote, Client } from '@/types/database'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QuoteWithClient = Quote & {
  client: Pick<Client, 'id' | 'name' | 'email'>
}

type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'lost'

interface QuotePipelineClientProps {
  quotes: QuoteWithClient[]
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_COLUMNS: QuoteStatus[] = ['draft', 'sent', 'viewed', 'accepted', 'lost']

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Concept',
  sent: 'Verzonden',
  viewed: 'Bekeken',
  accepted: 'Geaccepteerd',
  lost: 'Verloren',
}

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

function statusBadgeVariant(status: string) {
  return STATUS_BADGE_VARIANT[status] ?? 'default'
}

function statusLabel(status: string) {
  return STATUS_LABELS[status as QuoteStatus] ?? status
}

// ---------------------------------------------------------------------------
// Filter bar
// ---------------------------------------------------------------------------

function FilterBar({
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
}: {
  statusFilter: string
  setStatusFilter: (v: string) => void
  searchQuery: string
  setSearchQuery: (v: string) => void
  dateFrom: string
  setDateFrom: (v: string) => void
  dateTo: string
  setDateTo: (v: string) => void
}) {
  const hasActiveFilters = statusFilter !== 'all' || searchQuery || dateFrom || dateTo

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Zoek op klant..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 w-full rounded-md border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Status filter */}
      <div className="relative">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 appearance-none rounded-md border border-zinc-200 bg-white pl-3 pr-8 text-sm text-zinc-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="all">Alle statussen</option>
          {STATUS_COLUMNS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      </div>

      {/* Date range */}
      <input
        type="date"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
        placeholder="Van"
        className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
      <span className="text-sm text-zinc-400">-</span>
      <input
        type="date"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
        placeholder="Tot"
        className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />

      {hasActiveFilters && (
        <button
          onClick={() => {
            setStatusFilter('all')
            setSearchQuery('')
            setDateFrom('')
            setDateTo('')
          }}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
        >
          <X className="h-3.5 w-3.5" />
          Wis filters
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Kanban card
// ---------------------------------------------------------------------------

function KanbanQuoteCard({
  quote,
  onStatusChange,
}: {
  quote: QuoteWithClient
  onStatusChange: (id: string, status: QuoteStatus) => void
}) {
  const router = useRouter()

  const statusOptions = STATUS_COLUMNS.filter((s) => s !== quote.status).map((s) => ({
    label: STATUS_LABELS[s],
    onClick: () => onStatusChange(quote.id, s),
  }))

  return (
    <div
      onClick={() => router.push(`/app/quotes/${quote.id}`)}
      className="group cursor-pointer rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-zinc-300"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-zinc-500">{quote.quote_number}</p>
          <p className="mt-1 truncate text-sm font-semibold text-zinc-900">
            {quote.client?.name ?? 'Onbekende klant'}
          </p>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <Dropdown
            trigger={
              <button className="rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-zinc-100">
                <ChevronDown className="h-4 w-4 text-zinc-400" />
              </button>
            }
            items={statusOptions}
            align="right"
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-zinc-900">
          {formatCurrency(quote.total)}
        </span>
        <Badge variant={statusBadgeVariant(quote.status)}>
          {statusLabel(quote.status)}
        </Badge>
      </div>

      <p className="mt-2 text-xs text-zinc-400">
        {formatDate(quote.created_at)}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Kanban column
// ---------------------------------------------------------------------------

function KanbanColumn({
  status,
  quotes,
  onStatusChange,
}: {
  status: QuoteStatus
  quotes: QuoteWithClient[]
  onStatusChange: (id: string, status: QuoteStatus) => void
}) {
  return (
    <div className="flex w-72 shrink-0 flex-col lg:w-auto lg:flex-1">
      {/* Column header */}
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-zinc-700">{STATUS_LABELS[status]}</h3>
        <Badge variant={statusBadgeVariant(status)}>{quotes.length}</Badge>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2.5 rounded-lg bg-zinc-100/60 p-2.5 min-h-[120px]">
        {quotes.length === 0 ? (
          <p className="py-8 text-center text-xs text-zinc-400">Geen offertes</p>
        ) : (
          quotes.map((q) => (
            <KanbanQuoteCard key={q.id} quote={q} onStatusChange={onStatusChange} />
          ))
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Kanban view
// ---------------------------------------------------------------------------

function KanbanView({
  quotes,
  onStatusChange,
}: {
  quotes: QuoteWithClient[]
  onStatusChange: (id: string, status: QuoteStatus) => void
}) {
  const grouped = useMemo(() => {
    const map: Record<QuoteStatus, QuoteWithClient[]> = {
      draft: [],
      sent: [],
      viewed: [],
      accepted: [],
      lost: [],
    }
    for (const q of quotes) {
      const col = STATUS_COLUMNS.includes(q.status as QuoteStatus)
        ? (q.status as QuoteStatus)
        : 'draft'
      map[col].push(q)
    }
    return map
  }, [quotes])

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 lg:overflow-x-visible">
      {STATUS_COLUMNS.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          quotes={grouped[status]}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// List view
// ---------------------------------------------------------------------------

type SortField = 'quote_number' | 'client' | 'total' | 'status' | 'created_at' | 'valid_until'
type SortDir = 'asc' | 'desc'

function SortableHeader({
  label,
  field,
  currentSort,
  currentDir,
  onSort,
  className,
}: {
  label: string
  field: SortField
  currentSort: SortField
  currentDir: SortDir
  onSort: (f: SortField) => void
  className?: string
}) {
  const isActive = currentSort === field
  return (
    <th
      onClick={() => onSort(field)}
      className={cn(
        'cursor-pointer select-none px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 hover:text-zinc-700',
        className,
      )}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive && (
          <ChevronDown
            className={cn('h-3 w-3 transition-transform', currentDir === 'asc' && 'rotate-180')}
          />
        )}
      </span>
    </th>
  )
}

function ListView({
  quotes,
  onStatusChange,
  onBulkMarkLost,
}: {
  quotes: QuoteWithClient[]
  onStatusChange: (id: string, status: QuoteStatus) => void
  onBulkMarkLost: (ids: string[]) => void
}) {
  const router = useRouter()
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    const arr = [...quotes]
    const dir = sortDir === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      switch (sortField) {
        case 'quote_number':
          return a.quote_number.localeCompare(b.quote_number) * dir
        case 'client':
          return (a.client?.name ?? '').localeCompare(b.client?.name ?? '') * dir
        case 'total':
          return (a.total - b.total) * dir
        case 'status':
          return a.status.localeCompare(b.status) * dir
        case 'valid_until':
          return ((a.valid_until ?? '') > (b.valid_until ?? '') ? 1 : -1) * dir
        case 'created_at':
        default:
          return (a.created_at > b.created_at ? 1 : -1) * dir
      }
    })
    return arr
  }, [quotes, sortField, sortDir])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === sorted.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(sorted.map((q) => q.id)))
    }
  }

  const hasSelection = selectedIds.size > 0

  return (
    <div>
      {/* Bulk actions */}
      {hasSelection && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5">
          <span className="text-sm font-medium text-blue-700">
            {selectedIds.size} geselecteerd
          </span>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              onBulkMarkLost(Array.from(selectedIds))
              setSelectedIds(new Set())
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Markeer als verloren
          </Button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-sm text-blue-600 hover:text-blue-800"
          >
            Deselecteer alles
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="w-full min-w-[700px]">
          <thead className="border-b border-zinc-200 bg-zinc-50/50">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.size === sorted.length && sorted.length > 0}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <SortableHeader label="Offerte #" field="quote_number" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Klant" field="client" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Bedrag" field="total" currentSort={sortField} currentDir={sortDir} onSort={handleSort} className="text-right" />
              <SortableHeader label="Status" field="status" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Datum" field="created_at" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Geldig tot" field="valid_until" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {sorted.map((q) => (
              <tr
                key={q.id}
                onClick={() => router.push(`/app/quotes/${q.id}`)}
                className="cursor-pointer transition-colors hover:bg-zinc-50"
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(q.id)}
                    onChange={() => toggleSelect(q.id)}
                    className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-3 text-sm font-medium text-zinc-900">
                  {q.quote_number}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-700">
                  {q.client?.name ?? 'Onbekend'}
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-zinc-900">
                  {formatCurrency(q.total)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusBadgeVariant(q.status)}>
                    {statusLabel(q.status)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500">
                  {formatDate(q.created_at)}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500">
                  {q.valid_until ? formatDate(q.valid_until) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sorted.length === 0 && (
          <div className="py-12">
            <EmptyState
              icon={FileText}
              title="Geen offertes gevonden"
              description="Pas je filters aan of maak een nieuwe offerte aan."
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main pipeline client
// ---------------------------------------------------------------------------

export function QuotePipelineClient({ quotes: initialQuotes }: QuotePipelineClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [quotes, setQuotes] = useState<QuoteWithClient[]>(initialQuotes)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Filtered quotes
  const filtered = useMemo(() => {
    let result = quotes

    if (statusFilter !== 'all') {
      result = result.filter((q) => q.status === statusFilter)
    }

    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase()
      result = result.filter(
        (q) =>
          q.client?.name?.toLowerCase().includes(lower) ||
          q.quote_number.toLowerCase().includes(lower),
      )
    }

    if (dateFrom) {
      result = result.filter((q) => q.created_at >= dateFrom)
    }

    if (dateTo) {
      const toEnd = dateTo + 'T23:59:59'
      result = result.filter((q) => q.created_at <= toEnd)
    }

    return result
  }, [quotes, statusFilter, searchQuery, dateFrom, dateTo])

  // Status change handler
  const handleStatusChange = useCallback(
    async (quoteId: string, newStatus: QuoteStatus) => {
      // Optimistic update
      setQuotes((prev) =>
        prev.map((q) => (q.id === quoteId ? { ...q, status: newStatus } : q)),
      )

      const updatePayload: Record<string, unknown> = { status: newStatus }
      if (newStatus === 'sent') updatePayload.sent_at = new Date().toISOString()
      if (newStatus === 'viewed') updatePayload.viewed_at = new Date().toISOString()
      if (newStatus === 'accepted') updatePayload.accepted_at = new Date().toISOString()

      const { error } = await supabase
        .from('quotes')
        .update(updatePayload)
        .eq('id', quoteId)

      if (error) {
        console.error('Failed to update quote status:', error)
        // Revert
        setQuotes((prev) =>
          prev.map((q) =>
            q.id === quoteId
              ? { ...q, status: initialQuotes.find((iq) => iq.id === quoteId)?.status ?? q.status }
              : q,
          ),
        )
      }
    },
    [supabase, initialQuotes],
  )

  // Bulk mark as lost
  const handleBulkMarkLost = useCallback(
    async (ids: string[]) => {
      setQuotes((prev) =>
        prev.map((q) => (ids.includes(q.id) ? { ...q, status: 'lost' } : q)),
      )

      const { error } = await supabase
        .from('quotes')
        .update({ status: 'lost' })
        .in('id', ids)

      if (error) {
        console.error('Failed to bulk update:', error)
        setQuotes(initialQuotes)
      }
    },
    [supabase, initialQuotes],
  )

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Offertes"
        description="Beheer en volg al je offertes"
        actions={
          <Button onClick={() => router.push('/app/quotes/new')}>
            <Plus className="h-4 w-4" />
            Nieuwe offerte
          </Button>
        }
      />

      <Tabs defaultTab="kanban" className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabList>
            <TabTrigger value="kanban">
              <span className="inline-flex items-center gap-1.5">
                <LayoutGrid className="h-4 w-4" />
                Kanban
              </span>
            </TabTrigger>
            <TabTrigger value="list">
              <span className="inline-flex items-center gap-1.5">
                <List className="h-4 w-4" />
                Lijst
              </span>
            </TabTrigger>
          </TabList>
        </div>

        {/* Filter bar */}
        <FilterBar
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
        />

        <TabPanel value="kanban">
          {filtered.length === 0 && statusFilter === 'all' && !searchQuery ? (
            <EmptyState
              icon={FileText}
              title="Nog geen offertes"
              description="Maak je eerste offerte aan en begin met het bijhouden van je sales pipeline."
              actionLabel="Nieuwe offerte"
              onAction={() => router.push('/app/quotes/new')}
            />
          ) : (
            <KanbanView quotes={filtered} onStatusChange={handleStatusChange} />
          )}
        </TabPanel>

        <TabPanel value="list">
          <ListView
            quotes={filtered}
            onStatusChange={handleStatusChange}
            onBulkMarkLost={handleBulkMarkLost}
          />
        </TabPanel>
      </Tabs>
    </div>
  )
}
