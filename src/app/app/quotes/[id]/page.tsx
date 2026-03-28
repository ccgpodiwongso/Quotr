import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { QuoteDetailClient } from '@/components/quotes/quote-detail'
import type { Quote, QuoteLine, QuoteEvent, Client } from '@/types/database'

export const dynamic = 'force-dynamic'

export type QuoteWithDetails = Quote & {
  client: Pick<Client, 'id' | 'name' | 'email' | 'phone' | 'address_line1' | 'postal_code' | 'city'>
  quote_lines: QuoteLine[]
  quote_events: QuoteEvent[]
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function QuoteDetailPage({ params }: PageProps) {
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

  // Fetch quote with related data
  const { data: quote, error } = await supabase
    .from('quotes')
    .select(
      '*, client:clients!client_id(id, name, email, phone, address_line1, postal_code, city), quote_lines(*), quote_events(*)'
    )
    .eq('id', id)
    .eq('company_id', profile.company_id)
    .single()

  if (error || !quote) {
    notFound()
  }

  // Normalize the join shapes
  const normalizedQuote: QuoteWithDetails = {
    ...quote,
    client: quote.client as unknown as QuoteWithDetails['client'],
    quote_lines: (quote.quote_lines as unknown as QuoteLine[]).sort(
      (a, b) => a.sort_order - b.sort_order
    ),
    quote_events: (quote.quote_events as unknown as QuoteEvent[]).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
  }

  return (
    <div className="min-h-screen bg-[#f5f5f6]">
      <QuoteDetailClient quote={normalizedQuote} />
    </div>
  )
}
