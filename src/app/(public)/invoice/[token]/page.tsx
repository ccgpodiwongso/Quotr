import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { PublicInvoiceView } from '@/components/invoices/public-invoice-view'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function PublicInvoicePage({ params }: PageProps) {
  const { token } = await params
  const supabase = createServiceClient()

  // Fetch invoice by public (share) token — bypasses RLS
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('public_token', token)
    .single()

  if (error || !invoice) {
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

  if (!clientResult.data || !companyResult.data) {
    notFound()
  }

  const lines = linesResult.data ?? []
  const client = clientResult.data
  const company = companyResult.data

  // Extract Mollie payment URL from metadata
  const metadata = (invoice.metadata ?? {}) as Record<string, unknown>
  const molliePaymentUrl = metadata.mollie_payment_url as string | undefined

  return (
    <div className="min-h-screen bg-[#f5f5f6]">
      <PublicInvoiceView
        invoice={invoice}
        lines={lines}
        client={client}
        company={company}
        molliePaymentUrl={molliePaymentUrl}
      />
    </div>
  )
}
