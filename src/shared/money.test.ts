import { describe, expect, it } from "vitest";
import { addMoney, compareMoney, formatMoney, isCurrency, money, type Money } from "./money";

describe("money", () => {
  it("rejects fractional cents, negatives and unsafe integers", () => {
    expect(() => money(10.5, "EUR")).toThrow(RangeError);
    expect(() => money(-1, "EUR")).toThrow(RangeError);
    expect(() => money(Number.MAX_SAFE_INTEGER + 1, "EUR")).toThrow(RangeError);
  });

  it("adds and compares amounts in the same currency", () => {
    expect(addMoney(money(1_000_00, "EUR"), money(250_00, "EUR"))).toEqual(money(1_250_00, "EUR"));
    expect(compareMoney(money(1, "EUR"), money(2, "EUR"))).toBeLessThan(0);
    expect(compareMoney(money(2, "EUR"), money(2, "EUR"))).toBe(0);
  });

  it("refuses to mix currencies", () => {
    const pounds = { amountCents: 100, currency: "GBP" } as unknown as Money;
    expect(() => addMoney(money(100, "EUR"), pounds)).toThrow(TypeError);
    expect(() => compareMoney(money(100, "EUR"), pounds)).toThrow(TypeError);
  });

  it("formats for the locale, hiding cents on round amounts", () => {
    expect(formatMoney(money(45_000_00, "EUR"), "en")).toBe("€45,000");
    expect(formatMoney(money(45_000_50, "EUR"), "en")).toBe("€45,000.50");
    expect(formatMoney(money(45_000_00, "EUR"), "it")).toMatch(/^45\.000\s€$/);
  });

  it("recognises supported currencies only", () => {
    expect(isCurrency("EUR")).toBe(true);
    expect(isCurrency("XXX")).toBe(false);
  });
});
