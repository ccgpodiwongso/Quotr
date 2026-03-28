import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';
import { invoiceOverdueEmail } from '@/lib/email/templates';

// Vercel cron — runs daily
// vercel.json: { "crons": [{ "path": "/api/cron/overdue", "schedule": "0 9 * * *" }] }

export async function GET(request: Request) {
  // Optional: verify cron secret
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    // Find invoices where the due date has passed and status is still 'sent'
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, invoice_number, total, due_date, client_id, company_id, public_token')
      .eq('status', 'sent')
      .lt('due_date', today);

    if (invoicesError) {
      console.error('[cron/overdue] Error fetching invoices:', invoicesError);
      return NextResponse.json({ error: invoicesError.message }, { status: 500 });
    }

    let processed = 0;

    for (const invoice of invoices ?? []) {
      // Update status to 'overdue'
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ status: 'overdue' })
        .eq('id', invoice.id);

      if (updateError) {
        console.error(
          `[cron/overdue] Error updating invoice ${invoice.id}:`,
          updateError,
        );
        continue;
      }

      // Fetch client details
      const { data: client } = await supabase
        .from('clients')
        .select('name, email')
        .eq('id', invoice.client_id)
        .single();

      if (!client?.email) continue;

      // Fetch company details
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', invoice.company_id)
        .single();

      const companyName = company?.name ?? 'Het bedrijf';
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://getquotr.nl';
      const viewUrl = `${appUrl}/invoice/${invoice.public_token}`;

      // Format the due date for display (DD-MM-YYYY, Dutch convention)
      const [year, month, day] = invoice.due_date.split('-');
      const formattedDueDate = `${day}-${month}-${year}`;

      const html = invoiceOverdueEmail({
        companyName,
        invoiceNumber: invoice.invoice_number,
        clientName: client.name,
        total: invoice.total,
        dueDate: formattedDueDate,
        viewUrl,
      });

      await sendEmail({
        to: client.email,
        subject: `Herinnering: Factuur ${invoice.invoice_number}`,
        html,
      });

      processed++;
    }

    return NextResponse.json({ processed });
  } catch (error) {
    console.error('[cron/overdue] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
