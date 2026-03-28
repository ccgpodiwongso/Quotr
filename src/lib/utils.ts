/**
 * Merge class names — filters out falsy values and joins with a space.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format an amount as EUR currency.
 */
export function formatCurrency(amount: number, locale = 'nl-NL'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Format an ISO date string in a human-readable way.
 */
export function formatDate(date: string, locale = 'nl-NL'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Generate a quote number in the format Q-YYYY-NNN.
 */
export function generateQuoteNumber(nextNum: number, year?: number): string {
  const y = year ?? new Date().getFullYear();
  return `Q-${y}-${String(nextNum).padStart(3, '0')}`;
}

/**
 * Generate an invoice number in the format INV-YYYY-NNN.
 */
export function generateInvoiceNumber(nextNum: number, year?: number): string {
  const y = year ?? new Date().getFullYear();
  return `INV-${y}-${String(nextNum).padStart(3, '0')}`;
}
