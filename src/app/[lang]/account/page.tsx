import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/modules/identity/server";
import { getDictionary, getLocale } from "@/platform/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).account.title, robots: { index: false } };
}

async function AccountDetails() {
  const [dict, locale, user] = await Promise.all([getDictionary(), getLocale(), getCurrentUser()]);
  if (!user) redirect(`/${locale}/sign-in`);

  return (
    <dl className="mt-6 space-y-3 text-sm">
      <div>
        <dt className="text-neutral-500">{dict.auth.name}</dt>
        <dd className="font-medium">{user.name}</dd>
      </div>
      <div>
        <dt className="text-neutral-500">{dict.auth.email}</dt>
        <dd className="font-medium">{user.email}</dd>
      </div>
      <div>
        <dt className="text-neutral-500">{dict.account.role}</dt>
        <dd className="font-medium">{dict.account.roles[user.role]}</dd>
      </div>
    </dl>
  );
}

export default async function AccountPage() {
  const dict = await getDictionary();
  return (
    <section className="max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight">{dict.account.title}</h1>
      <Suspense>
        <AccountDetails />
      </Suspense>
    </section>
  );
}
