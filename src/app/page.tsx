import Link from "next/link";
import {
  Sparkles,
  FileText,
  CalendarDays,
  Users,
  Download,
  Smartphone,
  Check,
  ChevronDown,
  Menu,
  X,
  Star,
  ArrowRight,
} from "lucide-react";

function Navbar() {
  return (
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
            <a
              href="#features"
              className="text-sm text-gray-600 hover:text-[#111112] transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-sm text-gray-600 hover:text-[#111112] transition-colors"
            >
              Pricing
            </a>
            <Link
              href="/about"
              className="text-sm text-gray-600 hover:text-[#111112] transition-colors"
            >
              About
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
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

          {/* Mobile menu toggle — handled via CSS checkbox hack for server component */}
          <label
            htmlFor="mobile-menu-toggle"
            className="md:hidden p-2 text-gray-600 hover:text-[#111112] cursor-pointer"
            aria-label="Menu openen"
          >
            <Menu className="w-5 h-5" />
          </label>
        </div>
      </div>

      {/* Mobile menu */}
      <input
        type="checkbox"
        id="mobile-menu-toggle"
        className="peer hidden"
        aria-hidden="true"
      />
      <div className="hidden peer-checked:block md:hidden bg-white border-t border-gray-200">
        <div className="px-4 py-4 space-y-3">
          <a
            href="#features"
            className="block text-sm text-gray-600 hover:text-[#111112] py-2"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="block text-sm text-gray-600 hover:text-[#111112] py-2"
          >
            Pricing
          </a>
          <Link
            href="/about"
            className="block text-sm text-gray-600 hover:text-[#111112] py-2"
          >
            About
          </Link>
          <hr className="border-gray-200" />
          <Link
            href="/auth/login"
            className="block text-sm font-medium text-[#111112] py-2"
          >
            Inloggen
          </Link>
          <Link
            href="/auth/register"
            className="block text-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg py-2.5 transition-colors"
          >
            Gratis proberen
          </Link>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="pt-32 pb-20 sm:pt-40 sm:pb-28 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              AI-gestuurd platform voor ZZP&apos;ers
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-[#111112] tracking-tight leading-[1.1] mb-6">
              Je freelance
              <br />
              assistent
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-md">
              Quotr helpt Nederlandse ZZP&apos;ers met AI-gestuurde offertes,
              facturen en planning. Alles in één platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Start gratis proefperiode
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-[#111112] bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
              >
                Bekijk hoe het werkt
              </a>
            </div>
          </div>

          {/* Hero visual — stylized app mockup */}
          <div className="relative" aria-hidden="true">
            <div className="relative bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-blue-600/20">
              {/* Floating card: Quote */}
              <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#111112]">
                        Offerte #2024-031
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Website redesign
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                    Geaccepteerd
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 border-t border-gray-100 pt-2">
                  <span>Studio de Vries</span>
                  <span className="font-semibold text-[#111112]">
                    &euro;4.250,00
                  </span>
                </div>
              </div>

              {/* Floating card: AI suggestion */}
              <div className="bg-white/95 backdrop-blur rounded-xl p-4 mb-4 shadow-sm border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-[#111112]">
                    AI Suggestie
                  </span>
                </div>
                <div className="text-[11px] text-gray-600 leading-relaxed">
                  &ldquo;Op basis van de aanvraag stel ik een offerte voor met 3
                  fases: ontwerp, ontwikkeling en oplevering.&rdquo;
                </div>
              </div>

              {/* Floating card: Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/95 backdrop-blur rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-[#111112]">12</div>
                  <div className="text-[10px] text-gray-500">Offertes</div>
                </div>
                <div className="bg-white/95 backdrop-blur rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-[#111112]">
                    &euro;8.4k
                  </div>
                  <div className="text-[10px] text-gray-500">Omzet</div>
                </div>
                <div className="bg-white/95 backdrop-blur rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-green-600">94%</div>
                  <div className="text-[10px] text-gray-500">Conversie</div>
                </div>
              </div>
            </div>

            {/* Decorative gradient blur */}
            <div className="absolute -z-10 top-8 -left-4 -right-4 bottom-0 bg-blue-200/40 rounded-2xl blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialProofBar() {
  return (
    <section className="pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200/80 px-8 py-6">
          <p className="text-center text-sm text-gray-500 mb-6">
            Vertrouwd door{" "}
            <span className="font-semibold text-[#111112]">
              500+ Nederlandse freelancers
            </span>
          </p>
          <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap opacity-40 grayscale">
            {["Studio Nova", "Pixel & Co", "De Digitale", "Creatief Bureau", "WebWorks"].map(
              (name) => (
                <div
                  key={name}
                  className="text-sm font-semibold text-gray-800 tracking-tight"
                >
                  {name}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: Sparkles,
    title: "AI Offerte Builder",
    description:
      "Plak een email, krijg een professionele offerte. Quotr AI analyseert aanvragen en maakt direct een offerte.",
  },
  {
    icon: FileText,
    title: "Facturen & Betalingen",
    description:
      "Eén klik van offerte naar factuur. Met Mollie-betaallinks en automatische herinneringen.",
  },
  {
    icon: CalendarDays,
    title: "Agenda & Boekingen",
    description:
      "Plan afspraken, deel je boekingspagina, en houd alles bij in één overzicht.",
  },
  {
    icon: Users,
    title: "Klantenbeheer",
    description:
      "Al je klanten, offertes en facturen op één plek. Volledig inzicht per klant.",
  },
  {
    icon: Download,
    title: "Belastingexport",
    description:
      "Exporteer je facturen als CSV voor de belastingdienst. Beveiligd met een PIN.",
  },
  {
    icon: Smartphone,
    title: "Werkt op elk apparaat",
    description:
      "PWA — installeer Quotr op je telefoon en werk onderweg.",
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#111112] tracking-tight mb-4">
            Alles wat je nodig hebt
          </h2>
          <p className="text-gray-600 max-w-lg mx-auto">
            Van offerte tot factuur, van planning tot belastingaangifte. Quotr
            brengt alles samen.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-xl border border-gray-200/80 p-6 hover:border-gray-300 hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                <feature.icon className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-base font-semibold text-[#111112] mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    num: "1",
    title: "Plak een aanvraag of beschrijf het project",
    description:
      "Kopieer een e-mail van je klant of beschrijf het project in je eigen woorden.",
  },
  {
    num: "2",
    title: "Quotr AI maakt een professionele offerte",
    description:
      "Onze AI analyseert de aanvraag en genereert een gestructureerde, professionele offerte.",
  },
  {
    num: "3",
    title: "Verstuur, volg op, en factureer — alles in één",
    description:
      "Verstuur de offerte, volg de status, en maak met één klik een factuur aan.",
  },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#111112] tracking-tight mb-4">
            Hoe het werkt
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            In drie stappen van klantvraag naar betaling.
          </p>
        </div>

        <div className="space-y-8 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-8">
          {steps.map((step) => (
            <div key={step.num} className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                {step.num}
              </div>
              <h3 className="text-base font-semibold text-[#111112] mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const testimonials = [
  {
    name: "Lisa van den Berg",
    role: "Fotograaf",
    content:
      "Sinds ik Quotr gebruik, besteed ik de helft minder tijd aan administratie. De AI-offertes zijn verrassend goed — mijn klanten merken geen verschil.",
    rating: 5,
  },
  {
    name: "Daan Bakker",
    role: "Grafisch Ontwerper",
    content:
      "Eindelijk een tool die begrijpt hoe Nederlandse freelancers werken. De Mollie-integratie is geweldig, klanten betalen nu veel sneller.",
    rating: 5,
  },
  {
    name: "Sophie de Groot",
    role: "Web Developer",
    content:
      "Ik was sceptisch over AI-offertes, maar Quotr verraste me. Het bespaart me uren per week en de offertes zien er professioneler uit dan ooit.",
    rating: 5,
  },
];

function TestimonialsSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#111112] tracking-tight mb-4">
            Wat freelancers zeggen
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Ontdek waarom honderden ZZP&apos;ers Quotr vertrouwen.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-xl border border-gray-200/80 p-6"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-5">
                &ldquo;{t.content}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600">
                  {t.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <div className="text-sm font-medium text-[#111112]">
                    {t.name}
                  </div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const planFeatures = [
  "Onbeperkt offertes en facturen",
  "AI Offerte Builder",
  "Mollie-betaallinks",
  "Automatische herinneringen",
  "Klantenbeheer",
  "Agenda & boekingspagina",
  "CSV-export voor belasting",
  "PWA — werkt op elk apparaat",
  "Prioriteit support",
];

function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-4 bg-white">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-[#111112] tracking-tight mb-4">
          Eenvoudige, eerlijke prijs
        </h2>
        <p className="text-gray-600 mb-10">
          Eén plan, alles inbegrepen. Geen verborgen kosten.
        </p>

        <div className="bg-[#f5f5f6] rounded-2xl border border-gray-200/80 p-8 text-left">
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-sm font-medium text-blue-600 uppercase tracking-wide">
              Pro
            </span>
          </div>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl font-bold text-[#111112]">
              &euro;20
            </span>
            <span className="text-gray-500 text-sm">/maand</span>
          </div>

          <ul className="space-y-3 mb-8" role="list">
            {planFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/auth/register"
            className="block w-full text-center px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Start gratis proefperiode
          </Link>
          <p className="text-xs text-gray-500 text-center mt-3">
            14 dagen gratis proberen — geen creditcard nodig
          </p>
        </div>
      </div>
    </section>
  );
}

const faqItems = [
  {
    q: "Wat is Quotr precies?",
    a: "Quotr is een alles-in-één platform voor Nederlandse freelancers en ZZP'ers. Het helpt je met het maken van offertes, facturen, planning en klantenbeheer — met behulp van AI.",
  },
  {
    q: "Hoe werkt de AI Offerte Builder?",
    a: "Plak een e-mail of beschrijf een project, en onze AI analyseert de aanvraag en genereert automatisch een professionele offerte met de juiste structuur, toon en prijsopbouw.",
  },
  {
    q: "Kan ik Quotr gratis uitproberen?",
    a: "Ja! Je krijgt 14 dagen gratis toegang tot alle functies. Er is geen creditcard nodig om te starten.",
  },
  {
    q: "Werkt Quotr met de Belastingdienst?",
    a: "Quotr biedt CSV-exports van al je facturen, zodat je ze eenvoudig kunt gebruiken voor je belastingaangifte of kunt delen met je boekhouder.",
  },
  {
    q: "Hoe werken de betalingen via Mollie?",
    a: "Quotr integreert met Mollie zodat je betaallinks aan je facturen kunt toevoegen. Je klanten kunnen direct online betalen via iDEAL, creditcard of andere methodes.",
  },
  {
    q: "Kan ik Quotr op mijn telefoon gebruiken?",
    a: "Ja, Quotr is een Progressive Web App (PWA). Je kunt het installeren op je telefoon en gebruiken alsof het een native app is — ook offline.",
  },
];

function FAQSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#111112] tracking-tight mb-4">
            Veelgestelde vragen
          </h2>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, i) => (
            <details
              key={i}
              className="group bg-white rounded-xl border border-gray-200/80 overflow-hidden"
            >
              <summary className="flex items-center justify-between px-6 py-4 cursor-pointer text-sm font-medium text-[#111112] hover:bg-gray-50 transition-colors list-none [&::-webkit-details-marker]:hidden">
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
  );
}

function Footer() {
  return (
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
            <a
              href="#features"
              className="text-sm text-gray-500 hover:text-[#111112] transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-sm text-gray-500 hover:text-[#111112] transition-colors"
            >
              Pricing
            </a>
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
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f5f5f6]">
      <Navbar />
      <main>
        <HeroSection />
        <SocialProofBar />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}
