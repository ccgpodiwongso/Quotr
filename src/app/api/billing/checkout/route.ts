import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mollie } from "@/lib/mollie";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://quotr.nl";
const WEBHOOK_URL = process.env.MOLLIE_WEBHOOK_URL || `${APP_URL}/api/billing/webhook`;

export async function POST() {
  try {
    const supabase = await createClient();

    // ---- Authenticate ----
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    }

    // ---- Fetch user profile ----
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("company_id")
      .eq("id", authUser.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Gebruikersprofiel niet gevonden." },
        { status: 404 }
      );
    }

    // ---- Fetch company ----
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name, email, mollie_customer_id")
      .eq("id", profile.company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: "Bedrijf niet gevonden." },
        { status: 404 }
      );
    }

    // ---- Create or re-use Mollie customer ----
    let mollieCustomerId = company.mollie_customer_id;

    if (!mollieCustomerId) {
      const customer = await mollie.customers.create({
        name: company.name,
        email: company.email,
      });

      mollieCustomerId = customer.id;

      await supabase
        .from("companies")
        .update({ mollie_customer_id: mollieCustomerId } as Record<string, unknown>)
        .eq("id", company.id);
    }

    // ---- Create first payment (Mollie requires a first payment before subscriptions) ----
    const payment = await mollie.payments.create({
      amount: {
        currency: "EUR",
        value: "20.00",
      },
      customerId: mollieCustomerId,
      description: "Quotr Pro — maandabonnement",
      sequenceType: "first" as any,
      redirectUrl: `${APP_URL}/app/settings?tab=billing`,
      webhookUrl: WEBHOOK_URL,
      metadata: {
        company_id: company.id,
        type: "first_payment",
      },
    });

    // ---- Log billing event ----
    await supabase.from("billing_events").insert({
      company_id: company.id,
      event_type: "checkout_created",
      amount: 20.0,
      currency: "EUR",
      mollie_payment_id: payment.id,
      status: "pending",
      metadata: {
        mollie_customer_id: mollieCustomerId,
      },
    });

    const checkoutUrl = (payment as any).getCheckoutUrl?.() ?? (payment as any)._links?.checkout?.href;

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "Kon geen checkout URL aanmaken." },
        { status: 500 }
      );
    }

    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    console.error("[billing/checkout] Error:", err);
    return NextResponse.json(
      { error: "Er ging iets mis. Probeer het later opnieuw." },
      { status: 500 }
    );
  }
}
