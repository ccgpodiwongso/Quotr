import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InvoiceDetailClient } from '@/components/invoices/invoice-detail'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function InvoiceDetailPage({ params }: PageProps) {
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

  // Fetch invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .eq('company_id', profile.company_id)
    .single()

  if (invoiceError || !invoice) {
    notFound()
  }

  // Fetch related data in parallel
  const [linesResult, clientResult, companyResult] = await Promise.all([
    supabase
      .from('invoice_lines')
      .select('*')
      .eq('invoice_id', invoice.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('clients')
      .select('*')
      .eq('id', invoice.client_id)
      .single(),
    supabase
      .from('companies')
      .select('*')
      .eq('id', invoice.company_id)
      .single(),
  ])

  const lines = linesResult.data ?? []
  const client = clientResult.data
  const company = companyResult.data

  if (!client || !company) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#f5f5f6]">
      <InvoiceDetailClient
        invoice={invoice}
        lines={lines}
        client={client}
        company={company}
      />
    </div>
  )
}
