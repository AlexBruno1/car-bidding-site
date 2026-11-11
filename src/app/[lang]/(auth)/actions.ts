"use server";

import { redirect } from "next/navigation";
import { signInSchema, signUpSchema } from "@/modules/identity";
import { signIn, signOut, signUp, type AuthFailure } from "@/modules/identity/server";
import { isLocale, DEFAULT_LOCALE } from "@/platform/i18n/config";

export type AuthFormState = {
  error?: AuthFailure | "invalid_input";
  fieldErrors?: Partial<Record<"name" | "email" | "password", true>>;
  /** Echoed back so the form keeps what the user typed. Never the password. */
  values?: { name?: string; email?: string };
};

// Server actions are public HTTP endpoints: every argument is untrusted,
// including the locale bound by our own components.
const safeLocale = (locale: string) => (isLocale(locale) ? locale : DEFAULT_LOCALE);

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function fieldErrorsOf(issues: readonly { path: PropertyKey[] }[]): AuthFormState["fieldErrors"] {
  const fields: NonNullable<AuthFormState["fieldErrors"]> = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (field === "name" || field === "email" || field === "password") fields[field] = true;
  }
  return fields;
}

export async function signUpAction(
  locale: string,
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = { name: text(formData, "name"), email: text(formData, "email") };
  const parsed = signUpSchema.safeParse({ ...values, password: text(formData, "password") });
  if (!parsed.success) {
    return { error: "invalid_input", fieldErrors: fieldErrorsOf(parsed.error.issues), values };
  }
  const result = await signUp(parsed.data);
  if (!result.ok) return { error: result.error, values };
  redirect(`/${safeLocale(locale)}/account`);
}

export async function signInAction(
  locale: string,
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = { email: text(formData, "email") };
  const parsed = signInSchema.safeParse({ ...values, password: text(formData, "password") });
  // Do not reveal which field was wrong on sign-in.
  if (!parsed.success) return { error: "invalid_credentials", values };
  const result = await signIn(parsed.data);
  if (!result.ok) return { error: result.error, values };
  redirect(`/${safeLocale(locale)}/account`);
}

export async function signOutAction(locale: string): Promise<void> {
  await signOut();
  redirect(`/${safeLocale(locale)}`);
}
