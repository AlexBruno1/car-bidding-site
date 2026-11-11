import Link from "next/link";
import { Suspense } from "react";
import { can } from "@/modules/identity";
import { getCurrentUser } from "@/modules/identity/server";
import { getDictionary, getLocale } from "@/platform/i18n";
import { signOutAction } from "../(auth)/actions";

/** Static shell: prerendered. Only the user navigation waits for the session. */
export async function SiteHeader() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  return (
    <header className="border-b border-neutral-200">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href={`/${locale}`} className="text-base font-semibold tracking-tight">
          {dict.site.name}
        </Link>
        <Suspense>
          <UserNav />
        </Suspense>
      </div>
    </header>
  );
}

async function UserNav() {
  const [dict, locale, user] = await Promise.all([getDictionary(), getLocale(), getCurrentUser()]);
  const linkClass = "text-sm text-neutral-700 hover:text-neutral-950";

  return (
    <nav className="flex items-center gap-5">
      {user ? (
        <>
          {can(user, "admin:access") && (
            <Link href={`/${locale}/admin`} className={linkClass}>
              {dict.nav.admin}
            </Link>
          )}
          <Link href={`/${locale}/account`} className={linkClass}>
            {dict.nav.account}
          </Link>
          <form action={signOutAction.bind(null, locale)}>
            <button type="submit" className={`${linkClass} cursor-pointer`}>
              {dict.nav.signOut}
            </button>
          </form>
        </>
      ) : (
        <>
          <Link href={`/${locale}/sign-in`} className={linkClass}>
            {dict.nav.signIn}
          </Link>
          <Link
            href={`/${locale}/sign-up`}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
          >
            {dict.nav.signUp}
          </Link>
        </>
      )}
    </nav>
  );
}
