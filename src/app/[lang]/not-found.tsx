import Link from "next/link";
import { getDictionary, getLocale } from "@/platform/i18n";

export default async function NotFound() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  return (
    <section className="py-12">
      <h1 className="text-2xl font-semibold">{dict.errors.notFoundTitle}</h1>
      <Link href={`/${locale}`} className="mt-4 inline-block text-sm underline">
        {dict.errors.backHome}
      </Link>
    </section>
  );
}
