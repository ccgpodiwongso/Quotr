import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientsPageClient } from '@/components/clients/clients-page'
import type { Client } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
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

  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching clients:', error)
  }

  return (
    <div className="min-h-screen bg-[#f5f5f6]">
      <ClientsPageClient clients={(clients as Client[]) ?? []} />
    </div>
  )
}
