'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CompanyDetails {
  companyName: string;
  kvkNumber: string;
  btwNumber: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  iban: string;
}

interface ServiceEntry {
  name: string;
  price: string;
  type: 'fixed' | 'hourly';
}

// ---------------------------------------------------------------------------
// Shared UI helpers
// ---------------------------------------------------------------------------

const inputClass =
  'w-full rounded-[4px] border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent';

const primaryButtonClass =
  'w-full bg-[#111112] text-white text-sm font-medium py-2 px-4 rounded-[4px] hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

function ProgressIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              s === step
                ? 'bg-[#111112] text-white'
                : s < step
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-200 text-zinc-500'
            }`}
          >
            {s < step ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              s
            )}
          </div>
          {s < 3 && (
            <div
              className={`w-12 h-0.5 ${s < step ? 'bg-blue-600' : 'bg-zinc-200'}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Company Details
// ---------------------------------------------------------------------------

function StepCompanyDetails({
  data,
  onChange,
  onNext,
  loading,
  error,
}: {
  data: CompanyDetails;
  onChange: (d: CompanyDetails) => void;
  onNext: () => void;
  loading: boolean;
  error: string | null;
}) {
  function set<K extends keyof CompanyDetails>(key: K, value: CompanyDetails[K]) {
    onChange({ ...data, [key]: value });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
      className="space-y-4"
    >
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-[4px] px-3 py-2">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="companyName" className="block text-sm font-medium text-zinc-700 mb-1">
          Bedrijfsnaam
        </label>
        <input
          id="companyName"
          type="text"
          value={data.companyName}
          onChange={(e) => set('companyName', e.target.value)}
          required
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="kvkNumber" className="block text-sm font-medium text-zinc-700 mb-1">
            KVK-nummer
          </label>
          <input
            id="kvkNumber"
            type="text"
            value={data.kvkNumber}
            onChange={(e) => set('kvkNumber', e.target.value)}
            placeholder="12345678"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="btwNumber" className="block text-sm font-medium text-zinc-700 mb-1">
            BTW-nummer
          </label>
          <input
            id="btwNumber"
            type="text"
            value={data.btwNumber}
            onChange={(e) => set('btwNumber', e.target.value)}
            placeholder="NL123456789B01"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="addressLine1" className="block text-sm font-medium text-zinc-700 mb-1">
          Adres
        </label>
        <input
          id="addressLine1"
          type="text"
          value={data.addressLine1}
          onChange={(e) => set('addressLine1', e.target.value)}
          placeholder="Straatnaam 123"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium text-zinc-700 mb-1">
            Postcode
          </label>
          <input
            id="postalCode"
            type="text"
            value={data.postalCode}
            onChange={(e) => set('postalCode', e.target.value)}
            placeholder="1234 AB"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-zinc-700 mb-1">
            Plaats
          </label>
          <input
            id="city"
            type="text"
            value={data.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="Amsterdam"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="iban" className="block text-sm font-medium text-zinc-700 mb-1">
          IBAN
        </label>
        <input
          id="iban"
          type="text"
          value={data.iban}
          onChange={(e) => set('iban', e.target.value)}
          placeholder="NL00 BANK 0000 0000 00"
          className={inputClass}
        />
      </div>

      <button type="submit" disabled={loading} className={primaryButtonClass}>
        {loading ? 'Opslaan...' : 'Volgende'}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Add Services
// ---------------------------------------------------------------------------

const emptyService: ServiceEntry = { name: '', price: '', type: 'fixed' };

function StepServices({
  services,
  onChange,
  onNext,
  loading,
  error,
}: {
  services: ServiceEntry[];
  onChange: (s: ServiceEntry[]) => void;
  onNext: () => void;
  loading: boolean;
  error: string | null;
}) {
  function updateService(index: number, field: keyof ServiceEntry, value: string) {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  }

  function addService() {
    if (services.length < 3) {
      onChange([...services, { ...emptyService }]);
    }
  }

  function removeService(index: number) {
    onChange(services.filter((_, i) => i !== index));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
      className="space-y-4"
    >
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-[4px] px-3 py-2">
          {error}
        </div>
      )}

      <p className="text-sm text-zinc-500">
        Voeg je meest gebruikte diensten toe. Je kunt er later meer toevoegen.
      </p>

      {services.map((service, index) => (
        <div key={index} className="border border-zinc-200 rounded-[6px] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-700">Dienst {index + 1}</span>
            {services.length > 1 && (
              <button
                type="button"
                onClick={() => removeService(index)}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Verwijderen
              </button>
            )}
          </div>

          <div>
            <label
              htmlFor={`service-name-${index}`}
              className="block text-sm font-medium text-zinc-700 mb-1"
            >
              Naam
            </label>
            <input
              id={`service-name-${index}`}
              type="text"
              value={service.name}
              onChange={(e) => updateService(index, 'name', e.target.value)}
              required
              placeholder="Bijv. Webdesign"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor={`service-price-${index}`}
                className="block text-sm font-medium text-zinc-700 mb-1"
              >
                Prijs (&euro;)
              </label>
              <input
                id={`service-price-${index}`}
                type="number"
                step="0.01"
                min="0"
                value={service.price}
                onChange={(e) => updateService(index, 'price', e.target.value)}
                required
                placeholder="0.00"
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor={`service-type-${index}`}
                className="block text-sm font-medium text-zinc-700 mb-1"
              >
                Type
              </label>
              <select
                id={`service-type-${index}`}
                value={service.type}
                onChange={(e) => updateService(index, 'type', e.target.value)}
                className={inputClass}
              >
                <option value="fixed">Vast bedrag</option>
                <option value="hourly">Per uur</option>
              </select>
            </div>
          </div>
        </div>
      ))}

      {services.length < 3 && (
        <button
          type="button"
          onClick={addService}
          className="w-full border border-dashed border-zinc-300 rounded-[4px] py-2 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-600 transition-colors"
        >
          + Dienst toevoegen
        </button>
      )}

      <button type="submit" disabled={loading} className={primaryButtonClass}>
        {loading ? 'Opslaan...' : 'Volgende'}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Upload Logo
// ---------------------------------------------------------------------------

function StepLogo({
  onUpload,
  onSkip,
  loading,
  error,
}: {
  onUpload: (file: File) => void;
  onSkip: () => void;
  loading: boolean;
  error: string | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-[4px] px-3 py-2">
          {error}
        </div>
      )}

      <p className="text-sm text-zinc-500">
        Upload je bedrijfslogo. Dit wordt weergegeven op offertes en facturen.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-[6px] p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-blue-600 bg-blue-50'
            : preview
              ? 'border-zinc-300 bg-zinc-50'
              : 'border-zinc-300 hover:border-zinc-400'
        }`}
      >
        {preview ? (
          <div className="flex flex-col items-center gap-3">
            <img
              src={preview}
              alt="Logo preview"
              className="max-h-24 max-w-48 object-contain"
            />
            <span className="text-sm text-zinc-500">Klik om een ander bestand te kiezen</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <svg
              className="w-10 h-10 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <span className="text-sm font-medium text-zinc-700">
              Sleep je logo hierheen of klik om te uploaden
            </span>
            <span className="text-xs text-zinc-400">PNG, JPG of SVG (max. 2MB)</span>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      <button
        type="button"
        disabled={loading || !selectedFile}
        onClick={() => selectedFile && onUpload(selectedFile)}
        className={primaryButtonClass}
      >
        {loading ? 'Uploaden...' : 'Start met Quotr'}
      </button>

      <button
        type="button"
        onClick={onSkip}
        disabled={loading}
        className="w-full text-sm text-zinc-500 hover:text-zinc-700 py-2 transition-colors"
      >
        Overslaan
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Onboarding Wizard
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 state
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails>({
    companyName: '',
    kvkNumber: '',
    btwNumber: '',
    addressLine1: '',
    city: '',
    postalCode: '',
    iban: '',
  });

  // Step 2 state
  const [services, setServices] = useState<ServiceEntry[]>([{ ...emptyService }]);

  // Pre-fill company name on mount
  const [loaded, setLoaded] = useState(false);
  if (!loaded) {
    // Fetch company name once
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();
      if (!data?.company_id) return;
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', data.company_id)
        .single();
      if (company?.name) {
        setCompanyDetails((prev) => ({ ...prev, companyName: company.name }));
      }
    });
    setLoaded(true);
  }

  // Step 1 handler
  const handleStepOne = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyDetails),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Er is iets misgegaan.');
        return;
      }
      setStep(2);
    } catch {
      setError('Er is iets misgegaan. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  }, [companyDetails]);

  // Step 2 handler
  const handleStepTwo = useCallback(async () => {
    setError(null);

    // Filter out empty services
    const validServices = services.filter((s) => s.name.trim() && s.price);
    if (validServices.length === 0) {
      setError('Voeg minimaal 1 dienst toe.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/onboarding/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services: validServices }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Er is iets misgegaan.');
        return;
      }
      setStep(3);
    } catch {
      setError('Er is iets misgegaan. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  }, [services]);

  // Step 3 handlers
  const handleLogoUpload = useCallback(async (file: File) => {
    setError(null);

    if (file.size > 2 * 1024 * 1024) {
      setError('Bestand is te groot. Maximaal 2MB.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const res = await fetch('/api/onboarding/logo', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Er is iets misgegaan.');
        return;
      }
      router.push('/app');
      router.refresh();
    } catch {
      setError('Er is iets misgegaan. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleSkipLogo = useCallback(() => {
    router.push('/app');
    router.refresh();
  }, [router]);

  const stepTitles: Record<number, { title: string; description: string }> = {
    1: { title: 'Bedrijfsgegevens', description: 'Vul je bedrijfsgegevens aan' },
    2: { title: 'Diensten toevoegen', description: 'Voeg je belangrijkste diensten toe' },
    3: { title: 'Logo uploaden', description: 'Voeg je bedrijfslogo toe' },
  };

  return (
    <div className="min-h-screen bg-[#f5f5f6] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <ProgressIndicator step={step} />

        <div className="bg-white border border-zinc-200 shadow-sm rounded-[6px] p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
              {stepTitles[step].title}
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              {stepTitles[step].description}
            </p>
          </div>

          {step === 1 && (
            <StepCompanyDetails
              data={companyDetails}
              onChange={setCompanyDetails}
              onNext={handleStepOne}
              loading={loading}
              error={error}
            />
          )}

          {step === 2 && (
            <StepServices
              services={services}
              onChange={setServices}
              onNext={handleStepTwo}
              loading={loading}
              error={error}
            />
          )}

          {step === 3 && (
            <StepLogo
              onUpload={handleLogoUpload}
              onSkip={handleSkipLogo}
              loading={loading}
              error={error}
            />
          )}
        </div>

        <p className="text-center text-xs text-zinc-400 mt-4">
          Stap {step} van 3
        </p>
      </div>
    </div>
  );
}
