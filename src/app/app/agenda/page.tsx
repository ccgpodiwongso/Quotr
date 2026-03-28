import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AgendaPageClient } from '@/components/agenda/agenda-page'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import type { Appointment, Client } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function AgendaPage() {
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

  const now = new Date()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd\'T\'00:00:00')
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd\'T\'23:59:59')

  const [appointmentsResult, clientsResult, quotesResult] = await Promise.all([
    supabase
      .from('appointments')
      .select('*, clients(id, name, email)')
      .eq('company_id', profile.company_id)
      .gte('start_time', monthStart)
      .lte('start_time', monthEnd)
      .order('start_time', { ascending: true }),
    supabase
      .from('clients')
      .select('id, name, email')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .order('name', { ascending: true }),
    supabase
      .from('quotes')
      .select('id, quote_number, title')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return (
    <div className="min-h-screen bg-[#f5f5f6]">
      <AgendaPageClient
        initialAppointments={(appointmentsResult.data ?? []) as (Appointment & { clients: Pick<Client, 'id' | 'name' | 'email'> | null })[]}
        clients={(clientsResult.data ?? []) as Pick<Client, 'id' | 'name' | 'email'>[]}
        quotes={(quotesResult.data ?? []) as { id: string; quote_number: string; title: string }[]}
      />
    </div>
  )
}
