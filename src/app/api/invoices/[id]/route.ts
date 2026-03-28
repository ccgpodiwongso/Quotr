import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// GET — fetch a single invoice with lines, client and company
// ---------------------------------------------------------------------------

export async function GET(
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

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .eq('company_id', profile.company_id)
      .single()

    if (error || !invoice) {
      return NextResponse.json(
        { error: 'Factuur niet gevonden.' },
        { status: 404 },
      )
    }

    // Fetch lines, client and company in parallel
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

    return NextResponse.json({
      invoice,
      lines: linesResult.data ?? [],
      client: clientResult.data,
      company: companyResult.data,
    })
  } catch {
    return NextResponse.json(
      { error: 'Er is een onverwachte fout opgetreden.' },
      { status: 500 },
    )
  }
}

// ---------------------------------------------------------------------------
// PUT — update an invoice and its lines
// ---------------------------------------------------------------------------

export async function PUT(
  request: NextRequest,
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

    // Verify invoice belongs to company
    const { data: existing } = await supabase
      .from('invoices')
      .select('id, status')
      .eq('id', id)
      .eq('company_id', profile.company_id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'Factuur niet gevonden.' },
        { status: 404 },
      )
    }

    if (existing.status === 'paid') {
      return NextResponse.json(
        { error: 'Een betaalde factuur kan niet meer bewerkt worden.' },
        { status: 400 },
      )
    }

    const body = await request.json()
    const { client_id, due_date, notes, lines, status } = body

    // Recalculate totals if lines are provided
    let updateData: Record<string, unknown> = {}

    if (client_id) updateData.client_id = client_id
    if (due_date) updateData.due_date = due_date
    if (status) updateData.status = status
    if (notes !== undefined) {
      updateData.metadata = { notes }
    }

    if (Array.isArray(lines) && lines.length > 0) {
      const subtotal = lines.reduce(
        (sum: number, l: { quantity: number; unit_price: number }) =>
          sum + l.quantity * l.unit_price,
        0,
      )
      const taxAmount = lines.reduce(
        (sum: number, l: { quantity: number; unit_price: number; tax_rate: number }) =>
          sum + l.quantity * l.unit_price * (l.tax_rate / 100),
        0,
      )
      const total = subtotal + taxAmount

      updateData = {
        ...updateData,
        subtotal: Math.round(subtotal * 100) / 100,
        tax_amount: Math.round(taxAmount * 100) / 100,
        total: Math.round(total * 100) / 100,
      }

      // Delete existing lines and re-insert
      await supabase.from('invoice_lines').delete().eq('invoice_id', id)

      const lineInserts = lines.map(
        (
          l: {
            description: string
            quantity: number
            unit_price: number
            tax_rate: number
            sort_order?: number
          },
          i: number,
        ) => ({
          invoice_id: id,
          description: l.description,
          quantity: l.quantity,
          unit_price: l.unit_price,
          tax_rate: l.tax_rate,
          subtotal: Math.round(l.quantity * l.unit_price * 100) / 100,
          sort_order: l.sort_order ?? i,
        }),
      )

      await supabase.from('invoice_lines').insert(lineInserts)
    }

    const { data: invoice, error: updateError } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: `Bijwerken mislukt: ${updateError.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json({ invoice })
  } catch {
    return NextResponse.json(
      { error: 'Er is een onverwachte fout opgetreden.' },
      { status: 500 },
    )
  }
}

// ---------------------------------------------------------------------------
// DELETE — remove an invoice and its lines
// ---------------------------------------------------------------------------

export async function DELETE(
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

    // Verify ownership
    const { data: existing } = await supabase
      .from('invoices')
      .select('id, status')
      .eq('id', id)
      .eq('company_id', profile.company_id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'Factuur niet gevonden.' },
        { status: 404 },
      )
    }

    if (existing.status === 'paid') {
      return NextResponse.json(
        { error: 'Een betaalde factuur kan niet verwijderd worden.' },
        { status: 400 },
      )
    }

    // Delete lines first, then invoice
    await supabase.from('invoice_lines').delete().eq('invoice_id', id)
    const { error: deleteError } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json(
        { error: `Verwijderen mislukt: ${deleteError.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Er is een onverwachte fout opgetreden.' },
      { status: 500 },
    )
  }
}
