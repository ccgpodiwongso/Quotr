import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (!profile?.company_id) redirect('/app/onboarding')

  const [companyResult, slotsResult] = await Promise.all([
    supabase
      .from('companies')
      .select('*')
      .eq('id', profile.company_id)
      .single(),
    supabase
      .from('availability_slots')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('day_of_week', { ascending: true }),
  ])

  // Dynamic import to avoid module resolution issues at build time
  const { SettingsPageClient } = await import('@/components/settings/settings-page')

  return (
    <div className="min-h-screen bg-[#f5f5f6]">
      <SettingsPageClient
        company={companyResult.data ?? null}
        profile={profile ?? null}
        availabilitySlots={slotsResult.data ?? []}
      />
    </div>
  )
}
