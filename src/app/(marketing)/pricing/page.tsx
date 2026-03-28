import Link from "next/link";
import { Check, ChevronDown, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Quotr",
  description:
    "Eenvoudige, eerlijke prijzen. Eén plan met alles wat je nodig hebt als freelancer.",
};

const allFeatures = [
  {
    category: "Offertes",
    items: [
      "Onbeperkt offertes maken",
      "AI Offerte Builder",
      "Automatisch offertes genereren uit e-mails",
      "Professionele PDF-export",
      "Offertes versturen per e-mail",
      "Status tracking (verzonden, bekeken, geaccepteerd)",
    ],
  },
  {
    category: "Facturen & Betalingen",
    items: [
      "Onbeperkt facturen maken",
      "Eén klik van offerte naar factuur",
      "Mollie-betaallinks (iDEAL, creditcard, etc.)",
      "Automatische betalingsherinneringen",
      "Factuur PDF-export",
      "CSV-export voor belastingaangifte",
    ],
  },
  {
    category: "Planning & Klanten",
    items: [
      "Agenda & afspraken",
      "Publieke boekingspagina",
      "Klantenbeheer met volledig overzicht",
      "Notities per klant",
    ],
  },
  {
    category: "Platform",
    items: [
      "PWA — installeer op telefoon of tablet",
      "Werkt op elk apparaat",
      "Beveiligd met PIN-export",
      "Prioriteit e-mail support",
    ],
  },
];

const pricingFaqItems = [
  {
    q: "Hoe lang duurt de gratis proefperiode?",
    a: "Je krijgt 14 dagen volledig gratis toegang tot alle functies van Quotr. Er is geen creditcard nodig om te starten.",
  },
  {
    q: "Kan ik maandelijks opzeggen?",
    a: "Ja, je kunt op elk moment opzeggen. Er is geen langlopend contract. Na opzegging heb je nog toegang tot het einde van je betaalperiode.",
  },
  {
    q: "Zijn er extra kosten voor de Mollie-integratie?",
    a: "Quotr rekent geen extra kosten voor de Mollie-integratie. Je betaalt alleen de standaard transactiekosten van Mollie zelf (bijv. \u20AC0,29 per iDEAL-transactie).",
  },
  {
    q: "Krijg ik een factuur voor mijn Quotr-abonnement?",
    a: "Ja, je ontvangt maandelijks een factuur per e-mail die je kunt gebruiken voor je boekhouding.",
  },
  {
    q: "Is er een jaarabonnement met korting?",
    a: "Op dit moment bieden we alleen maandelijkse abonnementen aan. We werken aan een jaarplan met korting — houd onze updates in de gaten.",
  },
  {
    q: "Wat gebeurt er met mijn data als ik opzeg?",
    a: "Na opzegging heb je nog 30 dagen toegang om je data te exporteren. Daarna worden je gegevens veilig verwijderd.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f6]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <span className="text-xl font-semibold text-[#111112] tracking-tight">
                Quotr
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link
                href="/#features"
                className="text-sm text-gray-600 hover:text-[#111112] transition-colors"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className="text-sm text-[#111112] font-medium"
              >
                Pricing
              </Link>
              <Link
                href="/about"
                className="text-sm text-gray-600 hover:text-[#111112] transition-colors"
              >
                About
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-sm font-medium text-[#111112] hover:bg-gray-100 rounded-lg transition-colors"
              >
                Inloggen
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Gratis proberen
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="pt-32 pb-16 sm:pt-40 sm:pb-20 px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-[#111112] tracking-tight mb-4">
            Eenvoudige, eerlijke prijzen
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Eén plan met alles wat je nodig hebt. Geen verrassingen, geen
            verborgen kosten.
          </p>
        </section>

        {/* Plan card */}
        <section className="pb-20 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200/80 p-8 sm:p-10">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 pb-8 border-b border-gray-100">
                <div>
                  <span className="text-sm font-medium text-blue-600 uppercase tracking-wide">
                    Pro
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-5xl font-bold text-[#111112]">
                      &euro;20
                    </span>
                    <span className="text-gray-500">/maand</span>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm text-gray-500">
                    14 dagen gratis proberen
                  </p>
                  <p className="text-xs text-gray-400">
                    Geen creditcard nodig
                  </p>
                </div>
              </div>

              {allFeatures.map((section) => (
                <div key={section.category} className="mb-6 last:mb-0">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    {section.category}
                  </h3>
                  <ul className="space-y-2.5" role="list">
                    {section.items.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="mt-8 pt-8 border-t border-gray-100">
                <Link
                  href="/auth/register"
                  className="flex items-center justify-center gap-2 w-full px-6 py-3.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Start gratis proefperiode
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-[#111112] tracking-tight text-center mb-12">
              Vragen over prijzen & betaling
            </h2>
            <div className="space-y-3">
              {pricingFaqItems.map((item, i) => (
                <details
                  key={i}
                  className="group bg-[#f5f5f6] rounded-xl overflow-hidden"
                >
                  <summary className="flex items-center justify-between px-6 py-4 cursor-pointer text-sm font-medium text-[#111112] hover:bg-gray-100 transition-colors list-none [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" />
                  </summary>
                  <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-[#111112] tracking-tight mb-4">
              Klaar om te beginnen?
            </h2>
            <p className="text-gray-600 mb-8">
              Probeer Quotr 14 dagen gratis. Geen creditcard, geen
              verplichtingen.
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Start gratis proefperiode
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">Q</span>
                </div>
                <span className="text-lg font-semibold text-[#111112] tracking-tight">
                  Quotr
                </span>
              </Link>
              <p className="text-xs text-gray-500">
                &copy; 2026 Quotr. Alle rechten voorbehouden.
              </p>
            </div>
            <nav
              className="flex flex-wrap gap-x-6 gap-y-2"
              aria-label="Footer navigatie"
            >
              <Link
                href="/#features"
                className="text-sm text-gray-500 hover:text-[#111112] transition-colors"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className="text-sm text-gray-500 hover:text-[#111112] transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/about"
                className="text-sm text-gray-500 hover:text-[#111112] transition-colors"
              >
                About
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-gray-500 hover:text-[#111112] transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-gray-500 hover:text-[#111112] transition-colors"
              >
                Terms
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
