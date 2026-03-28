import { NextRequest, NextResponse } from 'next/server'
import { mollie } from '@/lib/mollie'
import { createServiceClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// POST — Mollie webhook handler
// Mollie sends a POST with { id: "tr_..." } when a payment status changes.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData()
    const paymentId = body.get('id') as string | null

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Missing payment id.' },
        { status: 400 },
      )
    }

    // Fetch payment details from Mollie
    const payment = await mollie.payments.get(paymentId)

    // Extract invoice ID from metadata
    const metadata = payment.metadata as { invoice_id?: string } | null
    const invoiceId = metadata?.invoice_id

    if (!invoiceId) {
      // Not an invoice payment — ignore
      return new NextResponse(null, { status: 200 })
    }

    const supabase = createServiceClient()

    if (payment.status === 'paid') {
      const now = new Date().toISOString()

      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: now,
        })
        .eq('id', invoiceId)

      if (updateError) {
        console.error('Failed to update invoice to paid:', updateError)
        return NextResponse.json(
          { error: 'Database update failed.' },
          { status: 500 },
        )
      }
    }

    // Always return 200 so Mollie does not retry unnecessarily
    return new NextResponse(null, { status: 200 })
  } catch (err) {
    console.error('Mollie webhook error:', err)
    // Return 200 anyway to prevent Mollie from retrying on transient errors
    // In production, you might want to return 500 for true failures
    return new NextResponse(null, { status: 200 })
  }
}
