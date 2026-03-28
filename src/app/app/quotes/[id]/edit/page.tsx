import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { QuoteBuilderClient } from '@/components/quotes/quote-builder'
import type { Quote, QuoteLine, Service, Client } from '@/types/database'

export const dynamic = 'force-dynamic'

export type QuoteWithLines = Quote & {
  quote_lines: QuoteLine[]
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditQuotePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', authUser.id)
    .single()

  if (!profile?.company_id) redirect('/app/onboarding')

  // Fetch quote, services, and clients in parallel
  const [quoteResult, servicesResult, clientsResult] = await Promise.all([
    supabase
      .from('quotes')
      .select('*, quote_lines(*)')
      .eq('id', id)
      .eq('company_id', profile.company_id)
      .single(),
    supabase
      .from('services')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('clients')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .order('name', { ascending: true }),
  ])

  if (quoteResult.error || !quoteResult.data) {
    notFound()
  }

  const quote: QuoteWithLines = {
    ...quoteResult.data,
    quote_lines: (
      (quoteResult.data.quote_lines as unknown as QuoteLine[]) ?? []
    ).sort((a, b) => a.sort_order - b.sort_order),
  }

  const services: Service[] = servicesResult.data ?? []
  const clients: Client[] = clientsResult.data ?? []

  return (
    <div>
      <PageHeader
        title={`Offerte bewerken — ${quote.quote_number}`}
        description="Pas de offerte aan en sla op."
      />
      <QuoteBuilderClient
        services={services}
        clients={clients}
        existingQuote={quote}
        existingLines={quote.quote_lines}
      />
    </div>
  )
}
