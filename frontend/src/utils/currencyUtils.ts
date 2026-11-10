/**
 * Currency utilities for KYS.
 * Maps ISO currency codes to their standardized visual symbols and formats values.
 */

/**
 * Currency utilities for KYS.
 * Maps ISO currency codes to their standardized visual symbols and formats values.
 * Includes client-side pegged reference conversion rates matching the backend engine.
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

/**
 * Converts an amount from one currency to another using PRD benchmark pegged rates
 */
export const convertCurrency = (
  amount: number,
  fromCurrency: string = 'USD',
  toCurrency: string = 'USD'
): number => {
  if (!amount || isNaN(amount)) return 0;

  const from = (fromCurrency || 'USD').toUpperCase().trim();
  const to = (toCurrency || 'USD').toUpperCase().trim();

  if (from === to) return amount;

  // Convert to USD baseline
  const rateToUSD = RATES_TO_USD[from] ?? 1.0;
  const amountInUSD = amount * rateToUSD;

  // Convert from USD to target currency
  const rateFromUSD = RATES_FROM_USD[to] ?? 1.0;
  const converted = amountInUSD * rateFromUSD;

  return Math.round(converted * 100) / 100;
};

export const getCurrencySymbol = (currency: string = 'USD'): string => {
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
};

export const formatCurrency = (amount: number = 0, currency: string = 'USD'): string => {
  const symbol = getCurrencySymbol(currency);
  const formattedNum = Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formattedNum}`;
};

/**
 * Intelligently detects default currency from system timezone and browser locale
 */
export const detectDefaultCurrency = (): string => {
  try {
    // 1. Timezone detection (most reliable indicator of user's geographic region)
    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '').toLowerCase();

    // India & Subcontinent
    if (
      tz.includes('calcutta') ||
      tz.includes('kolkata') ||
      tz.includes('india') ||
      tz.includes('colombo') ||
      tz.includes('kathmandu') ||
      tz.includes('dhaka')
    ) {
      return 'INR';
    }

    // United Kingdom
    if (tz.includes('london')) {
      return 'GBP';
    }

    // Canada
    if (
      tz.includes('toronto') ||
      tz.includes('vancouver') ||
      tz.includes('montreal') ||
      tz.includes('edmonton') ||
      tz.includes('winnipeg') ||
      tz.includes('halifax') ||
      tz.startsWith('canada/')
    ) {
      return 'CAD';
    }

    // Australia
    if (
      tz.includes('sydney') ||
      tz.includes('melbourne') ||
      tz.includes('brisbane') ||
      tz.includes('perth') ||
      tz.includes('adelaide') ||
      tz.includes('darwin') ||
      tz.includes('hobart') ||
      tz.startsWith('australia/')
    ) {
      return 'AUD';
    }

    // Europe
    if (tz.startsWith('europe/')) {
      return 'EUR';
    }

    // 2. Browser language detection fallback
    const lang = (navigator.language || '').toLowerCase();
    if (
      lang.includes('-in') ||
      lang.startsWith('hi') ||
      lang.startsWith('ta') ||
      lang.startsWith('te') ||
      lang.startsWith('mr') ||
      lang.startsWith('gu') ||
      lang.startsWith('bn') ||
      lang.startsWith('pa')
    ) {
      return 'INR';
    }
    if (lang.includes('-gb')) {
      return 'GBP';
    }
    if (lang.includes('-ca')) {
      return 'CAD';
    }
    if (lang.includes('-au')) {
      return 'AUD';
    }
    if (
      lang.includes('-de') ||
      lang.includes('-fr') ||
      lang.includes('-es') ||
      lang.includes('-it') ||
      lang.includes('-nl') ||
      lang.includes('-pt') ||
      lang.includes('-ie')
    ) {
      return 'EUR';
    }
  } catch {
    // fallback
  }
  return 'USD';
};

/**
 * Detects system timezone from Intl API, normalizing aliases like Calcutta -> Kolkata
 */
export const detectDefaultTimezone = (): string => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && typeof tz === 'string' && tz.trim() !== '') {
      if (tz === 'Asia/Calcutta') {
        return 'Asia/Kolkata';
      }
      return tz;
    }
  } catch {
    // fallback
  }
  return 'UTC';
};

