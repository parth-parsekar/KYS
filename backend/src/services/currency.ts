/**
 * Currency conversion utility based on static pegged reference rates for MVP (PRD section 3.1 & 3.4).
 * Base: USD
 * Rates:
 * 1 USD = 0.92 EUR
 * 1 USD = 0.79 GBP
 * 1 USD = 83.50 INR
 * 1 USD = 1.36 CAD
 * 1 USD = 1.52 AUD
 */

const RATES_FROM_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.5,
  CAD: 1.36,
  AUD: 1.52,
};

const RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 1 / 0.92,
  GBP: 1 / 0.79,
  INR: 1 / 83.5,
  CAD: 1 / 1.36,
  AUD: 1 / 1.52,
};

export function convertCurrency(
  amount: number,
  fromCurrency: string = 'USD',
  toCurrency: string = 'USD'
): number {
  if (!amount || isNaN(amount)) return 0;

  const from = (fromCurrency || 'USD').toUpperCase().trim();
  const to = (toCurrency || 'USD').toUpperCase().trim();

  if (from === to) return amount;

  // Convert to USD first
  const rateToUSD = RATES_TO_USD[from] ?? 1.0;
  const amountInUSD = amount * rateToUSD;

  // Convert from USD to target currency
  const rateFromUSD = RATES_FROM_USD[to] ?? 1.0;
  const converted = amountInUSD * rateFromUSD;

  return Math.round(converted * 100) / 100;
}

export function getCurrencySymbol(currency: string = 'USD'): string {
  const code = (currency || 'USD').toUpperCase().trim();
  switch (code) {
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'INR':
      return '₹';
    case 'CAD':
      return 'CA$';
    case 'AUD':
      return 'AU$';
    case 'USD':
    default:
      return '$';
  }
}

