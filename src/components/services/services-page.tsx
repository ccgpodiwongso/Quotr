'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Wrench,
  Plus,
  Pencil,
  Archive,
  ArchiveRestore,
  Clock,
  DollarSign,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import { ServiceModal } from '@/components/services/service-modal'
import type { Service } from '@/types/database'

interface ServicesPageClientProps {
  services: Service[]
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents)
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '...'
}

export function ServicesPageClient({ services: initialServices }: ServicesPageClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [archivingId, setArchivingId] = useState<string | null>(null)

  const activeServices = initialServices.filter((s) => s.is_active)
  const archivedServices = initialServices.filter((s) => !s.is_active)

  const handleSaved = useCallback(() => {
    toast('Dienst opgeslagen.', 'success')
    router.refresh()
  }, [router, toast])

  const handleEdit = useCallback((service: Service) => {
    setEditingService(service)
    setModalOpen(true)
  }, [])

  const handleNewService = useCallback(() => {
    setEditingService(null)
    setModalOpen(true)
  }, [])

  const handleArchive = useCallback(
    async (service: Service) => {
      setArchivingId(service.id)
      try {
        const res = await fetch(`/api/services/${service.id}`, {
          method: 'DELETE',
        })
        if (!res.ok) {
          const data = await res.json()
          toast(data.error || 'Kon dienst niet archiveren.', 'error')
          return
        }
        toast('Dienst gearchiveerd.', 'success')
        router.refresh()
      } catch {
        toast('Er is een onverwachte fout opgetreden.', 'error')
      } finally {
        setArchivingId(null)
      }
    },
    [router, toast],
  )

  const handleRestore = useCallback(
    async (service: Service) => {
      setArchivingId(service.id)
      try {
        const res = await fetch(`/api/services/${service.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: service.name,
            description: service.description,
            unit_price: service.unit_price,
            unit: service.unit,
            tax_rate: service.tax_rate,
            is_active: true,
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          toast(data.error || 'Kon dienst niet herstellen.', 'error')
          return
        }
        toast('Dienst hersteld.', 'success')
        router.refresh()
      } catch {
        toast('Er is een onverwachte fout opgetreden.', 'error')
      } finally {
        setArchivingId(null)
      }
    },
    [router, toast],
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Diensten"
        description="Beheer de diensten die je aanbiedt"
        actions={
          <Button onClick={handleNewService}>
            <Plus className="h-4 w-4" />
            Nieuwe dienst
          </Button>
        }
      />

      {initialServices.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm">
          <EmptyState
            icon={Wrench}
            title="Nog geen diensten"
            description="Voeg je eerste dienst toe om deze in offertes te kunnen gebruiken."
            actionLabel="Voeg je eerste dienst toe"
            onAction={handleNewService}
          />
        </div>
      ) : (
        <>
          {/* Active services */}
          {activeServices.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onEdit={handleEdit}
                  onArchive={handleArchive}
                  isArchiving={archivingId === service.id}
                />
              ))}
            </div>
          )}

          {/* Archived services */}
          {archivedServices.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
                Gearchiveerd ({archivedServices.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {archivedServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onEdit={handleEdit}
                    onRestore={handleRestore}
                    isArchiving={archivingId === service.id}
                    archived
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <ServiceModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingService(null)
        }}
        onSaved={handleSaved}
        service={editingService}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// ServiceCard
// ---------------------------------------------------------------------------

interface ServiceCardProps {
  service: Service
  onEdit: (service: Service) => void
  onArchive?: (service: Service) => void
  onRestore?: (service: Service) => void
  isArchiving: boolean
  archived?: boolean
}

function ServiceCard({
  service,
  onEdit,
  onArchive,
  onRestore,
  isArchiving,
  archived,
}: ServiceCardProps) {
  return (
    <div
      className={[
        'bg-white border border-zinc-200 rounded-lg shadow-sm p-5 flex flex-col justify-between',
        archived ? 'opacity-60' : '',
      ].join(' ')}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-zinc-900 leading-tight">
            {service.name}
          </h3>
          <span className="text-xs text-zinc-400 tabular-nums shrink-0">
            #{service.sort_order}
          </span>
        </div>

        {service.description && (
          <p className="text-sm text-zinc-500 mb-3">
            {truncate(service.description, 100)}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-base font-semibold text-zinc-900">
            {formatPrice(service.unit_price)}
          </span>

          <Badge variant={service.unit === 'hourly' ? 'info' : 'default'}>
            {service.unit === 'hourly' ? (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Per uur
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Vast bedrag
              </span>
            )}
          </Badge>

          <Badge variant="default">{service.tax_rate}% BTW</Badge>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-zinc-100">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onEdit(service)}
        >
          <Pencil className="h-3.5 w-3.5" />
          Bewerken
        </Button>

        {archived && onRestore ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRestore(service)}
            loading={isArchiving}
          >
            <ArchiveRestore className="h-3.5 w-3.5" />
            Herstellen
          </Button>
        ) : onArchive ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onArchive(service)}
            loading={isArchiving}
          >
            <Archive className="h-3.5 w-3.5" />
            Archiveren
          </Button>
        ) : null}
      </div>
    </div>
  )
}
