import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary, getLocale } from "@/platform/i18n";
import { signInAction } from "../actions";
import { AuthForm } from "../auth-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).auth.signInTitle };
}

export default async function SignInPage() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const t = dict.auth;

  return (
    <section className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">{t.signInTitle}</h1>
      <AuthForm
        action={signInAction.bind(null, locale)}
        submitLabel={t.submitSignIn}
        pendingLabel={t.pending}
        errorMessages={t.errors}
        fields={[
          {
            name: "email",
            label: t.email,
            type: "email",
            autoComplete: "email",
            error: t.fieldErrors.email,
          },
          {
            name: "password",
            label: t.password,
            type: "password",
            autoComplete: "current-password",
            error: t.fieldErrors.password,
          },
        ]}
      />
      <p className="mt-6 text-sm text-neutral-600">
        {t.noAccount}{" "}
        <Link href={`/${locale}/sign-up`} className="font-medium text-neutral-900 underline">
          {dict.nav.signUp}
        </Link>
      </p>
    </section>
  );
}
