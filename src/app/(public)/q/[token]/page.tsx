import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { PublicQuoteView } from '@/components/quotes/public-quote-view';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicQuotePage({ params }: PageProps) {
  const { token } = await params;
  const supabase = createServiceClient();

  // Fetch quote by public (share) token — bypasses RLS
  const { data: quote, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('public_token', token)
    .single();

  if (error || !quote) {
    notFound();
  }

  // Fetch related data in parallel
  const [linesResult, clientResult, companyResult] = await Promise.all([
    supabase
      .from('quote_lines')
      .select('*')
      .eq('quote_id', quote.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('clients')
      .select('*')
      .eq('id', quote.client_id)
      .single(),
    supabase
      .from('companies')
      .select('*')
      .eq('id', quote.company_id)
      .single(),
  ]);

  if (!clientResult.data || !companyResult.data) {
    notFound();
  }

  const lines = linesResult.data ?? [];
  const client = clientResult.data;
  const company = companyResult.data;

  // Determine if the quote is expired
  const isExpired =
    quote.valid_until !== null && new Date(quote.valid_until) < new Date();

  // Log 'viewed' event (fire-and-forget, always log)
  if (!isExpired && quote.status !== 'accepted' && quote.status !== 'rejected') {
    supabase
      .from('quote_events')
      .insert({
        quote_id: quote.id,
        event_type: 'viewed',
        description: 'Offerte bekeken door klant',
        metadata: {},
      })
      .then(() => {
        // Also update viewed_at if not already set
        if (!quote.viewed_at) {
          supabase
            .from('quotes')
            .update({ viewed_at: new Date().toISOString(), status: 'viewed' })
            .eq('id', quote.id)
            .then(() => {});
        }
      });
  }

  return (
    <div className="min-h-screen bg-[#f5f5f6]">
      <PublicQuoteView
        quote={quote}
        lines={lines}
        client={client}
        company={company}
        isExpired={isExpired}
      />
    </div>
  );
}
