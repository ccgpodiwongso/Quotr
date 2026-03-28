'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Plus,
  MoreHorizontal,
  Send,
  CheckCircle2,
  Trash2,
  Download,
  AlertCircle,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Tabs, TabList, TabTrigger, TabPanel } from '@/components/ui/tabs'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { InvoiceWithClient } from '@/app/app/invoices/page'

interface InvoicesPageClientProps {
  invoices: InvoiceWithClient[]
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' }> = {
  draft: { label: 'Concept', variant: 'default' },
  sent: { label: 'Verstuurd', variant: 'info' },
  paid: { label: 'Betaald', variant: 'success' },
  overdue: { label: 'Verlopen', variant: 'danger' },
}

function getStatusBadge(status: string) {
  const config = STATUS_MAP[status] ?? STATUS_MAP.draft
  return <Badge variant={config.variant}>{config.label}</Badge>
}

function isOverdue(invoice: InvoiceWithClient): boolean {
  if (invoice.status === 'paid' || invoice.status === 'draft') return false
  return new Date(invoice.due_date) < new Date()
}

function getEffectiveStatus(invoice: InvoiceWithClient): string {
  if (isOverdue(invoice) && invoice.status === 'sent') return 'overdue'
  return invoice.status
}

function filterInvoices(invoices: InvoiceWithClient[], tab: string): InvoiceWithClient[] {
  if (tab === 'all') return invoices
  if (tab === 'overdue') return invoices.filter((inv) => getEffectiveStatus(inv) === 'overdue')
  return invoices.filter((inv) => inv.status === tab)
}

export function InvoicesPageClient({ invoices }: InvoicesPageClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')

  const counts = {
    all: invoices.length,
    draft: invoices.filter((i) => i.status === 'draft').length,
    sent: invoices.filter((i) => i.status === 'sent' && !isOverdue(i)).length,
    paid: invoices.filter((i) => i.status === 'paid').length,
    overdue: invoices.filter((i) => getEffectiveStatus(i) === 'overdue').length,
  }

  const filtered = filterInvoices(invoices, activeTab)

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <PageHeader
        title="Facturen"
        description="Beheer en verstuur facturen naar je klanten"
        actions={
          <Button onClick={() => router.push('/app/invoices/new')}>
            <Plus className="h-4 w-4" />
            Nieuwe factuur
          </Button>
        }
      />

      <Tabs defaultTab="all" onChange={setActiveTab}>
        <TabList>
          <TabTrigger value="all">Alles ({counts.all})</TabTrigger>
          <TabTrigger value="draft">Concept ({counts.draft})</TabTrigger>
          <TabTrigger value="sent">Verstuurd ({counts.sent})</TabTrigger>
          <TabTrigger value="paid">Betaald ({counts.paid})</TabTrigger>
          <TabTrigger value="overdue">Verlopen ({counts.overdue})</TabTrigger>
        </TabList>

        {['all', 'draft', 'sent', 'paid', 'overdue'].map((tab) => (
          <TabPanel key={tab} value={tab}>
            {filtered.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Geen facturen gevonden"
                description={
                  tab === 'all'
                    ? 'Maak je eerste factuur aan om te beginnen.'
                    : `Er zijn geen facturen met status "${STATUS_MAP[tab]?.label ?? tab}".`
                }
                actionLabel={tab === 'all' ? 'Nieuwe factuur' : undefined}
                onAction={tab === 'all' ? () => router.push('/app/invoices/new') : undefined}
              />
            ) : (
              <InvoiceTable invoices={filtered} onRowClick={(id) => router.push(`/app/invoices/${id}`)} />
            )}
          </TabPanel>
        ))}
      </Tabs>
    </div>
  )
}

function InvoiceTable({
  invoices,
  onRowClick,
}: {
  invoices: InvoiceWithClient[]
  onRowClick: (id: string) => void
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/50">
              <th className="text-left px-4 py-3 font-medium text-zinc-500">Factuurnr.</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-500">Klant</th>
              <th className="text-right px-4 py-3 font-medium text-zinc-500">Bedrag</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-500">Factuurdatum</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-500">Vervaldatum</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => {
              const effectiveStatus = getEffectiveStatus(invoice)
              return (
                <tr
                  key={invoice.id}
                  onClick={() => onRowClick(invoice.id)}
                  className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {invoice.client?.name ?? 'Onbekend'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-900">
                    {formatCurrency(invoice.total)}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(effectiveStatus)}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {formatDate(invoice.created_at)}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {formatDate(invoice.due_date)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
