import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientDetailClient } from '@/components/clients/client-detail'
import type { Client, Quote, Invoice, Appointment } from '@/types/database'

export const dynamic = 'force-dynamic'

type QuoteSummary = Pick<Quote, 'id' | 'quote_number' | 'title' | 'status' | 'total' | 'created_at'>
type InvoiceSummary = Pick<Invoice, 'id' | 'invoice_number' | 'status' | 'total' | 'due_date' | 'paid_at' | 'created_at'>
type AppointmentSummary = Pick<Appointment, 'id' | 'title' | 'start_time' | 'end_time' | 'status' | 'location'>

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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

  // Fetch client
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('company_id', profile.company_id)
    .single()

  if (clientError || !client) {
    notFound()
  }

  // Fetch related data in parallel
  const [quotesResult, invoicesResult, appointmentsResult] = await Promise.all([
    supabase
      .from('quotes')
      .select('id, quote_number, title, status, total, created_at')
      .eq('client_id', id)
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('invoices')
      .select('id, invoice_number, status, total, due_date, paid_at, created_at')
      .eq('client_id', id)
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('appointments')
      .select('id, title, start_time, end_time, status, location')
      .eq('client_id', id)
      .eq('company_id', profile.company_id)
      .order('start_time', { ascending: false }),
  ])

  return (
    <div className="min-h-screen bg-[#f5f5f6]">
      <ClientDetailClient
        client={client as Client}
        quotes={(quotesResult.data as QuoteSummary[]) ?? []}
        invoices={(invoicesResult.data as InvoiceSummary[]) ?? []}
        appointments={(appointmentsResult.data as AppointmentSummary[]) ?? []}
      />
    </div>
  )
}
