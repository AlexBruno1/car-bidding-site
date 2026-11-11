/**
 * Money is always an integer amount of minor units (cents) plus an explicit
 * currency. Never use floats for prices and never assume the currency.
 */
export const SUPPORTED_CURRENCIES = ["EUR"] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export type Money = {
  readonly amountCents: number;
  readonly currency: Currency;
};

export function isCurrency(value: string): value is Currency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}

export function money(amountCents: number, currency: Currency): Money {
  if (!Number.isSafeInteger(amountCents)) {
    throw new RangeError("Money amount must be a safe integer number of cents");
  }
  if (amountCents < 0) {
    throw new RangeError("Money amount cannot be negative");
  }
  return { amountCents, currency };
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new TypeError(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
}

export function addMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amountCents + b.amountCents, a.currency);
}

/** Returns a negative number if a < b, zero if equal, positive if a > b. */
export function compareMoney(a: Money, b: Money): number {
  assertSameCurrency(a, b);
  return a.amountCents - b.amountCents;
}

export function formatMoney(value: Money, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: value.currency,
    maximumFractionDigits: value.amountCents % 100 === 0 ? 0 : 2,
  }).format(value.amountCents / 100);
}
