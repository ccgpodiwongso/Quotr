import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ServicesPageClient } from '@/components/services/services-page'
import type { Service } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function ServicesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) redirect('/app/onboarding')

  // Fetch services: active first (by sort_order), then archived
  const { data: services, error } = await supabase
    .from('services')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('is_active', { ascending: false })
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching services:', error)
  }

  return (
    <div className="min-h-screen bg-[#f5f5f6]">
      <ServicesPageClient services={(services as Service[]) ?? []} />
    </div>
  )
}
