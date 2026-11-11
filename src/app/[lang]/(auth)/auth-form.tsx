"use client";

import { useActionState } from "react";
import type { AuthFormState } from "./actions";

type Field = {
  name: "name" | "email" | "password";
  label: string;
  type: "text" | "email" | "password";
  autoComplete: string;
  hint?: string;
  error: string;
};

type Props = {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  fields: Field[];
  submitLabel: string;
  pendingLabel: string;
  errorMessages: Record<NonNullable<AuthFormState["error"]>, string>;
};

/** Presentation only: all text comes in as props, all logic lives in the action. */
export function AuthForm({ action, fields, submitLabel, pendingLabel, errorMessages }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="mt-6 space-y-4" noValidate>
      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {errorMessages[state.error]}
        </p>
      )}
      {fields.map((field) => {
        const invalid = state.fieldErrors?.[field.name] === true;
        const describedBy = invalid
          ? `${field.name}-error`
          : field.hint
            ? `${field.name}-hint`
            : undefined;
        return (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-sm font-medium">
              {field.label}
            </label>
            <input
              id={field.name}
              name={field.name}
              type={field.type}
              autoComplete={field.autoComplete}
              required
              defaultValue={field.name === "password" ? undefined : state.values?.[field.name]}
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 aria-[invalid]:border-red-600"
            />
            {invalid ? (
              <p id={`${field.name}-error`} className="mt-1 text-sm text-red-700">
                {field.error}
              </p>
            ) : (
              field.hint && (
                <p id={`${field.name}-hint`} className="mt-1 text-sm text-neutral-500">
                  {field.hint}
                </p>
              )
            )}
          </div>
        );
      })}
      <button
        type="submit"
        disabled={pending}
        className="w-full cursor-pointer rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-default disabled:opacity-60"
      >
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}
