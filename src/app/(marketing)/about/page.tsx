import Link from "next/link";
import { ArrowRight, Target, Heart, Zap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Over Quotr — Je freelance assistent",
  description:
    "Quotr is gebouwd voor Nederlandse freelancers en ZZP'ers. Ontdek ons verhaal, onze missie en onze waarden.",
};

const values = [
  {
    icon: Target,
    title: "Eenvoud boven alles",
    description:
      "Freelancers willen geen ingewikkelde software. Quotr is ontworpen om intuïtief te zijn — zodat je meer tijd besteedt aan je vak en minder aan administratie.",
  },
  {
    icon: Zap,
    title: "AI die je echt helpt",
    description:
      "Onze AI is geen gimmick. Het analyseert echte klantvragen en genereert offertes die je direct kunt versturen. Slim, snel en betrouwbaar.",
  },
  {
    icon: Heart,
    title: "Gemaakt voor Nederland",
    description:
      "Van de taal tot de Mollie-integratie, van BTW-berekeningen tot belastingexports — Quotr is van de grond af aan gebouwd voor de Nederlandse markt.",
  },
];

export default function AboutPage() {
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
              <Link href="/#features" className="text-sm text-gray-600 hover:text-[#111112] transition-colors">Features</Link>
              <Link href="/pricing" className="text-sm text-gray-600 hover:text-[#111112] transition-colors">Pricing</Link>
              <Link href="/about" className="text-sm text-[#111112] font-medium">About</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="px-4 py-2 text-sm font-medium text-[#111112] hover:bg-gray-100 rounded-lg transition-colors">Inloggen</Link>
              <Link href="/auth/register" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Gratis proberen</Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="pt-32 pb-16 sm:pt-40 sm:pb-20 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-[#111112] tracking-tight mb-6">
              Gebouwd voor Nederlandse freelancers
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Quotr is ontstaan uit frustratie. Frustratie over software die niet
              begrijpt hoe het is om als ZZP&apos;er in Nederland te werken. Te
              complex, te duur, of simpelweg niet relevant.
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="pb-20 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200/80 p-8 sm:p-10">
              <h2 className="text-2xl font-bold text-[#111112] tracking-tight mb-6">
                Ons verhaal
              </h2>
              <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                <p>
                  Als freelancer besteed je te veel tijd aan dingen die niets met
                  je vak te maken hebben. Offertes schrijven, facturen versturen,
                  klanten opvolgen, afspraken plannen — het vreet aan de tijd die
                  je wilt besteden aan het werk waar je goed in bent.
                </p>
                <p>
                  Quotr is gebouwd om dat te veranderen. We combineren de kracht
                  van AI met een simpel, doordacht platform dat speciaal is
                  ontworpen voor de Nederlandse markt. Geen ingewikkelde
                  boekhoudpakketten, geen generieke tools uit Silicon Valley.
                </p>
                <p>
                  Plak een e-mail van een potentiële klant, en Quotr maakt
                  binnen seconden een professionele offerte. Accepteert de klant?
                  Met één klik maak je er een factuur van met een Mollie-betaallink.
                  En aan het einde van het jaar exporteer je alles als CSV voor de
                  belastingdienst.
                </p>
                <p>
                  Dat is de belofte van Quotr: minder administratie, meer doen
                  waar je goed in bent.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <h2 className="text-3xl font-bold text-[#111112] tracking-tight mb-4">
              Onze missie
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Elke Nederlandse freelancer verdient professionele tools die
              eenvoudig, betaalbaar en slim zijn. Quotr maakt dat mogelijk.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-[#111112] tracking-tight text-center mb-12">
              Onze waarden
            </h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {values.map((value) => (
                <div
                  key={value.title}
                  className="bg-white rounded-xl border border-gray-200/80 p-6"
                >
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                    <value.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-base font-semibold text-[#111112] mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-[#111112] tracking-tight mb-4">
              Klaar om te beginnen?
            </h2>
            <p className="text-gray-600 mb-8">
              Probeer Quotr 14 dagen gratis en ontdek hoe makkelijk het kan zijn.
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
                <span className="text-lg font-semibold text-[#111112] tracking-tight">Quotr</span>
              </Link>
              <p className="text-xs text-gray-500">&copy; 2026 Quotr. Alle rechten voorbehouden.</p>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer navigatie">
              <Link href="/#features" className="text-sm text-gray-500 hover:text-[#111112] transition-colors">Features</Link>
              <Link href="/pricing" className="text-sm text-gray-500 hover:text-[#111112] transition-colors">Pricing</Link>
              <Link href="/about" className="text-sm text-gray-500 hover:text-[#111112] transition-colors">About</Link>
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-[#111112] transition-colors">Privacy</Link>
              <Link href="/terms" className="text-sm text-gray-500 hover:text-[#111112] transition-colors">Terms</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
