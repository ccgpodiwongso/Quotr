import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend'

// ---------------------------------------------------------------------------
// POST — mark invoice as sent and email the client
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
        { error: 'Een betaalde factuur kan niet opnieuw verstuurd worden.' },
        { status: 400 },
      )
    }

    // Fetch client and company
    const [clientResult, companyResult] = await Promise.all([
      supabase.from('clients').select('*').eq('id', invoice.client_id).single(),
      supabase
        .from('companies')
        .select('*')
        .eq('id', invoice.company_id)
        .single(),
    ])

    const client = clientResult.data
    const company = companyResult.data

    if (!client || !company) {
      return NextResponse.json(
        { error: 'Klant of bedrijf niet gevonden.' },
        { status: 404 },
      )
    }

    // Build public invoice URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://quotr.nl'
    const invoiceUrl = `${baseUrl}/invoice/${invoice.public_token}`

    // Send email via Resend
    const fromEmail = process.env.RESEND_FROM_EMAIL || `facturen@${baseUrl.replace('https://', '')}`

    await resend.emails.send({
      from: `${company.name} <${fromEmail}>`,
      to: [client.email],
      subject: `Factuur ${invoice.invoice_number} van ${company.name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #111112;">Factuur ${invoice.invoice_number}</h2>
          <p>Beste ${client.contact_person || client.name},</p>
          <p>Hierbij ontvangt u factuur <strong>${invoice.invoice_number}</strong> van ${company.name}.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
            <tr>
              <td style="padding: 8px 0; color: #71717a;">Factuurnummer</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600;">${invoice.invoice_number}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #71717a;">Bedrag</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600; font-family: monospace;">
                &euro; ${invoice.total.toFixed(2).replace('.', ',')}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #71717a;">Vervaldatum</td>
              <td style="padding: 8px 0; text-align: right;">${new Date(invoice.due_date).toLocaleDateString('nl-NL')}</td>
            </tr>
          </table>
          <a href="${invoiceUrl}" style="display: inline-block; background-color: #111112; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            Factuur bekijken
          </a>
          <p style="margin-top: 32px; color: #71717a; font-size: 14px;">
            Met vriendelijke groet,<br/>${company.name}
          </p>
        </div>
      `,
    })

    // Update invoice status
    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ status: 'sent', sent_at: now })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Factuur versturen gelukt, maar status bijwerken mislukt.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, sent_at: now })
  } catch (err) {
    console.error('Invoice send error:', err)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het versturen.' },
      { status: 500 },
    )
  }
}
