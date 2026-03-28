'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Plus,
  X,
  Info,
  FileText,
  Send,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/loading';
import { Tabs, TabList, TabTrigger, TabPanel } from '@/components/ui/tabs';
import { cn, formatCurrency } from '@/lib/utils';
import type { Service, Client } from '@/types/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuoteLine {
  id: string;
  service_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
}

interface ParsedAIResponse {
  client_name: string;
  client_email: string;
  lines: {
    description: string;
    quantity: number;
    unit_price: number;
    service_id: string | null;
    vat_rate: number;
  }[];
  notes: string;
  ai_talking_point: string;
}

interface QuoteBuilderClientProps {
  services: Service[];
  clients: Client[];
  existingQuote?: import('@/types/database').Quote;
  existingLines?: import('@/types/database').QuoteLine[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createEmptyLine(): QuoteLine {
  return {
    id: crypto.randomUUID(),
    service_id: null,
    description: '',
    quantity: 1,
    unit_price: 0,
    vat_rate: 21,
  };
}

function lineSubtotal(line: QuoteLine): number {
  return line.quantity * line.unit_price;
}

function lineVat(line: QuoteLine): number {
  return lineSubtotal(line) * (line.vat_rate / 100);
}

// ---------------------------------------------------------------------------
// Client search dropdown
// ---------------------------------------------------------------------------

function ClientSelector({
  clients,
  selectedId,
  clientName,
  clientEmail,
  onSelectClient,
  onChangeClientName,
  onChangeClientEmail,
}: {
  clients: Client[];
  selectedId: string | null;
  clientName: string;
  clientEmail: string;
  onSelectClient: (client: Client | null) => void;
  onChangeClientName: (v: string) => void;
  onChangeClientEmail: (v: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query) return clients;
    const q = query.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [clients, query]);

  const handleSelect = (client: Client) => {
    onSelectClient(client);
    setQuery('');
    setOpen(false);
  };

  const handleClear = () => {
    onSelectClient(null);
    onChangeClientName('');
    onChangeClientEmail('');
  };

  if (selectedId) {
    const selected = clients.find((c) => c.id === selectedId);
    return (
      <div className="flex items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-900 truncate">
            {selected?.name ?? clientName}
          </p>
          <p className="text-xs text-zinc-500 truncate">
            {selected?.email ?? clientEmail}
          </p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="shrink-0 rounded-md p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          placeholder="Zoek een klant of typ een nieuwe naam..."
          icon={<Search className="h-4 w-4" />}
          value={query || clientName}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            onChangeClientName(v);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Delay to allow click on option
            setTimeout(() => setOpen(false), 200);
          }}
        />
        {open && filtered.length > 0 && (
          <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-zinc-200 bg-white shadow-lg">
            {filtered.map((client) => (
              <button
                key={client.id}
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 transition-colors"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(client)}
              >
                <span className="font-medium text-zinc-900">{client.name}</span>
                <span className="ml-2 text-zinc-500">{client.email}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {!selectedId && clientName && !clients.some((c) => c.name === clientName) && (
        <Input
          label="E-mailadres nieuwe klant"
          type="email"
          placeholder="klant@voorbeeld.nl"
          value={clientEmail}
          onChange={(e) => onChangeClientEmail(e.target.value)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function QuoteBuilderClient({ services, clients, existingQuote, existingLines }: QuoteBuilderClientProps) {
  const router = useRouter();
  const isEditMode = !!existingQuote;

  // AI mode state
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTalkingPoint, setAiTalkingPoint] = useState('');
  const [aiError, setAiError] = useState('');

  // Shared form state — prefill when editing
  const [clientId, setClientId] = useState<string | null>(existingQuote?.client_id ?? null);
  const [clientName, setClientName] = useState(() => {
    if (existingQuote?.client_id) {
      const c = clients.find((cl) => cl.id === existingQuote.client_id);
      return c?.name ?? '';
    }
    return '';
  });
  const [clientEmail, setClientEmail] = useState(() => {
    if (existingQuote?.client_id) {
      const c = clients.find((cl) => cl.id === existingQuote.client_id);
      return c?.email ?? '';
    }
    return '';
  });
  const [lines, setLines] = useState<QuoteLine[]>(() => {
    if (existingLines && existingLines.length > 0) {
      return existingLines.map((l) => ({
        id: l.id ?? crypto.randomUUID(),
        service_id: l.service_id,
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unit_price,
        vat_rate: l.tax_rate,
      }));
    }
    return [createEmptyLine()];
  });
  const [notes, setNotes] = useState(existingQuote?.conclusion ?? '');
  const [validUntil, setValidUntil] = useState(() => {
    if (existingQuote?.valid_until) return existingQuote.valid_until.split('T')[0];
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [paymentTerms, setPaymentTerms] = useState(() => {
    const meta = existingQuote?.metadata as Record<string, unknown> | undefined;
    return (meta?.payment_terms as string) ?? '14 dagen na factuurdatum';
  });
  const [depositNote, setDepositNote] = useState(() => {
    const meta = existingQuote?.metadata as Record<string, unknown> | undefined;
    return (meta?.deposit_note as string) ?? '';
  });
  const [followUpDate, setFollowUpDate] = useState(() => {
    const meta = existingQuote?.metadata as Record<string, unknown> | undefined;
    return (meta?.follow_up_date as string) ?? '';
  });
  const [discountValue, setDiscountValue] = useState(existingQuote?.discount_value ?? 0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>(
    (existingQuote?.discount_type as 'fixed' | 'percentage') ?? 'fixed'
  );
  const [title, setTitle] = useState(existingQuote?.title ?? '');

  // Saving states
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  // -------------------------------------------------------------------------
  // Computed totals
  // -------------------------------------------------------------------------

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + lineSubtotal(l), 0),
    [lines]
  );

  const discountAmount = useMemo(() => {
    if (discountType === 'percentage') {
      return subtotal * (discountValue / 100);
    }
    return discountValue;
  }, [subtotal, discountValue, discountType]);

  const vatBreakdown = useMemo(() => {
    const map: Record<number, number> = {};
    for (const l of lines) {
      const taxableBase = lineSubtotal(l);
      // Distribute discount proportionally
      const proportion = subtotal > 0 ? taxableBase / subtotal : 0;
      const adjustedBase = taxableBase - discountAmount * proportion;
      const vat = adjustedBase * (l.vat_rate / 100);
      map[l.vat_rate] = (map[l.vat_rate] ?? 0) + vat;
    }
    return Object.entries(map)
      .map(([rate, amount]) => ({ rate: Number(rate), amount }))
      .sort((a, b) => a.rate - b.rate);
  }, [lines, subtotal, discountAmount]);

  const vatTotal = useMemo(
    () => vatBreakdown.reduce((sum, v) => sum + v.amount, 0),
    [vatBreakdown]
  );

  const grandTotal = useMemo(
    () => subtotal - discountAmount + vatTotal,
    [subtotal, discountAmount, vatTotal]
  );

  // -------------------------------------------------------------------------
  // Line management
  // -------------------------------------------------------------------------

  const updateLine = useCallback(
    (id: string, updates: Partial<QuoteLine>) => {
      setLines((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
      );
    },
    []
  );

  const removeLine = useCallback((id: string) => {
    setLines((prev) => {
      const next = prev.filter((l) => l.id !== id);
      return next.length === 0 ? [createEmptyLine()] : next;
    });
  }, []);

  const addLine = useCallback(() => {
    setLines((prev) => [...prev, createEmptyLine()]);
  }, []);

  const applyService = useCallback(
    (lineId: string, serviceId: string) => {
      const service = services.find((s) => s.id === serviceId);
      if (!service) return;
      updateLine(lineId, {
        service_id: serviceId,
        description: service.name + (service.description ? ` - ${service.description}` : ''),
        unit_price: service.unit_price,
        vat_rate: service.tax_rate,
      });
    },
    [services, updateLine]
  );

  // -------------------------------------------------------------------------
  // AI parsing
  // -------------------------------------------------------------------------

  const handleAiParse = useCallback(async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setAiError('');
    setAiTalkingPoint('');

    try {
      const res = await fetch('/api/quotes/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiInput }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Onbekende fout' }));
        throw new Error(err.error ?? 'Analyseren mislukt');
      }

      const data: ParsedAIResponse = await res.json();

      // Try to match client
      if (data.client_email) {
        const match = clients.find(
          (c) => c.email.toLowerCase() === data.client_email.toLowerCase()
        );
        if (match) {
          setClientId(match.id);
          setClientName(match.name);
          setClientEmail(match.email);
        } else {
          setClientId(null);
          setClientName(data.client_name || '');
          setClientEmail(data.client_email || '');
        }
      } else if (data.client_name) {
        const match = clients.find(
          (c) => c.name.toLowerCase() === data.client_name.toLowerCase()
        );
        if (match) {
          setClientId(match.id);
          setClientName(match.name);
          setClientEmail(match.email);
        } else {
          setClientId(null);
          setClientName(data.client_name);
          setClientEmail('');
        }
      }

      // Set lines
      if (data.lines && data.lines.length > 0) {
        setLines(
          data.lines.map((l) => ({
            id: crypto.randomUUID(),
            service_id: l.service_id,
            description: l.description,
            quantity: l.quantity ?? 1,
            unit_price: l.unit_price ?? 0,
            vat_rate: l.vat_rate ?? 21,
          }))
        );
      }

      if (data.notes) setNotes(data.notes);
      if (data.ai_talking_point) setAiTalkingPoint(data.ai_talking_point);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Er ging iets mis.');
    } finally {
      setAiLoading(false);
    }
  }, [aiInput, clients]);

  // -------------------------------------------------------------------------
  // Save / Send
  // -------------------------------------------------------------------------

  const buildPayload = useCallback(() => {
    return {
      client_id: clientId,
      client_name: clientName,
      client_email: clientEmail,
      title: title || 'Offerte',
      notes,
      valid_until: validUntil || null,
      payment_terms: paymentTerms,
      deposit_note: depositNote,
      follow_up_date: followUpDate || null,
      discount_type: discountValue > 0 ? discountType : null,
      discount_value: discountValue > 0 ? discountValue : null,
      lines: lines.map((l, i) => ({
        service_id: l.service_id,
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unit_price,
        tax_rate: l.vat_rate,
        sort_order: i,
      })),
    };
  }, [
    clientId,
    clientName,
    clientEmail,
    title,
    notes,
    validUntil,
    paymentTerms,
    depositNote,
    followUpDate,
    discountType,
    discountValue,
    lines,
  ]);

  const validate = useCallback((): string | null => {
    if (!clientId && !clientName.trim()) {
      return 'Selecteer of voer een klant in.';
    }
    if (!clientId && !clientEmail.trim()) {
      return 'Voer een e-mailadres in voor de nieuwe klant.';
    }
    const hasValidLine = lines.some(
      (l) => l.description.trim() && l.quantity > 0 && l.unit_price >= 0
    );
    if (!hasValidLine) {
      return 'Voeg minimaal een geldige regel toe.';
    }
    return null;
  }, [clientId, clientName, clientEmail, lines]);

  const handleSave = useCallback(
    async (sendAfterSave: boolean) => {
      const validationError = validate();
      if (validationError) {
        alert(validationError);
        return;
      }

      const setLoading = sendAfterSave ? setSending : setSaving;
      setLoading(true);

      try {
        const payload = buildPayload();

        if (isEditMode && existingQuote) {
          // Update existing quote via API
          const res = await fetch(`/api/quotes/${existingQuote.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Opslaan mislukt' }));
            throw new Error(err.error ?? 'Opslaan mislukt');
          }

          if (sendAfterSave) {
            const sendRes = await fetch(`/api/quotes/${existingQuote.id}/send`, {
              method: 'POST',
            });
            if (!sendRes.ok) {
              console.error('Versturen mislukt na opslaan');
            }
          }

          router.push(`/app/quotes/${existingQuote.id}`);
          router.refresh();
        } else {
          // Create new quote
          const res = await fetch('/api/quotes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Opslaan mislukt' }));
            throw new Error(err.error ?? 'Opslaan mislukt');
          }

          const { quote } = await res.json();

          if (sendAfterSave && quote?.id) {
            const sendRes = await fetch(`/api/quotes/${quote.id}/send`, {
              method: 'POST',
            });
            if (!sendRes.ok) {
              console.error('Versturen mislukt na opslaan');
            }
          }

          router.push('/app/quotes');
          router.refresh();
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Er ging iets mis.');
      } finally {
        setLoading(false);
      }
    },
    [validate, buildPayload, router, isEditMode, existingQuote]
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const vatRateOptions = [
    { value: '21', label: '21%' },
    { value: '9', label: '9%' },
    { value: '0', label: '0%' },
  ];

  const serviceOptions = [
    { value: '', label: 'Kies dienst...' },
    ...services.map((s) => ({
      value: s.id,
      label: `${s.name} — ${formatCurrency(s.unit_price)}`,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* Mode tabs */}
      {/* ----------------------------------------------------------------- */}
      <Tabs defaultTab="ai">
        <Card>
          <TabList>
            <TabTrigger value="ai">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                AI Modus
              </span>
            </TabTrigger>
            <TabTrigger value="manual">
              <span className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                Handmatig
              </span>
            </TabTrigger>
          </TabList>

          {/* AI Panel */}
          <TabPanel value="ai">
            <div className="space-y-4">
              <Textarea
                placeholder="Plak een email of beschrijf wat de klant nodig heeft..."
                rows={6}
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                className="min-h-[140px]"
              />

              {aiError && (
                <p className="text-sm text-red-600">{aiError}</p>
              )}

              <Button
                onClick={handleAiParse}
                loading={aiLoading}
                disabled={!aiInput.trim() || aiLoading}
              >
                <Sparkles className="h-4 w-4" />
                {aiLoading ? 'Quotr AI analyseert je aanvraag...' : 'Analyseren met AI'}
              </Button>

              {aiLoading && (
                <div className="flex items-center gap-3 py-4">
                  <Spinner size="md" />
                  <span className="text-sm text-zinc-500">
                    Quotr AI analyseert je aanvraag...
                  </span>
                </div>
              )}
            </div>
          </TabPanel>

          {/* Manual Panel — just a spacer, form is below */}
          <TabPanel value="manual">
            <p className="text-sm text-zinc-500">
              Vul de offerte hieronder handmatig in.
            </p>
          </TabPanel>
        </Card>

        {/* AI talking point */}
        {aiTalkingPoint && (
          <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <Info className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">
                AI Suggestie
              </p>
              <p className="text-sm text-blue-800">{aiTalkingPoint}</p>
            </div>
          </div>
        )}
      </Tabs>

      {/* ----------------------------------------------------------------- */}
      {/* Quote form (shared by both modes) */}
      {/* ----------------------------------------------------------------- */}

      {/* Title */}
      <Card title="Offertedetails">
        <div className="space-y-4">
          <Input
            label="Titel"
            placeholder="Bijv. Website redesign"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
      </Card>

      {/* Client */}
      <Card title="Klant">
        <ClientSelector
          clients={clients}
          selectedId={clientId}
          clientName={clientName}
          clientEmail={clientEmail}
          onSelectClient={(c) => {
            if (c) {
              setClientId(c.id);
              setClientName(c.name);
              setClientEmail(c.email);
            } else {
              setClientId(null);
            }
          }}
          onChangeClientName={setClientName}
          onChangeClientEmail={setClientEmail}
        />
      </Card>

      {/* Lines */}
      <Card title="Regels">
        <div className="space-y-3">
          {/* Header (desktop) */}
          <div className="hidden md:grid md:grid-cols-[1fr_2fr_80px_120px_90px_100px_40px] gap-2 text-xs font-medium text-zinc-500 px-1">
            <span>Dienst</span>
            <span>Omschrijving</span>
            <span>Aantal</span>
            <span>Prijs</span>
            <span>BTW</span>
            <span className="text-right">Totaal</span>
            <span />
          </div>

          {lines.map((line) => (
            <div
              key={line.id}
              className="grid grid-cols-1 md:grid-cols-[1fr_2fr_80px_120px_90px_100px_40px] gap-2 items-start rounded-lg border border-zinc-100 bg-zinc-50/50 p-3 md:p-2 md:bg-transparent md:border-0 md:rounded-none"
            >
              {/* Service selector */}
              <Select
                value={line.service_id ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    applyService(line.id, val);
                  } else {
                    updateLine(line.id, { service_id: null });
                  }
                }}
                options={serviceOptions}
              />

              {/* Description */}
              <Input
                placeholder="Omschrijving"
                value={line.description}
                onChange={(e) =>
                  updateLine(line.id, { description: e.target.value })
                }
              />

              {/* Quantity */}
              <Input
                type="number"
                min={0}
                step={0.5}
                value={line.quantity}
                onChange={(e) =>
                  updateLine(line.id, {
                    quantity: parseFloat(e.target.value) || 0,
                  })
                }
              />

              {/* Unit price */}
              <Input
                type="number"
                min={0}
                step={0.01}
                value={line.unit_price}
                onChange={(e) =>
                  updateLine(line.id, {
                    unit_price: parseFloat(e.target.value) || 0,
                  })
                }
              />

              {/* VAT rate */}
              <Select
                value={String(line.vat_rate)}
                onChange={(e) =>
                  updateLine(line.id, {
                    vat_rate: parseInt(e.target.value, 10),
                  })
                }
                options={vatRateOptions}
              />

              {/* Line total */}
              <p className="flex items-center justify-end text-sm font-medium text-zinc-900 h-9">
                {formatCurrency(lineSubtotal(line))}
              </p>

              {/* Remove */}
              <button
                type="button"
                onClick={() => removeLine(line.id)}
                className="flex items-center justify-center h-9 w-9 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Regel verwijderen"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          <Button variant="secondary" size="sm" onClick={addLine}>
            <Plus className="h-4 w-4" />
            Regel toevoegen
          </Button>
        </div>
      </Card>

      {/* Totals */}
      <Card title="Totalen">
        <div className="space-y-3">
          {/* Subtotal */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-600">Subtotaal</span>
            <span className="font-medium text-zinc-900">
              {formatCurrency(subtotal)}
            </span>
          </div>

          {/* Discount */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-600 shrink-0">Korting</span>
            <div className="flex items-center gap-2 ml-auto">
              <Select
                value={discountType}
                onChange={(e) =>
                  setDiscountType(e.target.value as 'fixed' | 'percentage')
                }
                className="w-24"
                options={[
                  { value: 'fixed', label: 'EUR' },
                  { value: 'percentage', label: '%' },
                ]}
              />
              <Input
                type="number"
                min={0}
                step={0.01}
                value={discountValue || ''}
                onChange={(e) =>
                  setDiscountValue(parseFloat(e.target.value) || 0)
                }
                className="w-28"
                placeholder="0,00"
              />
            </div>
          </div>

          {discountAmount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600">Korting</span>
              <span className="font-medium text-red-600">
                -{formatCurrency(discountAmount)}
              </span>
            </div>
          )}

          {/* VAT breakdown */}
          {vatBreakdown.map((v) => (
            <div
              key={v.rate}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-zinc-600">BTW {v.rate}%</span>
              <span className="font-medium text-zinc-900">
                {formatCurrency(v.amount)}
              </span>
            </div>
          ))}

          {/* Grand total */}
          <div className="flex items-center justify-between border-t border-zinc-200 pt-3">
            <span className="text-base font-semibold text-zinc-900">
              Totaal
            </span>
            <span className="text-base font-semibold text-zinc-900">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>
      </Card>

      {/* Additional fields */}
      <Card title="Extra gegevens">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Textarea
            label="Notities"
            placeholder="Aanvullende opmerkingen voor de klant..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />

          <div className="space-y-4">
            <Input
              label="Geldig tot"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />

            <Input
              label="Betaaltermijn"
              placeholder="14 dagen na factuurdatum"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
            />
          </div>

          <Input
            label="Aanbetaling"
            placeholder="Bijv. 30% bij opdracht"
            value={depositNote}
            onChange={(e) => setDepositNote(e.target.value)}
          />

          <Input
            label="Follow-up datum"
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
          />
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pb-8">
        <Button
          variant="secondary"
          onClick={() => handleSave(false)}
          loading={saving}
          disabled={saving || sending}
        >
          <FileText className="h-4 w-4" />
          {isEditMode ? 'Opslaan' : 'Opslaan als concept'}
        </Button>
        <Button
          onClick={() => handleSave(true)}
          loading={sending}
          disabled={saving || sending}
        >
          <Send className="h-4 w-4" />
          {isEditMode ? 'Opslaan & versturen' : 'Opslaan & versturen'}
        </Button>
      </div>
    </div>
  );
}
