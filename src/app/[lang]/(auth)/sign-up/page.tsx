import type { Metadata } from "next";
import Link from "next/link";
import { PASSWORD_MIN_LENGTH } from "@/modules/identity";
import { getDictionary, getLocale } from "@/platform/i18n";
import { signUpAction } from "../actions";
import { AuthForm } from "../auth-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).auth.signUpTitle };
}

export default async function SignUpPage() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const t = dict.auth;
  const min = String(PASSWORD_MIN_LENGTH);

  return (
    <section className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">{t.signUpTitle}</h1>
      <AuthForm
        action={signUpAction.bind(null, locale)}
        submitLabel={t.submitSignUp}
        pendingLabel={t.pending}
        errorMessages={t.errors}
        fields={[
          {
            name: "name",
            label: t.name,
            type: "text",
            autoComplete: "name",
            error: t.fieldErrors.name,
          },
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
            autoComplete: "new-password",
            hint: t.passwordHint.replace("{min}", min),
            error: t.fieldErrors.password.replace("{min}", min),
          },
        ]}
      />
      <p className="mt-6 text-sm text-neutral-600">
        {t.haveAccount}{" "}
        <Link href={`/${locale}/sign-in`} className="font-medium text-neutral-900 underline">
          {dict.nav.signIn}
        </Link>
      </p>
    </section>
  );
}
