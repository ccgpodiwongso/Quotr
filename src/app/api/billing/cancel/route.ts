import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mollie } from "@/lib/mollie";

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
      .select("company_id, role")
      .eq("id", authUser.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Gebruikersprofiel niet gevonden." },
        { status: 404 }
      );
    }

    // Only owners can cancel
    if (profile.role !== "owner") {
      return NextResponse.json(
        { error: "Alleen de eigenaar kan het abonnement opzeggen." },
        { status: 403 }
      );
    }

    // ---- Fetch company ----
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select(
        "id, mollie_customer_id, mollie_subscription_id, subscription_plan"
      )
      .eq("id", profile.company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: "Bedrijf niet gevonden." },
        { status: 404 }
      );
    }

    if (company.subscription_plan !== "pro") {
      return NextResponse.json(
        { error: "Er is geen actief abonnement om op te zeggen." },
        { status: 400 }
      );
    }

    // ---- Cancel Mollie subscription ----
    if (company.mollie_customer_id && company.mollie_subscription_id) {
      try {
        await mollie.customerSubscriptions.cancel(
          company.mollie_subscription_id,
          { customerId: company.mollie_customer_id }
        );
      } catch (mollieError) {
        // If subscription is already cancelled on Mollie's side, continue
        console.warn(
          "[billing/cancel] Mollie cancellation warning:",
          mollieError
        );
      }
    }

    // ---- Update company plan ----
    await supabase
      .from("companies")
      .update({
        subscription_plan: "cancelled",
        subscription_status: "cancelled",
        mollie_subscription_id: null,
      } as Record<string, unknown>)
      .eq("id", company.id);

    // ---- Log billing event ----
    await supabase.from("billing_events").insert({
      company_id: company.id,
      event_type: "subscription_cancelled",
      amount: 0,
      currency: "EUR",
      mollie_payment_id: null,
      status: "completed",
      metadata: {
        cancelled_by: authUser.id,
        previous_plan: company.subscription_plan,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[billing/cancel] Error:", err);
    return NextResponse.json(
      { error: "Er ging iets mis. Probeer het later opnieuw." },
      { status: 500 }
    );
  }
}
