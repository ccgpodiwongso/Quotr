import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { QuotePipelineClient } from '@/components/quotes/pipeline'
import type { Quote, Client } from '@/types/database'

export const dynamic = 'force-dynamic'

export type QuoteWithClient = Quote & {
  client: Pick<Client, 'id' | 'name' | 'email'>
}

export default async function QuotesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get user profile for company_id
  const { data: profile } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) redirect('/app/onboarding')

  // Fetch all quotes for this company with client info
  const { data: quotes, error } = await supabase
    .from('quotes')
    .select('*, client:clients!client_id(id, name, email)')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching quotes:', error)
  }

  // Supabase returns the join as an object, normalize it
  const normalizedQuotes: QuoteWithClient[] = (quotes ?? []).map((q) => ({
    ...q,
    client: q.client as unknown as Pick<Client, 'id' | 'name' | 'email'>,
  }))

  return (
    <div className="min-h-screen bg-[#f5f5f6]">
      <QuotePipelineClient quotes={normalizedQuotes} />
    </div>
  )
}
