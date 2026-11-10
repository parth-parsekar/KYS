/**
 * Formats a Date object to YYYY-MM-DD using local time (avoiding UTC timezone shifting).
 */
export const formatLocalDate = (d: Date = new Date()): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * Calculates the next renewal date given a starting date (YYYY-MM-DD) and a billing frequency.
 * - Weekly: +7 days
 * - Monthly: +1 month
 * - Quarterly: +3 months
 * - Yearly: +1 year
 */
export const calculateNextRenewal = (startDateStr: string, frequency: string): string => {
  if (!startDateStr) {
    startDateStr = formatLocalDate(new Date());
  }
  const parts = startDateStr.split('-').map(Number);
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return startDateStr;
  }
  const [year, month, day] = parts;
  const d = new Date(year, month - 1, day);

  if (frequency === 'Weekly') {
    d.setDate(d.getDate() + 7);
  } else if (frequency === 'Quarterly') {
    d.setMonth(d.getMonth() + 3);
  } else if (frequency === 'Yearly') {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    // Default Monthly
    d.setMonth(d.getMonth() + 1);
  }

  return formatLocalDate(d);
};

