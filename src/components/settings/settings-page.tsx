'use client'

import type { Company, User, AvailabilitySlot } from '@/types/database'

interface SettingsPageClientProps {
  company: Company | null
  profile: User | null
  availabilitySlots: AvailabilitySlot[]
}

export function SettingsPageClient({
  company,
  profile,
  availabilitySlots,
}: SettingsPageClientProps) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Instellingen</h1>
      <p className="text-sm text-zinc-500">
        Instellingenpagina wordt geladen...
      </p>
    </div>
  )
}
