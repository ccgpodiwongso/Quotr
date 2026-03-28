'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import type { Quote, QuoteLine, Client, Company } from '@/types/database';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PublicQuoteViewProps {
  quote: Quote;
  lines: QuoteLine[];
  client: Client;
  company: Company;
  isExpired: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function companyAddress(c: Company): string {
  const parts = [c.address_line1, c.address_line2, [c.postal_code, c.city].filter(Boolean).join(' ')].filter(Boolean);
  return parts.join(', ');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PublicQuoteView({
  quote,
  lines,
  client,
  company,
  isExpired,
}: PublicQuoteViewProps) {
  const [status, setStatus] = useState(quote.status);
  const [accepting, setAccepting] = useState(false);
  const [acceptDone, setAcceptDone] = useState(quote.status === 'accepted');
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [changeMessage, setChangeMessage] = useState('');
  const [changeSending, setChangeSending] = useState(false);
  const [changeSent, setChangeSent] = useState(false);

  // ---- VAT breakdown ---------------------------------------------------
  const vatBreakdown = useMemo(() => {
    const map = new Map<number, number>();
    for (const line of lines) {
      const vatAmount = line.subtotal * (line.tax_rate / 100);
      map.set(line.tax_rate, (map.get(line.tax_rate) ?? 0) + vatAmount);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [lines]);

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.subtotal, 0), [lines]);
  const totalVat = useMemo(() => vatBreakdown.reduce((s, [, v]) => s + v, 0), [vatBreakdown]);

  // ---- Discount --------------------------------------------------------
  const discountAmount = useMemo(() => {
    if (!quote.discount_value) return 0;
    if (quote.discount_type === 'percentage') return subtotal * (quote.discount_value / 100);
    return quote.discount_value;
  }, [quote.discount_type, quote.discount_value, subtotal]);

  const grandTotal = subtotal - discountAmount + totalVat;

  // ---- Actions ---------------------------------------------------------
  const isAccepted = status === 'accepted' || acceptDone;
  const isRejected = status === 'rejected';
  const showActions = !isExpired && !isAccepted && !isRejected;

  async function handleAccept() {
    setAccepting(true);
    try {
      const res = await fetch(`/api/quotes/${quote.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote_id: quote.id }),
      });
      if (res.ok) {
        setAcceptDone(true);
        setStatus('accepted');
      }
    } finally {
      setAccepting(false);
    }
  }

  async function handleRequestChanges() {
    if (!changeMessage.trim()) return;
    setChangeSending(true);
    try {
      const res = await fetch(`/api/quotes/${quote.id}/request-changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: changeMessage }),
      });
      if (res.ok) {
        setChangeSent(true);
        setShowChangeModal(false);
        setChangeMessage('');
      }
    } finally {
      setChangeSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-[800px] px-4 py-8 sm:px-6 lg:py-12">
      {/* ---- Status Banners ---- */}
      {isAccepted && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-5 py-4 text-center text-sm font-medium text-green-800">
          Deze offerte is geaccepteerd
        </div>
      )}
      {isExpired && !isAccepted && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-center text-sm font-medium text-amber-800">
          Deze offerte is verlopen
        </div>
      )}
      {isRejected && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-center text-sm font-medium text-red-800">
          Deze offerte is afgewezen
        </div>
      )}
      {changeSent && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-5 py-4 text-center text-sm font-medium text-blue-800">
          Uw wijzigingsverzoek is verzonden. We nemen zo snel mogelijk contact met u op.
        </div>
      )}

      {/* ---- Main Card ---- */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        {/* ---- Header ---- */}
        <div className="border-b border-zinc-100 px-6 py-8 sm:px-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            {/* Left: company info */}
            <div className="flex items-start gap-4">
              {company.logo_url && (
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-zinc-100">
                  <Image
                    src={company.logo_url}
                    alt={company.name}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <div>
                <h1 className="text-xl font-semibold text-zinc-900">{company.name}</h1>
                {companyAddress(company) && (
                  <p className="mt-1 text-sm text-zinc-500">{companyAddress(company)}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                  {company.kvk_number && <span>KVK: {company.kvk_number}</span>}
                  {company.btw_number && <span>BTW: {company.btw_number}</span>}
                </div>
              </div>
            </div>

            {/* Right: quote meta */}
            <div className="text-left sm:text-right">
              <p className="text-sm font-medium text-zinc-400 uppercase tracking-wide">Offerte</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900 font-mono">
                {quote.quote_number}
              </p>
              <div className="mt-3 space-y-1 text-sm text-zinc-500">
                <p>Datum: {formatDate(quote.created_at)}</p>
                {quote.valid_until && (
                  <p>Geldig tot: {formatDate(quote.valid_until)}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ---- Client Info ---- */}
        <div className="border-b border-zinc-100 px-6 py-5 sm:px-10">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">
            Aan
          </p>
          <p className="text-sm font-medium text-zinc-900">{client.name}</p>
          {client.contact_person && (
            <p className="text-sm text-zinc-500">t.a.v. {client.contact_person}</p>
          )}
          {client.email && <p className="text-sm text-zinc-500">{client.email}</p>}
          {(client.address_line1 || client.city) && (
            <p className="text-sm text-zinc-500 mt-1">
              {[client.address_line1, [client.postal_code, client.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
            </p>
          )}
        </div>

        {/* ---- Title / Introduction ---- */}
        {((quote as any).title || (quote as any).introduction) && (
          <div className="border-b border-zinc-100 px-6 py-5 sm:px-10">
            {(quote as any).title && (
              <h2 className="text-base font-semibold text-zinc-900 mb-2">{(quote as any).title as string}</h2>
            )}
            {(quote as any).introduction && (
              <p className="text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed">
                {(quote as any).introduction as string}
              </p>
            )}
          </div>
        )}

        {/* ---- Line Items Table ---- */}
        <div className="px-6 py-5 sm:px-10">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="pb-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">
                    Omschrijving
                  </th>
                  <th className="pb-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wide w-20">
                    Aantal
                  </th>
                  <th className="pb-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wide w-28">
                    Prijs
                  </th>
                  <th className="pb-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wide w-16">
                    BTW
                  </th>
                  <th className="pb-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wide w-28">
                    Totaal
                  </th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr
                    key={line.id}
                    className={cn(
                      'border-b border-zinc-50',
                      idx % 2 === 1 && 'bg-zinc-50/50'
                    )}
                  >
                    <td className="py-3 pr-4 text-zinc-700 whitespace-pre-wrap">
                      {line.description}
                    </td>
                    <td className="py-3 text-right text-zinc-600 tabular-nums">
                      {line.quantity}
                    </td>
                    <td className="py-3 text-right text-zinc-600 tabular-nums">
                      {formatCurrency(line.unit_price)}
                    </td>
                    <td className="py-3 text-right text-zinc-600 tabular-nums">
                      {line.tax_rate}%
                    </td>
                    <td className="py-3 text-right text-zinc-900 font-medium tabular-nums">
                      {formatCurrency(line.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ---- Summary ---- */}
          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm text-zinc-600">
                <span>Subtotaal</span>
                <span className="tabular-nums">{formatCurrency(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-zinc-600">
                  <span>
                    Korting
                    {quote.discount_type === 'percentage' && ` (${quote.discount_value}%)`}
                  </span>
                  <span className="tabular-nums text-red-600">
                    -{formatCurrency(discountAmount)}
                  </span>
                </div>
              )}

              {vatBreakdown.map(([rate, amount]) => (
                <div key={rate} className="flex justify-between text-sm text-zinc-600">
                  <span>BTW {rate}%</span>
                  <span className="tabular-nums">{formatCurrency(amount)}</span>
                </div>
              ))}

              <div className="border-t border-zinc-200 pt-3 mt-3 flex justify-between items-baseline">
                <span className="text-base font-semibold text-zinc-900">Totaal</span>
                <span className="text-xl font-bold text-zinc-900 font-mono tabular-nums">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ---- Conclusion / Notes ---- */}
        {quote.conclusion && (
          <div className="border-t border-zinc-100 px-6 py-5 sm:px-10">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">
              Opmerkingen
            </p>
            <p className="text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed">
              {quote.conclusion}
            </p>
          </div>
        )}

        {/* ---- Payment terms (from metadata) ---- */}
        {quote.metadata?.payment_terms && (
          <div className="border-t border-zinc-100 px-6 py-5 sm:px-10">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">
              Betalingsvoorwaarden
            </p>
            <p className="text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed">
              {String(quote.metadata.payment_terms) as React.ReactNode}
            </p>
          </div>
        )}

        {/* ---- Deposit note (from metadata) ---- */}
        {quote.metadata?.deposit_note && (
          <div className="border-t border-zinc-100 px-6 py-5 sm:px-10">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">
              Aanbetaling
            </p>
            <p className="text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed">
              {String(quote.metadata.deposit_note) as React.ReactNode}
            </p>
          </div>
        )}

        {/* ---- Action Buttons ---- */}
        {showActions && (
          <div className="border-t border-zinc-200 bg-zinc-50/50 px-6 py-6 sm:px-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setShowChangeModal(true)}
                className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:ring-offset-2"
              >
                Wijzigingen aanvragen
              </button>
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="inline-flex items-center justify-center rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {accepting ? 'Bezig...' : 'Accepteren'}
              </button>
            </div>
          </div>
        )}

        {/* ---- Accepted success ---- */}
        {acceptDone && quote.status !== 'accepted' && (
          <div className="border-t border-green-200 bg-green-50 px-6 py-5 sm:px-10 text-center">
            <p className="text-base font-semibold text-green-800">
              Offerte geaccepteerd! &#10003;
            </p>
          </div>
        )}
      </div>

      {/* ---- Footer ---- */}
      <div className="mt-8 text-center text-xs text-zinc-400">
        <span>Powered by </span>
        <a
          href="https://getquotr.nl?ref=quote&utm_source=quote"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          Quotr
        </a>
        <span> &mdash; </span>
        <a
          href="https://getquotr.nl?ref=quote&utm_source=quote"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 hover:text-zinc-700 transition-colors underline underline-offset-2"
        >
          Gratis proberen
        </a>
      </div>

      {/* ---- Request Changes Modal ---- */}
      {showChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900 mb-1">
              Wijzigingen aanvragen
            </h3>
            <p className="text-sm text-zinc-500 mb-4">
              Beschrijf de gewenste wijzigingen. We nemen zo snel mogelijk contact op.
            </p>
            <textarea
              value={changeMessage}
              onChange={(e) => setChangeMessage(e.target.value)}
              placeholder="Bijv. 'Graag extra regel toevoegen voor...' of 'Aantal aanpassen naar...'"
              rows={5}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 resize-none"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowChangeModal(false);
                  setChangeMessage('');
                }}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleRequestChanges}
                disabled={changeSending || !changeMessage.trim()}
                className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changeSending ? 'Verzenden...' : 'Verzenden'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
