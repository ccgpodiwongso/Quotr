import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { anthropic } from '@/lib/anthropic';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', authUser.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json(
        { error: 'Geen bedrijf gevonden.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string' || text.trim().length < 5) {
      return NextResponse.json(
        { error: 'Voer een beschrijving of e-mail in (minimaal 5 tekens).' },
        { status: 400 }
      );
    }

    // Fetch user's service catalog for context
    const { data: services } = await supabase
      .from('services')
      .select('id, name, description, unit_price, unit, tax_rate')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    const serviceCatalog =
      services && services.length > 0
        ? services
            .map(
              (s) =>
                `- ID: ${s.id} | "${s.name}" | ${s.unit_price} EUR/${s.unit} | BTW ${s.tax_rate}%${s.description ? ` | ${s.description}` : ''}`
            )
            .join('\n')
        : 'Geen diensten geconfigureerd.';

    const systemPrompt = `You are Quotr AI, a quoting assistant for Dutch freelancers.
The user will paste a client email or project description.
Extract: client name, client email (if present), list of services/deliverables with estimated quantities.
Match against the user's service catalog when possible. If a service matches, use its ID, price, and tax rate. If no match, set service_id to null and estimate a reasonable price.

The user's service catalog:
${serviceCatalog}

Return JSON only — no markdown fences, no explanation. Use this exact structure:
{
  "client_name": "",
  "client_email": "",
  "lines": [{ "description": "", "quantity": 1, "unit_price": 0, "service_id": "or null", "vat_rate": 21 }],
  "notes": "",
  "ai_talking_point": "A brief suggested follow-up message or negotiation tip in the same language as the input"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: text.trim(),
        },
      ],
    });

    // Extract text content from response
    const textBlock = message.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json(
        { error: 'Geen bruikbaar antwoord van AI.' },
        { status: 500 }
      );
    }

    // Parse JSON from response — handle potential markdown fences
    let rawJson = textBlock.text.trim();
    if (rawJson.startsWith('```')) {
      rawJson = rawJson.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    let parsed;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      return NextResponse.json(
        { error: 'AI-antwoord kon niet worden verwerkt.' },
        { status: 500 }
      );
    }

    // Validate structure
    const result = {
      client_name: String(parsed.client_name ?? ''),
      client_email: String(parsed.client_email ?? ''),
      lines: Array.isArray(parsed.lines)
        ? parsed.lines.map((l: Record<string, unknown>) => ({
            description: String(l.description ?? ''),
            quantity: Number(l.quantity) || 1,
            unit_price: Number(l.unit_price) || 0,
            service_id: l.service_id && typeof l.service_id === 'string' ? l.service_id : null,
            vat_rate: Number(l.vat_rate) || 21,
          }))
        : [],
      notes: String(parsed.notes ?? ''),
      ai_talking_point: String(parsed.ai_talking_point ?? ''),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('Quote parse error:', err);
    return NextResponse.json(
      { error: 'Er is een onverwachte fout opgetreden bij het analyseren.' },
      { status: 500 }
    );
  }
}
