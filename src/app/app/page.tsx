import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/dashboard/dashboard-page'
import type { QuoteEvent, Quote, Appointment, Client } from '@/types/database'

export const dynamic = 'force-dynamic'

export type RecentEvent = QuoteEvent & {
  quote: Pick<Quote, 'id' | 'quote_number' | 'title'>
}

export type UpcomingAppointment = Appointment & {
  client: Pick<Client, 'id' | 'name'> | null
}

export interface DashboardData {
  userName: string
  revenueThisMonth: number
  quotesSentThisMonth: number
  acceptanceRate: number
  outstandingCount: number
  outstandingTotal: number
  recentActivity: RecentEvent[]
  upcomingAppointments: UpcomingAppointment[]
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get user profile for company_id and name
  const { data: profile } = await supabase
    .from('users')
    .select('company_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) redirect('/app/onboarding')

  const companyId = profile.company_id

  // Current month boundaries (UTC)
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString()

  // Run all queries in parallel
  const [
    paidInvoicesRes,
    quotesSentRes,
    allQuotesRes,
    outstandingRes,
    recentEventsRes,
    appointmentsRes,
  ] = await Promise.all([
    // Revenue this month: paid invoices where paid_at in current month
    supabase
      .from('invoices')
      .select('total')
      .eq('company_id', companyId)
      .eq('status', 'paid')
      .gte('paid_at', monthStart)
      .lte('paid_at', monthEnd),

    // Quotes sent this month
    supabase
      .from('quotes')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .not('sent_at', 'is', null)
      .gte('sent_at', monthStart)
      .lte('sent_at', monthEnd),

    // All non-draft quotes (for acceptance rate)
    supabase
      .from('quotes')
      .select('status')
      .eq('company_id', companyId)
      .neq('status', 'draft'),

    // Outstanding invoices (sent or overdue)
    supabase
      .from('invoices')
      .select('total')
      .eq('company_id', companyId)
      .in('status', ['sent', 'overdue']),

    // Recent activity: last 10 quote events with quote info
    supabase
      .from('quote_events')
      .select('*, quote:quotes!quote_id(id, quote_number, title)')
      .eq('quotes.company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(10),

    // Upcoming appointments
    supabase
      .from('appointments')
      .select('*, client:clients!client_id(id, name)')
      .eq('company_id', companyId)
      .gte('start_time', now.toISOString())
      .order('start_time', { ascending: true })
      .limit(5),
  ])

  // Calculate revenue this month
  const revenueThisMonth = (paidInvoicesRes.data ?? []).reduce(
    (sum, inv) => sum + (inv.total ?? 0),
    0
  )

  // Quotes sent this month
  const quotesSentThisMonth = quotesSentRes.count ?? 0

  // Acceptance rate
  const allNonDraft = allQuotesRes.data ?? []
  const acceptedCount = allNonDraft.filter((q) => q.status === 'accepted').length
  const acceptanceRate =
    allNonDraft.length > 0 ? Math.round((acceptedCount / allNonDraft.length) * 100) : 0

  // Outstanding invoices
  const outstandingInvoices = outstandingRes.data ?? []
  const outstandingCount = outstandingInvoices.length
  const outstandingTotal = outstandingInvoices.reduce(
    (sum, inv) => sum + (inv.total ?? 0),
    0
  )

  // Normalize recent events — filter out events without a matching quote
  const recentActivity: RecentEvent[] = (recentEventsRes.data ?? [])
    .filter((e) => e.quote != null)
    .map((e) => ({
      ...e,
      quote: e.quote as unknown as Pick<Quote, 'id' | 'quote_number' | 'title'>,
    }))

  // Normalize upcoming appointments
  const upcomingAppointments: UpcomingAppointment[] = (appointmentsRes.data ?? []).map(
    (a) => ({
      ...a,
      client: a.client as unknown as Pick<Client, 'id' | 'name'> | null,
    })
  )

  const dashboardData: DashboardData = {
    userName: profile.full_name ?? user.email?.split('@')[0] ?? 'Gebruiker',
    revenueThisMonth,
    quotesSentThisMonth,
    acceptanceRate,
    outstandingCount,
    outstandingTotal,
    recentActivity,
    upcomingAppointments,
  }

  return (
    <div className="min-h-screen bg-[#f5f5f6]">
      <DashboardClient data={dashboardData} />
    </div>
  )
}
