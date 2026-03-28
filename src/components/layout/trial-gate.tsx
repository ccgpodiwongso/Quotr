"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Company } from "@/types/database";

interface TrialGateProps {
  children: React.ReactNode;
  company: Pick<
    Company,
    "subscription_plan" | "subscription_status" | "trial_ends_at"
  >;
}

const PRO_FEATURES = [
  "Onbeperkt offertes maken en versturen",
  "Facturen genereren vanuit offertes",
  "Klantenbeheer met contactgegevens",
  "Online agenda en afspraken plannen",
  "Online boekingspagina voor klanten",
  "PDF-export met eigen branding",
  "E-mailnotificaties en herinneringen",
  "AI-assistent voor offerte-teksten",
];

export function TrialGate({ children, company }: TrialGateProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const trialEndsAt = company.trial_ends_at
    ? new Date(company.trial_ends_at)
    : null;

  const isTrialExpired =
    company.subscription_plan === "trial" &&
    trialEndsAt !== null &&
    trialEndsAt < now;

  const isCancelled = company.subscription_plan === "cancelled";

  // If plan is active or trial is still valid, render children normally
  if (!isTrialExpired && !isCancelled) {
    return <>{children}</>;
  }

  async function handleUpgrade() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Er ging iets mis bij het aanmaken van de checkout.");
      }

      // Redirect to Mollie checkout
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Er ging iets mis. Probeer het opnieuw."
      );
      setLoading(false);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      {children}

      {/* Full-page overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
                Q
              </div>
              <span className="text-2xl font-bold text-zinc-900">Quotr</span>
            </div>
          </div>

          {/* Heading */}
          <h2 className="mb-2 text-center text-xl font-semibold text-zinc-900">
            {isCancelled
              ? "Je abonnement is opgezegd"
              : "Je proefperiode is verlopen"}
          </h2>
          <p className="mb-6 text-center text-sm text-zinc-500">
            {isCancelled
              ? "Heractiveer je Pro-abonnement om weer toegang te krijgen tot Quotr."
              : "Upgrade naar Pro voor \u20AC20/maand om door te gaan met Quotr."}
          </p>

          {/* Feature list */}
          <div className="mb-6 rounded-xl bg-zinc-50 p-4">
            <p className="mb-3 text-sm font-medium text-zinc-700">
              Alles in Pro:
            </p>
            <ul className="space-y-2">
              {PRO_FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-zinc-600"
                >
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Price */}
          <div className="mb-6 text-center">
            <span className="text-3xl font-bold text-zinc-900">&euro;20</span>
            <span className="text-sm text-zinc-500">/maand</span>
          </div>

          {/* Error message */}
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <svg
                  className="h-5 w-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : isCancelled ? (
                "Heractiveer Pro"
              ) : (
                "Upgrade naar Pro"
              )}
            </button>
            <button
              onClick={handleLogout}
              className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
            >
              Uitloggen
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
