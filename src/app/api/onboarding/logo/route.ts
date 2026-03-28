import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify the user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Niet geautoriseerd.' }, { status: 401 });
    }

    // Get the user's company_id
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return NextResponse.json(
        { error: 'Gebruikersprofiel niet gevonden.' },
        { status: 404 },
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('logo') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Geen bestand geüpload.' },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Ongeldig bestandstype. Gebruik PNG, JPG of SVG.' },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Bestand is te groot. Maximaal 2MB.' },
        { status: 400 },
      );
    }

    // Determine file extension
    const ext = file.type === 'image/svg+xml' ? 'svg' : file.type === 'image/png' ? 'png' : 'jpg';
    const filePath = `logos/${profile.company_id}/logo.${ext}`;

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('company-assets')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: 'Kon bestand niet uploaden.' },
        { status: 500 },
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('company-assets')
      .getPublicUrl(filePath);

    // Update company record with logo URL
    const { error: updateError } = await supabase
      .from('companies')
      .update({ logo_url: urlData.publicUrl })
      .eq('id', profile.company_id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Logo geüpload maar kon bedrijfsrecord niet bijwerken.' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: 'Logo geüpload.',
      logoUrl: urlData.publicUrl,
    });
  } catch {
    return NextResponse.json(
      { error: 'Er is een onverwachte fout opgetreden.' },
      { status: 500 },
    );
  }
}
