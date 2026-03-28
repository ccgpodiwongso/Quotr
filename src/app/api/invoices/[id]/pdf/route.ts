import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { InvoicePdfDocument } from '@/components/invoices/invoice-pdf'

// ---------------------------------------------------------------------------
// GET — generate and return a PDF for the invoice
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

    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .eq('company_id', profile.company_id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Factuur niet gevonden.' },
        { status: 404 },
      )
    }

    // Fetch lines, client, company in parallel
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
      return NextResponse.json(
        { error: 'Klant of bedrijf niet gevonden.' },
        { status: 404 },
      )
    }

    // Render PDF to buffer
    const buffer = await (renderToBuffer as any)(
      React.createElement(InvoicePdfDocument, {
        invoice,
        lines,
        client,
        company,
      }),
    )

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${invoice.invoice_number}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('PDF generation error:', err)
    return NextResponse.json(
      { error: 'PDF genereren mislukt.' },
      { status: 500 },
    )
  }
}
