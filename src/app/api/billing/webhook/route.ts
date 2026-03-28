import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { mollie } from "@/lib/mollie";

/**
 * Mollie webhook handler.
 *
 * Mollie sends a POST with `id` (the payment ID) in the body. We fetch the
 * payment from Mollie, check its status, and update the company accordingly.
 *
 * IMPORTANT: This endpoint must always return 200. If we return an error,
 * Mollie will keep retrying which can cause duplicate processing.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const paymentId = body.get("id") as string | null;

    if (!paymentId) {
      console.error("[billing/webhook] No payment ID in request body");
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Use service client — webhooks have no user session
    const supabase = createServiceClient();

    // ---- Fetch payment from Mollie ----
    const payment = await mollie.payments.get(paymentId);
    const metadata = payment.metadata as {
      company_id?: string;
      type?: string;
    } | null;

    if (!metadata?.company_id) {
      console.error(
        "[billing/webhook] Payment has no company_id in metadata:",
        paymentId
      );
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const companyId = metadata.company_id;

    // ---- Handle based on payment status ----
    if (payment.status === "paid") {
      // Update company plan to pro
      await supabase
        .from("companies")
        .update({
          subscription_plan: "pro",
          subscription_status: "active",
        } as Record<string, unknown>)
        .eq("id", companyId);

      // If this was a first payment, create the recurring subscription
      if (payment.sequenceType === "first" && payment.customerId) {
        try {
          const subscription = await mollie.customerSubscriptions.create({
            customerId: payment.customerId,
            amount: {
              currency: "EUR",
              value: "20.00",
            },
            interval: "1 month",
            description: "Quotr Pro — maandabonnement",
            webhookUrl:
              process.env.MOLLIE_WEBHOOK_URL ||
              `${process.env.NEXT_PUBLIC_APP_URL || "https://quotr.nl"}/api/billing/webhook`,
            metadata: {
              company_id: companyId,
              type: "recurring",
            },
          });

          // Store subscription ID on the company
          await supabase
            .from("companies")
            .update({
              mollie_subscription_id: subscription.id,
            } as Record<string, unknown>)
            .eq("id", companyId);
        } catch (subError) {
          console.error(
            "[billing/webhook] Failed to create subscription:",
            subError
          );
          // The payment was still successful — log the error but don't fail
          await supabase.from("billing_events").insert({
            company_id: companyId,
            event_type: "subscription_creation_failed",
            amount: 0,
            currency: "EUR",
            mollie_payment_id: paymentId,
            status: "failed",
            metadata: {
              error: subError instanceof Error ? subError.message : "Unknown error",
            },
          });
        }
      }

      // Log successful payment
      await supabase.from("billing_events").insert({
        company_id: companyId,
        event_type: "payment_succeeded",
        amount: parseFloat(payment.amount.value),
        currency: payment.amount.currency,
        mollie_payment_id: paymentId,
        status: "completed",
        metadata: {
          sequence_type: payment.sequenceType,
          method: payment.method ?? null,
        },
      });
    } else if (payment.status === "failed" || payment.status === "expired" || payment.status === "canceled") {
      // Log failed payment
      await supabase.from("billing_events").insert({
        company_id: companyId,
        event_type: "payment_failed",
        amount: parseFloat(payment.amount.value),
        currency: payment.amount.currency,
        mollie_payment_id: paymentId,
        status: "failed",
        metadata: {
          payment_status: payment.status,
          sequence_type: payment.sequenceType,
          failure_reason: (payment as unknown as Record<string, unknown>).details ?? null,
        },
      });

      // If a recurring payment fails, mark the subscription status
      if (payment.sequenceType === "recurring") {
        await supabase
          .from("companies")
          .update({
            subscription_status: "past_due",
          } as Record<string, unknown>)
          .eq("id", companyId);
      }
    }
    // For "open" or "pending" statuses, we do nothing and wait for the next webhook

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    // Always return 200 to prevent Mollie from retrying indefinitely
    console.error("[billing/webhook] Unhandled error:", err);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
