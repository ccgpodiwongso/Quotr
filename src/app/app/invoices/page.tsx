import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InvoicesPageClient } from '@/components/invoices/invoices-page'
import type { Invoice, Client } from '@/types/database'

export const dynamic = 'force-dynamic'

export type InvoiceWithClient = Invoice & {
  client: Pick<Client, 'id' | 'name' | 'email'>
}

export default async function InvoicesPage() {
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

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*, client:clients!client_id(id, name, email)')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching invoices:', error)
  }

  const normalizedInvoices: InvoiceWithClient[] = (invoices ?? []).map((inv) => ({
    ...inv,
    client: inv.client as unknown as Pick<Client, 'id' | 'name' | 'email'>,
  }))

  return (
    <div className="min-h-screen bg-[#f5f5f6]">
      <InvoicesPageClient invoices={normalizedInvoices} />
    </div>
  )
}
