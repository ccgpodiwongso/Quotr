import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mollie } from '@/lib/mollie'

// ---------------------------------------------------------------------------
// POST — create a Mollie payment for the invoice
// ---------------------------------------------------------------------------

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', authUser.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json(
        { error: 'Geen bedrijf gevonden.' },
        { status: 404 },
      )
    }

    // Fetch invoice
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .eq('company_id', profile.company_id)
      .single()

    if (fetchError || !invoice) {
      return NextResponse.json(
        { error: 'Factuur niet gevonden.' },
        { status: 404 },
      )
    }

    if (invoice.status === 'paid') {
      return NextResponse.json(
        { error: 'Deze factuur is al betaald.' },
        { status: 400 },
      )
    }

    // Fetch company for description
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', invoice.company_id)
      .single()

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://quotr.nl'
    const webhookUrl = `${baseUrl}/api/webhooks/mollie`
    const redirectUrl = `${baseUrl}/invoice/${invoice.public_token}`

    // Create Mollie payment
    const payment = await mollie.payments.create({
      amount: {
        currency: 'EUR',
        value: invoice.total.toFixed(2),
      },
      description: `Factuur ${invoice.invoice_number} - ${company?.name ?? 'Quotr'}`,
      redirectUrl,
      webhookUrl,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
      },
    })

    // Store Mollie payment details in invoice metadata
    const existingMetadata = (invoice.metadata as Record<string, unknown>) ?? {}
    const updatedMetadata = {
      ...existingMetadata,
      mollie_payment_id: payment.id,
      mollie_payment_url: payment.getCheckoutUrl(),
    }

    const { error: updateError } = await supabase
      .from('invoices')
      .update({ metadata: updatedMetadata })
      .eq('id', id)

    if (updateError) {
      console.error('Failed to store Mollie payment ID:', updateError)
    }

    return NextResponse.json({
      payment_id: payment.id,
      payment_url: payment.getCheckoutUrl(),
    })
  } catch (err) {
    console.error('Mollie payment creation error:', err)
    return NextResponse.json(
      { error: 'Betaallink aanmaken mislukt.' },
      { status: 500 },
    )
  }
}
