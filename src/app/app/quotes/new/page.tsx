import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/page-header';
import { QuoteBuilderClient } from '@/components/quotes/quote-builder';
import type { Service, Client } from '@/types/database';

export default async function NewQuotePage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', authUser.id)
    .single();

  if (!profile?.company_id) {
    redirect('/app/onboarding');
  }

  const [servicesResult, clientsResult] = await Promise.all([
    supabase
      .from('services')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('clients')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .order('name', { ascending: true }),
  ]);

  const services: Service[] = servicesResult.data ?? [];
  const clients: Client[] = clientsResult.data ?? [];

  return (
    <div>
      <PageHeader
        title="Nieuwe offerte"
        description="Maak een offerte met AI of handmatig."
      />
      <QuoteBuilderClient services={services} clients={clients} />
    </div>
  );
}
