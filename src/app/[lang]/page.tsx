import Link from "next/link";
import { getDictionary, getLocale } from "@/platform/i18n";

export default async function HomePage() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  return (
    <section className="max-w-2xl py-12">
      <p className="text-sm font-medium text-neutral-500">{dict.site.tagline}</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">{dict.home.heading}</h1>
      <p className="mt-4 text-lg text-neutral-600">{dict.home.body}</p>
      <Link
        href={`/${locale}/sign-up`}
        className="mt-8 inline-block rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
      >
        {dict.home.cta}
      </Link>
    </section>
  );
}
