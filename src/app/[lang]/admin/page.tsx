import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { can } from "@/modules/identity";
import { getCurrentUser } from "@/modules/identity/server";
import { getDictionary, getLocale } from "@/platform/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).admin.title, robots: { index: false } };
}

async function AdminHome() {
  const [dict, locale, user] = await Promise.all([getDictionary(), getLocale(), getCurrentUser()]);
  if (!user) redirect(`/${locale}/sign-in`);
  // Non-admins get a 404: the page does not confirm that an admin area exists.
  if (!can(user, "admin:access")) notFound();

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight">{dict.admin.title}</h1>
      <p className="mt-4 text-neutral-600">{dict.admin.body}</p>
    </section>
  );
}

export default function AdminPage() {
  return (
    <Suspense>
      <AdminHome />
    </Suspense>
  );
}
