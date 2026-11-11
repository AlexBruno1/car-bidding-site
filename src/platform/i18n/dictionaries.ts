import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { isLocale, type Locale } from "./config";
import type it from "./dictionaries/it.json";

/** Italian is the source of truth: other locales must have the same keys. */
export type Dictionary = typeof it;

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  it: () => import("./dictionaries/it.json").then((module) => module.default),
  en: () => import("./dictionaries/en.json").then((module) => module.default),
};

/** Locale of the current request, from the `[lang]` URL segment. */
export async function getLocale(): Promise<Locale> {
  const locale = await lang();
  if (!locale || !isLocale(locale)) notFound();
  return locale;
}

export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()]();
}
