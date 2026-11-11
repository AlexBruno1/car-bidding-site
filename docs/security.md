# Sicurezza

Stato alla fine della fase 1. Questo documento va aggiornato a ogni fase.

## Cosa c'è oggi

| Area                | Misura                                                                                           | Dove                                   |
| ------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------- |
| Password            | Hash gestito da Better Auth, minimo 10 caratteri                                                 | `modules/identity/auth.ts`             |
| Sessioni            | Cookie `HttpOnly`, `SameSite=Lax`, `Secure` in produzione. Sessioni nel database, revocabili.    | `modules/identity/auth.ts`             |
| Ruoli               | Il ruolo non è mai accettato dall'input. Si diventa admin solo con `pnpm db:seed`.               | test `auth.test.ts`                    |
| Autorizzazione      | Regole centralizzate, controllate sul server                                                     | `identity/domain/permissions.ts`       |
| Enumerazione utenti | Login: stesso errore per email inesistente e password errata. Registrazione: messaggio generico. | `app/[lang]/(auth)/actions.ts`         |
| Limiti di frequenza | Su login e registrazione, salvati nel database. Attivi solo in produzione.                       | `modules/identity/auth.ts`             |
| Input               | Validato con Zod all'ingresso. Query sempre parametrizzate dall'ORM.                             | `identity/domain/credentials.ts`       |
| Integrità           | Offerte e registro delle azioni in sola aggiunta, imposto dal database                           | `drizzle/0001_append_only_ledgers.sql` |
| Header              | CSP, HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`                 | `next.config.ts`                       |
| Segreti             | In `.env`, escluso da git. Validati all'avvio.                                                   | `platform/env.ts`                      |
| Dipendenze          | `pnpm audit` in CI: blocca su vulnerabilità gravi                                                | `.github/workflows/ci.yml`             |

## Limiti noti

- **Verifica email**: non ancora attiva. Arriva nella fase 4 con l'invio delle email. Fino ad allora chiunque può registrarsi con un indirizzo non suo.
- **Recupero password e autenticazione a due fattori**: non ancora presenti (fase 4). La seconda sarà obbligatoria per gli admin.
- **CSP**: la policy attuale consente gli script in linea (`'unsafe-inline'`), perché quella più severa basata su nonce impedirebbe il prerendering delle pagine. Vedi [decisione 0006](decisions/0006-csp-senza-nonce.md).
- **Limiti di frequenza dietro un proxy**: dipendono dall'indirizzo IP del client. In produzione va configurato quale header del proxy è affidabile, altrimenti il limite è aggirabile o colpisce tutti insieme.
- **Pagine protette**: per un visitatore non autenticato rispondono con stato 200 e reindirizzano dal browser, perché la parte statica della pagina è già stata inviata. Nessun dato protetto viene trasmesso, ma lo stato HTTP non è 401.
- **`pnpm audit`**: segnala una vulnerabilità di gravità moderata in `esbuild`, dipendenza indiretta di `drizzle-kit`. Riguarda solo un server di sviluppo che questo progetto non usa.

## Prima di far girare soldi veri

- Penetration test esterno.
- Verifica dell'identità degli offerenti.
- Revisione legale: GDPR (informativa, basi giuridiche, conservazione dei dati), norme sulle aste online, diritto di recesso, IVA sulle commissioni.
- Backup del database con ripristino provato.
- Monitoraggio degli errori e allarmi.
