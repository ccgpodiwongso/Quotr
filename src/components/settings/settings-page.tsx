'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Building2, Receipt, FileText, Calendar, Bell, Shield, Globe, CreditCard, Upload, X, Download, Save, Loader2 } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SettingsPageClientProps {
  company: any
  profile: any
  availabilitySlots: any[]
}

type TabKey = 'company' | 'invoicing' | 'quotes' | 'booking' | 'notifications' | 'tax' | 'language' | 'billing'

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'company', label: 'Bedrijf', icon: Building2 },
  { key: 'invoicing', label: 'Facturering', icon: Receipt },
  { key: 'quotes', label: 'Offertes', icon: FileText },
  { key: 'booking', label: 'Boekingen', icon: Calendar },
  { key: 'notifications', label: 'Meldingen', icon: Bell },
  { key: 'tax', label: 'Belasting', icon: Shield },
  { key: 'language', label: 'Taal', icon: Globe },
  { key: 'billing', label: 'Abonnement', icon: CreditCard },
]

const DAY_LABELS = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']

// ---------------------------------------------------------------------------
// Shared UI helpers
// ---------------------------------------------------------------------------

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return <label htmlFor={htmlFor} className="block text-sm font-medium text-zinc-700 mb-1">{children}</label>
}

function TextInput({ id, value, onChange, type = 'text', placeholder, disabled }: {
  id?: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; disabled?: boolean
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="border border-zinc-300 rounded px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-50"
    />
  )
}

function TextArea({ id, value, onChange, rows = 3, placeholder }: {
  id?: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="border border-zinc-300 rounded px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-vertical"
    />
  )
}

function SelectInput({ id, value, onChange, options }: {
  id?: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="border border-zinc-300 rounded px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function PrimaryButton({ children, onClick, loading, disabled, className = '' }: {
  children: React.ReactNode; onClick?: () => void; loading?: boolean; disabled?: boolean; className?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`bg-[#111112] text-white px-4 py-2 rounded-md text-sm hover:bg-zinc-800 disabled:opacity-50 flex items-center gap-2 ${className}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
      {children}
    </button>
  )
}

function SecondaryButton({ children, onClick, className = '' }: {
  children: React.ReactNode; onClick?: () => void; className?: string
}) {
  return (
    <button onClick={onClick} className={`border border-zinc-300 text-zinc-700 px-4 py-2 rounded-md text-sm hover:bg-zinc-50 ${className}`}>
      {children}
    </button>
  )
}

function DangerButton({ children, onClick, loading }: {
  children: React.ReactNode; onClick?: () => void; loading?: boolean
}) {
  return (
    <button onClick={onClick} disabled={loading} className="border border-red-300 text-red-600 px-4 py-2 rounded-md text-sm hover:bg-red-50 disabled:opacity-50 flex items-center gap-2">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
      {children}
    </button>
  )
}

function Card({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-md p-6 shadow-sm">
      {title && <h3 className="text-base font-semibold text-zinc-900 mb-4">{title}</h3>}
      {children}
    </div>
  )
}

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-md shadow-lg text-sm font-medium ${type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
      {message}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function SettingsPageClient({ company, profile, availabilitySlots }: SettingsPageClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>('company')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Instellingen</h1>

      {/* Tab Navigation */}
      <div className="flex border-b border-zinc-200 mb-6 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors ${
                isActive ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-zinc-500 hover:text-zinc-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'company' && <CompanyTab company={company} showToast={showToast} />}
      {activeTab === 'invoicing' && <InvoicingTab company={company} showToast={showToast} />}
      {activeTab === 'quotes' && <QuotesTab company={company} showToast={showToast} />}
      {activeTab === 'booking' && <BookingTab company={company} slots={availabilitySlots} showToast={showToast} />}
      {activeTab === 'notifications' && <NotificationsTab company={company} showToast={showToast} />}
      {activeTab === 'tax' && <TaxTab company={company} showToast={showToast} />}
      {activeTab === 'language' && <LanguageTab company={company} profile={profile} showToast={showToast} />}
      {activeTab === 'billing' && <BillingTab company={company} showToast={showToast} />}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Company Tab
// ---------------------------------------------------------------------------

function CompanyTab({ company, showToast }: { company: any; showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(company?.name || '')
  const [kvk, setKvk] = useState(company?.kvk_number || '')
  const [btw, setBtw] = useState(company?.btw_number || '')
  const [address, setAddress] = useState(company?.address || '')
  const [city, setCity] = useState(company?.city || '')
  const [postcode, setPostcode] = useState(company?.postcode || '')
  const [iban, setIban] = useState(company?.iban || '')
  const [email, setEmail] = useState(company?.email || '')
  const [phone, setPhone] = useState(company?.phone || '')
  const [website, setWebsite] = useState(company?.website || '')
  const [logoUrl, setLogoUrl] = useState(company?.logo_url || '')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, kvk_number: kvk, btw_number: btw, address, city, postcode, iban, email, phone, website }),
      })
      if (!res.ok) throw new Error()
      showToast('Bedrijfsgegevens opgeslagen')
    } catch {
      showToast('Opslaan mislukt', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/settings/logo', { method: 'POST', body: formData })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLogoUrl(data.logo_url || data.url || '')
      showToast('Logo geüpload')
    } catch {
      showToast('Upload mislukt', 'error')
    } finally {
      setUploading(false)
    }
  }

  async function handleLogoRemove() {
    try {
      await fetch('/api/settings/logo', { method: 'DELETE' })
      setLogoUrl('')
      showToast('Logo verwijderd')
    } catch {
      showToast('Verwijderen mislukt', 'error')
    }
  }

  return (
    <Card title="Bedrijfsgegevens">
      <div className="space-y-4">
        {/* Logo */}
        <div>
          <Label>Logo</Label>
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <div className="relative">
                <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain rounded border border-zinc-200" />
                <button onClick={handleLogoRemove} className="absolute -top-2 -right-2 bg-white border border-zinc-300 rounded-full p-0.5 hover:bg-zinc-100">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 rounded border-2 border-dashed border-zinc-300 flex items-center justify-center text-zinc-400">
                <Upload className="w-5 h-5" />
              </div>
            )}
            <div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {uploading ? 'Uploaden...' : 'Upload logo'}
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={handleLogoUpload} className="hidden" />
              <p className="text-xs text-zinc-400 mt-0.5">PNG, JPG of SVG, max 2MB</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label htmlFor="name">Bedrijfsnaam</Label><TextInput id="name" value={name} onChange={setName} /></div>
          <div><Label htmlFor="kvk">KVK-nummer</Label><TextInput id="kvk" value={kvk} onChange={setKvk} /></div>
          <div><Label htmlFor="btw">BTW-nummer</Label><TextInput id="btw" value={btw} onChange={setBtw} /></div>
          <div><Label htmlFor="iban">IBAN</Label><TextInput id="iban" value={iban} onChange={setIban} /></div>
          <div className="sm:col-span-2"><Label htmlFor="address">Adres</Label><TextInput id="address" value={address} onChange={setAddress} /></div>
          <div><Label htmlFor="postcode">Postcode</Label><TextInput id="postcode" value={postcode} onChange={setPostcode} /></div>
          <div><Label htmlFor="city">Plaats</Label><TextInput id="city" value={city} onChange={setCity} /></div>
          <div><Label htmlFor="email">E-mail</Label><TextInput id="email" value={email} onChange={setEmail} type="email" /></div>
          <div><Label htmlFor="phone">Telefoon</Label><TextInput id="phone" value={phone} onChange={setPhone} type="tel" /></div>
          <div className="sm:col-span-2"><Label htmlFor="website">Website</Label><TextInput id="website" value={website} onChange={setWebsite} /></div>
        </div>

        <div className="pt-2">
          <PrimaryButton onClick={handleSave} loading={saving}><Save className="w-4 h-4" /> Opslaan</PrimaryButton>
        </div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Invoicing Tab
// ---------------------------------------------------------------------------

function InvoicingTab({ company, showToast }: { company: any; showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [saving, setSaving] = useState(false)
  const [paymentTerms, setPaymentTerms] = useState(company?.invoice_payment_terms || 'Betaling binnen 14 dagen')
  const [dueDays, setDueDays] = useState(String(company?.invoice_due_days ?? 14))
  const [footer, setFooter] = useState(company?.invoice_footer || '')
  const [nextNumber, setNextNumber] = useState(String(company?.invoice_next_number ?? 1))

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: company?.name,
          invoice_payment_terms: paymentTerms,
          invoice_due_days: parseInt(dueDays) || 14,
          invoice_footer: footer,
          invoice_next_number: parseInt(nextNumber) || 1,
        }),
      })
      if (!res.ok) throw new Error()
      showToast('Factuurinstellingen opgeslagen')
    } catch {
      showToast('Opslaan mislukt', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card title="Factuurinstellingen">
      <div className="space-y-4">
        <div><Label htmlFor="terms">Standaard betalingsvoorwaarden</Label><TextArea id="terms" value={paymentTerms} onChange={setPaymentTerms} rows={2} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label htmlFor="dueDays">Betaaltermijn (dagen)</Label><TextInput id="dueDays" value={dueDays} onChange={setDueDays} type="number" /></div>
          <div>
            <Label htmlFor="nextInv">Volgend factuurnummer</Label>
            <TextInput id="nextInv" value={nextNumber} onChange={setNextNumber} type="number" />
            <p className="text-xs text-amber-600 mt-1">Wijzig alleen als je weet wat je doet</p>
          </div>
        </div>
        <div><Label htmlFor="footer">Factuur voettekst</Label><TextArea id="footer" value={footer} onChange={setFooter} rows={3} placeholder="Extra tekst onder aan je factuur..." /></div>
        <div className="pt-2"><PrimaryButton onClick={handleSave} loading={saving}><Save className="w-4 h-4" /> Opslaan</PrimaryButton></div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Quotes Tab
// ---------------------------------------------------------------------------

function QuotesTab({ company, showToast }: { company: any; showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [saving, setSaving] = useState(false)
  const [validDays, setValidDays] = useState(String(company?.quote_valid_days ?? 30))
  const [nextNumber, setNextNumber] = useState(String(company?.quote_next_number ?? 1))

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: company?.name,
          quote_valid_days: parseInt(validDays) || 30,
          quote_next_number: parseInt(nextNumber) || 1,
        }),
      })
      if (!res.ok) throw new Error()
      showToast('Offerte-instellingen opgeslagen')
    } catch {
      showToast('Opslaan mislukt', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card title="Offerte-instellingen">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label htmlFor="validDays">Standaard geldigheid (dagen)</Label><TextInput id="validDays" value={validDays} onChange={setValidDays} type="number" /></div>
          <div>
            <Label htmlFor="nextQuote">Volgend offertenummer</Label>
            <TextInput id="nextQuote" value={nextNumber} onChange={setNextNumber} type="number" />
            <p className="text-xs text-amber-600 mt-1">Wijzig alleen als je weet wat je doet</p>
          </div>
        </div>
        <div className="pt-2"><PrimaryButton onClick={handleSave} loading={saving}><Save className="w-4 h-4" /> Opslaan</PrimaryButton></div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Booking Tab
// ---------------------------------------------------------------------------

function BookingTab({ company, slots, showToast }: { company: any; slots: any[]; showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [saving, setSaving] = useState(false)
  const [slug, setSlug] = useState(company?.slug || '')
  const [availability, setAvailability] = useState<{ day_of_week: number; start_time: string; end_time: string; is_active: boolean }[]>(() => {
    // Initialize from existing slots, filling in defaults for missing days
    const existing = new Map<number, any>()
    slots.forEach(s => existing.set(s.day_of_week, s))
    return [1, 2, 3, 4, 5, 6, 0].map(day => ({
      day_of_week: day,
      start_time: existing.get(day)?.start_time || '09:00',
      end_time: existing.get(day)?.end_time || '17:00',
      is_active: existing.get(day)?.is_active ?? (day >= 1 && day <= 5),
    }))
  })

  function updateSlot(day: number, field: string, value: any) {
    setAvailability(prev => prev.map(s => s.day_of_week === day ? { ...s, [field]: value } : s))
  }

  async function handleSave() {
    setSaving(true)
    try {
      // Save slug
      if (slug !== company?.slug) {
        await fetch('/api/settings/company', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: company?.name, slug }),
        })
      }
      // Save availability
      await fetch('/api/settings/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: availability }),
      })
      showToast('Boekingsinstellingen opgeslagen')
    } catch {
      showToast('Opslaan mislukt', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card title="Boekingspagina">
      <div className="space-y-6">
        <div>
          <Label htmlFor="slug">Boekingspagina URL</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">getquotr.nl/book/</span>
            <TextInput id="slug" value={slug} onChange={setSlug} placeholder="jouw-bedrijf" />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-zinc-700 mb-3">Beschikbaarheid per dag</h4>
          <div className="space-y-2">
            {availability.map(slot => (
              <div key={slot.day_of_week} className="flex items-center gap-3 py-2">
                <label className="flex items-center gap-2 w-28">
                  <input
                    type="checkbox"
                    checked={slot.is_active}
                    onChange={e => updateSlot(slot.day_of_week, 'is_active', e.target.checked)}
                    className="rounded border-zinc-300"
                  />
                  <span className="text-sm text-zinc-700">{DAY_LABELS[slot.day_of_week]}</span>
                </label>
                <input
                  type="time"
                  value={slot.start_time}
                  onChange={e => updateSlot(slot.day_of_week, 'start_time', e.target.value)}
                  disabled={!slot.is_active}
                  className="border border-zinc-300 rounded px-2 py-1 text-sm disabled:opacity-40"
                />
                <span className="text-zinc-400 text-sm">tot</span>
                <input
                  type="time"
                  value={slot.end_time}
                  onChange={e => updateSlot(slot.day_of_week, 'end_time', e.target.value)}
                  disabled={!slot.is_active}
                  className="border border-zinc-300 rounded px-2 py-1 text-sm disabled:opacity-40"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2"><PrimaryButton onClick={handleSave} loading={saving}><Save className="w-4 h-4" /> Opslaan</PrimaryButton></div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Notifications Tab
// ---------------------------------------------------------------------------

function NotificationsTab({ company, showToast }: { company: any; showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [saving, setSaving] = useState(false)
  const settings = company?.settings || {}
  const [followups, setFollowups] = useState(settings.notify_followups !== false)
  const [overdue, setOverdue] = useState(settings.notify_overdue !== false)
  const [bookings, setBookings] = useState(settings.notify_bookings !== false)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: company?.name,
          settings: { ...settings, notify_followups: followups, notify_overdue: overdue, notify_bookings: bookings },
        }),
      })
      if (!res.ok) throw new Error()
      showToast('Meldingen opgeslagen')
    } catch {
      showToast('Opslaan mislukt', 'error')
    } finally {
      setSaving(false)
    }
  }

  function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
      <label className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0">
        <span className="text-sm text-zinc-700">{label}</span>
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-zinc-300'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </label>
    )
  }

  return (
    <Card title="E-mailmeldingen">
      <div className="space-y-1">
        <Toggle checked={followups} onChange={setFollowups} label="Follow-up herinneringen" />
        <Toggle checked={overdue} onChange={setOverdue} label="Verlopen factuur meldingen" />
        <Toggle checked={bookings} onChange={setBookings} label="Nieuwe boeking meldingen" />
      </div>
      <div className="pt-4"><PrimaryButton onClick={handleSave} loading={saving}><Save className="w-4 h-4" /> Opslaan</PrimaryButton></div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Tax Export Tab
// ---------------------------------------------------------------------------

function TaxTab({ company, showToast }: { company: any; showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [settingPin, setSettingPin] = useState(false)
  const [exportPin, setExportPin] = useState('')
  const [exporting, setExporting] = useState(false)
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(String(currentYear))
  const hasPin = !!(company?.tax_export_pin || company?.settings?.tax_pin_hash)

  async function handleSetPin() {
    if (pin.length !== 6 || !/^\d+$/.test(pin)) {
      showToast('PIN moet exact 6 cijfers zijn', 'error')
      return
    }
    if (pin !== confirmPin) {
      showToast('PINs komen niet overeen', 'error')
      return
    }
    setSettingPin(true)
    try {
      const res = await fetch('/api/settings/tax-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      if (!res.ok) throw new Error()
      setPin('')
      setConfirmPin('')
      showToast('PIN ingesteld')
    } catch {
      showToast('PIN instellen mislukt', 'error')
    } finally {
      setSettingPin(false)
    }
  }

  async function handleExport() {
    if (exportPin.length !== 6) {
      showToast('Voer je 6-cijferige PIN in', 'error')
      return
    }
    setExporting(true)
    try {
      const res = await fetch(`/api/settings/tax-export?year=${year}`, {
        headers: { 'X-Tax-Pin': exportPin },
      })
      if (res.status === 401) {
        showToast('Onjuiste PIN', 'error')
        return
      }
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `quotr-facturen-${year}.csv`
      a.click()
      URL.revokeObjectURL(url)
      setExportPin('')
      showToast('Export gedownload')
    } catch {
      showToast('Export mislukt', 'error')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card title="PIN instellen">
        <p className="text-sm text-zinc-500 mb-4">Stel een 6-cijferige PIN in om je belastingexport te beveiligen.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label htmlFor="pin">Nieuwe PIN (6 cijfers)</Label><TextInput id="pin" value={pin} onChange={setPin} type="password" placeholder="••••••" /></div>
          <div><Label htmlFor="confirmPin">Bevestig PIN</Label><TextInput id="confirmPin" value={confirmPin} onChange={setConfirmPin} type="password" placeholder="••••••" /></div>
        </div>
        <div className="pt-4"><PrimaryButton onClick={handleSetPin} loading={settingPin}>{hasPin ? 'PIN wijzigen' : 'PIN instellen'}</PrimaryButton></div>
      </Card>

      <Card title="Factuurexport voor belastingaangifte">
        <p className="text-sm text-zinc-500 mb-4">Exporteer al je facturen als CSV voor de belastingdienst. Je PIN is vereist.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="year">Jaar</Label>
            <SelectInput id="year" value={year} onChange={setYear} options={
              Array.from({ length: 5 }, (_, i) => ({ value: String(currentYear - i), label: String(currentYear - i) }))
            } />
          </div>
          <div><Label htmlFor="exportPin">PIN</Label><TextInput id="exportPin" value={exportPin} onChange={setExportPin} type="password" placeholder="••••••" /></div>
          <div className="flex items-end">
            <PrimaryButton onClick={handleExport} loading={exporting} disabled={!hasPin}>
              <Download className="w-4 h-4" /> Exporteer CSV
            </PrimaryButton>
          </div>
        </div>
        {!hasPin && <p className="text-xs text-amber-600 mt-2">Stel eerst een PIN in voordat je kunt exporteren.</p>}
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Language Tab
// ---------------------------------------------------------------------------

function LanguageTab({ company, profile, showToast }: { company: any; profile: any; showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [saving, setSaving] = useState(false)
  const [locale, setLocale] = useState(company?.locale || profile?.locale || 'nl')
  const router = useRouter()

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/language', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      })
      if (!res.ok) throw new Error()
      showToast('Taal opgeslagen')
      router.refresh()
    } catch {
      showToast('Opslaan mislukt', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card title="Taalvoorkeur">
      <p className="text-sm text-zinc-500 mb-4">Kies de taal voor je Quotr account.</p>
      <div className="space-y-3">
        <label className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer ${locale === 'nl' ? 'border-blue-600 bg-blue-50' : 'border-zinc-200'}`}>
          <input type="radio" name="locale" value="nl" checked={locale === 'nl'} onChange={() => setLocale('nl')} className="accent-blue-600" />
          <div>
            <span className="text-sm font-medium text-zinc-900">Nederlands</span>
            <p className="text-xs text-zinc-500">Standaard taal</p>
          </div>
        </label>
        <label className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer ${locale === 'en' ? 'border-blue-600 bg-blue-50' : 'border-zinc-200'}`}>
          <input type="radio" name="locale" value="en" checked={locale === 'en'} onChange={() => setLocale('en')} className="accent-blue-600" />
          <div>
            <span className="text-sm font-medium text-zinc-900">English</span>
            <p className="text-xs text-zinc-500">Switch to English</p>
          </div>
        </label>
      </div>
      <div className="pt-4"><PrimaryButton onClick={handleSave} loading={saving}><Save className="w-4 h-4" /> Opslaan</PrimaryButton></div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Billing Tab
// ---------------------------------------------------------------------------

function BillingTab({ company, showToast }: { company: any; showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [upgrading, setUpgrading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const router = useRouter()

  const plan = company?.plan || 'trial'
  const trialEndsAt = company?.trial_ends_at ? new Date(company.trial_ends_at) : null
  const now = new Date()
  const trialDaysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0
  const trialExpired = plan === 'trial' && trialDaysLeft <= 0

  async function handleUpgrade() {
    setUpgrading(true)
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        throw new Error()
      }
    } catch {
      showToast('Upgrade starten mislukt', 'error')
      setUpgrading(false)
    }
  }

  async function handleCancel() {
    if (!confirm('Weet je zeker dat je je abonnement wilt opzeggen?')) return
    setCancelling(true)
    try {
      const res = await fetch('/api/billing/cancel', { method: 'POST' })
      if (!res.ok) throw new Error()
      showToast('Abonnement opgezegd')
      router.refresh()
    } catch {
      showToast('Opzeggen mislukt', 'error')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <Card title="Abonnement">
      <div className="space-y-6">
        {/* Current plan */}
        <div className="flex items-center gap-3">
          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
            plan === 'pro' ? 'bg-green-50 text-green-700 border border-green-200' :
            plan === 'cancelled' ? 'bg-red-50 text-red-700 border border-red-200' :
            'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {plan === 'pro' ? 'Pro' : plan === 'cancelled' ? 'Opgezegd' : 'Proefperiode'}
          </span>
          {plan === 'trial' && !trialExpired && (
            <span className="text-sm text-zinc-500">Nog {trialDaysLeft} {trialDaysLeft === 1 ? 'dag' : 'dagen'} over</span>
          )}
          {trialExpired && plan === 'trial' && (
            <span className="text-sm text-red-600 font-medium">Verlopen</span>
          )}
        </div>

        {/* Plan details */}
        {plan === 'pro' && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-green-800 font-medium">Je hebt een Pro abonnement — €20/maand</p>
            <p className="text-xs text-green-600 mt-1">Volledige toegang tot alle Quotr functies.</p>
          </div>
        )}

        {plan === 'trial' && (
          <div className={`${trialExpired ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'} border rounded-md p-4`}>
            <p className={`text-sm font-medium ${trialExpired ? 'text-red-800' : 'text-blue-800'}`}>
              {trialExpired ? 'Je proefperiode is verlopen' : `Je proefperiode loopt nog ${trialDaysLeft} dagen`}
            </p>
            <p className={`text-xs mt-1 ${trialExpired ? 'text-red-600' : 'text-blue-600'}`}>
              Upgrade naar Pro voor €20/maand voor onbeperkte toegang.
            </p>
          </div>
        )}

        {plan === 'cancelled' && (
          <div className="bg-zinc-50 border border-zinc-200 rounded-md p-4">
            <p className="text-sm text-zinc-800 font-medium">Je abonnement is opgezegd</p>
            <p className="text-xs text-zinc-600 mt-1">Heractiveer je abonnement om weer toegang te krijgen.</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {(plan === 'trial' || plan === 'cancelled') && (
            <PrimaryButton onClick={handleUpgrade} loading={upgrading}>
              {plan === 'cancelled' ? 'Heractiveer Pro — €20/maand' : 'Upgrade naar Pro — €20/maand'}
            </PrimaryButton>
          )}
          {plan === 'pro' && (
            <DangerButton onClick={handleCancel} loading={cancelling}>Abonnement opzeggen</DangerButton>
          )}
        </div>

        {/* What's included */}
        <div>
          <h4 className="text-sm font-medium text-zinc-700 mb-2">Pro bevat:</h4>
          <ul className="text-sm text-zinc-600 space-y-1">
            {['AI offerte builder', 'Onbeperkt offertes & facturen', 'Agenda & boekingspagina', 'PDF export', 'Belastingexport met PIN', 'E-mailnotificaties', 'Klantenbeheer', 'Mollie betalingen'].map(f => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-green-600">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  )
}
