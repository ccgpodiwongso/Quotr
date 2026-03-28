'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Plus, Search } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import { ClientModal } from '@/components/clients/client-modal'
import type { Client } from '@/types/database'

interface ClientsPageClientProps {
  clients: Client[]
}

export function ClientsPageClient({ clients: initialClients }: ClientsPageClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredClients = useMemo(() => {
    if (!search.trim()) return initialClients
    const q = search.toLowerCase()
    return initialClients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.contact_person && c.contact_person.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q)),
    )
  }, [initialClients, search])

  const handleSaved = useCallback(() => {
    toast('Klant opgeslagen.', 'success')
    setModalOpen(false)
    router.refresh()
  }, [router, toast])

  const handleNewClient = useCallback(() => {
    setModalOpen(true)
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Klanten"
        description="Beheer je klanten en hun gegevens"
        actions={
          <Button onClick={handleNewClient}>
            <Plus className="h-4 w-4" />
            Nieuwe klant
          </Button>
        }
      />

      {initialClients.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm">
          <EmptyState
            icon={Users}
            title="Nog geen klanten"
            description="Voeg je eerste klant toe om offertes en facturen te kunnen maken."
            actionLabel="Voeg je eerste klant toe"
            onAction={handleNewClient}
          />
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="mb-4 max-w-sm">
            <Input
              placeholder="Zoek op naam, e-mail of stad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>

          {/* Client list */}
          <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="hidden sm:grid sm:grid-cols-4 gap-4 px-5 py-3 border-b border-zinc-200 bg-zinc-50/50 text-xs font-medium text-zinc-500 uppercase tracking-wide">
              <span>Naam</span>
              <span>Bedrijf / Contactpersoon</span>
              <span>E-mail</span>
              <span>Telefoon</span>
            </div>

            {filteredClients.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-zinc-500">
                Geen klanten gevonden voor &ldquo;{search}&rdquo;
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {filteredClients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => router.push(`/app/clients/${client.id}`)}
                    className="w-full text-left px-5 py-3.5 hover:bg-zinc-50 transition-colors grid grid-cols-1 sm:grid-cols-4 gap-1 sm:gap-4 items-center"
                  >
                    <span className="text-sm font-medium text-zinc-900 truncate">
                      {client.name}
                    </span>
                    <span className="text-sm text-zinc-500 truncate">
                      {client.contact_person || '\u2014'}
                    </span>
                    <span className="text-sm text-zinc-500 truncate">
                      {client.email || '\u2014'}
                    </span>
                    <span className="text-sm text-zinc-500 truncate">
                      {client.phone || '\u2014'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="mt-3 text-xs text-zinc-400">
            {filteredClients.length} van {initialClients.length} klanten
          </p>
        </>
      )}

      <ClientModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  )
}
