import { describe, expect, it } from "vitest";
import { matchLocale } from "./config";
import en from "./dictionaries/en.json";
import it_ from "./dictionaries/it.json";

const keysOf = (value: unknown, prefix = ""): string[] =>
  value !== null && typeof value === "object"
    ? Object.entries(value).flatMap(([key, child]) => keysOf(child, `${prefix}${key}.`))
    : [prefix.slice(0, -1)];

describe("i18n", () => {
  it("picks the highest-quality supported language", () => {
    expect(matchLocale("en-GB,en;q=0.9,it;q=0.8")).toBe("en");
    expect(matchLocale("de-DE,de;q=0.9,it;q=0.5,en;q=0.4")).toBe("it");
    expect(matchLocale("en;q=0.2, it;q=0.9")).toBe("it");
  });

  it("falls back to Italian", () => {
    expect(matchLocale(null)).toBe("it");
    expect(matchLocale("")).toBe("it");
    expect(matchLocale("ja,zh;q=0.9")).toBe("it");
    expect(matchLocale(";;;,q=abc")).toBe("it");
  });

  it("keeps every dictionary in sync with the Italian one", () => {
    expect(keysOf(en).sort()).toEqual(keysOf(it_).sort());
  });
});
