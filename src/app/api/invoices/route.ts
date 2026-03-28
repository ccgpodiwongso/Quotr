import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateInvoiceNumber } from '@/lib/utils'

// ---------------------------------------------------------------------------
// GET — list invoices for the user's company
// ---------------------------------------------------------------------------

export async function GET() {
  try {
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

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*, client:clients!client_id(id, name, email)')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ invoices })
  } catch {
    return NextResponse.json(
      { error: 'Er is een onverwachte fout opgetreden.' },
      { status: 500 },
    )
  }
}

// ---------------------------------------------------------------------------
// POST — create a new invoice with lines
// ---------------------------------------------------------------------------

interface LinePayload {
  description: string
  quantity: number
  unit_price: number
  tax_rate: number
  sort_order: number
}

export async function POST(request: Request) {
  try {
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

    const body = await request.json()
    const {
      client_id,
      client_name,
      client_email,
      quote_id,
      due_date,
      notes,
      lines,
      status,
    } = body

    // Validate lines
    if (!Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json(
        { error: 'Minimaal een factuurregel is vereist.' },
        { status: 400 },
      )
    }

    // Resolve or create client
    let resolvedClientId = client_id

    if (!resolvedClientId && client_name && client_email) {
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('company_id', profile.company_id)
        .eq('email', client_email)
        .single()

      if (existingClient) {
        resolvedClientId = existingClient.id
      } else {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            company_id: profile.company_id,
            name: client_name,
            email: client_email,
            country: 'NL',
            is_active: true,
          })
          .select('id')
          .single()

        if (clientError) {
          return NextResponse.json(
            { error: `Klant aanmaken mislukt: ${clientError.message}` },
            { status: 500 },
          )
        }
        resolvedClientId = newClient.id
      }
    }

    if (!resolvedClientId) {
      return NextResponse.json(
        { error: 'Selecteer of voer een klant in.' },
        { status: 400 },
      )
    }

    // Get and increment invoice number
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('next_invoice_number')
      .eq('id', profile.company_id)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Bedrijf niet gevonden.' },
        { status: 500 },
      )
    }

    const invoiceNumber = generateInvoiceNumber(company.next_invoice_number)

    // Calculate totals
    const typedLines = lines as LinePayload[]
    const subtotal = typedLines.reduce(
      (sum, l) => sum + l.quantity * l.unit_price,
      0,
    )
    const taxAmount = typedLines.reduce(
      (sum, l) => sum + l.quantity * l.unit_price * (l.tax_rate / 100),
      0,
    )
    const total = subtotal + taxAmount

    // Generate public token
    const publicToken = crypto.randomUUID()

    // Build metadata
    const metadata: Record<string, unknown> = {}
    if (notes) metadata.notes = notes
    if (quote_id) metadata.from_quote_id = quote_id

    // Determine initial status
    const invoiceStatus = status === 'sent' ? 'sent' : 'draft'
    const sentAt = invoiceStatus === 'sent' ? new Date().toISOString() : null

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        company_id: profile.company_id,
        client_id: resolvedClientId,
        quote_id: quote_id || null,
        user_id: authUser.id,
        invoice_number: invoiceNumber,
        status: invoiceStatus,
        subtotal: Math.round(subtotal * 100) / 100,
        tax_amount: Math.round(taxAmount * 100) / 100,
        total: Math.round(total * 100) / 100,
        due_date,
        sent_at: sentAt,
        public_token: publicToken,
        metadata,
      })
      .select('*')
      .single()

    if (invoiceError) {
      return NextResponse.json(
        { error: `Factuur aanmaken mislukt: ${invoiceError.message}` },
        { status: 500 },
      )
    }

    // Create invoice lines
    const lineInserts = typedLines.map((l, i) => ({
      invoice_id: invoice.id,
      description: l.description,
      quantity: l.quantity,
      unit_price: l.unit_price,
      tax_rate: l.tax_rate,
      subtotal: Math.round(l.quantity * l.unit_price * 100) / 100,
      sort_order: l.sort_order ?? i,
    }))

    const { error: linesError } = await supabase
      .from('invoice_lines')
      .insert(lineInserts)

    if (linesError) {
      console.error('Error creating invoice lines:', linesError)
    }

    // Increment company invoice number
    await supabase
      .from('companies')
      .update({ next_invoice_number: company.next_invoice_number + 1 })
      .eq('id', profile.company_id)

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (err) {
    console.error('Invoice creation error:', err)
    return NextResponse.json(
      { error: 'Er is een onverwachte fout opgetreden.' },
      { status: 500 },
    )
  }
}
