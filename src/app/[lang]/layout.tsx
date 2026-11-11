import type { Metadata } from "next";
import { getDictionary, getLocale, LOCALES } from "@/platform/i18n";
import { SiteHeader } from "./_components/site-header";
import "./globals.css";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    title: { default: dict.site.name, template: `%s · ${dict.site.name}` },
    description: dict.site.description,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  return (
    // Browser extensions often add attributes to <html> before React loads.
    // This silences the resulting warning for this element's own attributes
    // only; mismatches anywhere inside it are still reported.
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen bg-white font-sans text-neutral-900 antialiased">
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl px-4 py-10">{children}</main>
      </body>
    </html>
  );
}
