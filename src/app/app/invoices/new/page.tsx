import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InvoiceFormClient } from '@/components/invoices/invoice-form'
import type { Client, QuoteLine, Quote, Company } from '@/types/database'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ from_quote?: string }>
}

export default async function NewInvoicePage({ searchParams }: PageProps) {
  const { from_quote } = await searchParams
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

  // Fetch company for invoice_due_days setting
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', profile.company_id)
    .single()

  if (!company) redirect('/app/onboarding')

  // Fetch clients for selector
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('company_id', profile.company_id)
    .eq('is_active', true)
    .order('name', { ascending: true })

  // If creating from a quote, fetch quote data with lines
  let quote: Quote | null = null
  let quoteLines: QuoteLine[] = []

  if (from_quote) {
    const { data: quoteData } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', from_quote)
      .eq('company_id', profile.company_id)
      .single()

    if (quoteData) {
      quote = quoteData

      const { data: lines } = await supabase
        .from('quote_lines')
        .select('*')
        .eq('quote_id', quoteData.id)
        .order('sort_order', { ascending: true })

      quoteLines = lines ?? []
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f6]">
      <InvoiceFormClient
        clients={clients ?? []}
        company={company}
        userId={user.id}
        fromQuote={quote}
        quoteLines={quoteLines}
      />
    </div>
  )
}
