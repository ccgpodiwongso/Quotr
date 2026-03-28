import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { BookingPageClient } from '@/components/booking/booking-page'
import type { Company, AvailabilitySlot } from '@/types/database'

export const dynamic = 'force-dynamic'

interface BookPageProps {
  params: Promise<{ slug: string }>
}

export default async function BookPage({ params }: BookPageProps) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data: companyData, error: companyError } = await supabase
    .from('companies')
    .select('id, name, slug, email, logo_url')
    .eq('slug', slug)
    .single()

  const company = companyData as Pick<Company, 'id' | 'name' | 'slug' | 'email' | 'logo_url'> | null

  if (companyError || !company) {
    notFound()
  }

  const { data: slotsData } = await supabase
    .from('availability_slots')
    .select('*')
    .eq('company_id', company.id)
    .eq('is_active', true)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })

  const slots = (slotsData ?? []) as AvailabilitySlot[]

  if (slots.length === 0) {
    notFound()
  }

  // Build a set of available day_of_week numbers
  const availableDays = Array.from(new Set(slots.map((s) => s.day_of_week)))

  return (
    <BookingPageClient
      company={company}
      availableDays={availableDays}
      slug={slug}
    />
  )
}
