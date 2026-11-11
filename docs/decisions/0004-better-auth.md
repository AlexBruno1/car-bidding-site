# 0004. Better Auth per l'autenticazione

**Contesto.** L'autenticazione non si scrive a mano. Serve una libreria che tenga gli utenti nel nostro database.

**Decisione.** Better Auth con email e password, sessioni nel database e adattatore Drizzle. Le tabelle sono definite nel nostro schema (`identity/data/schema.ts`), con i nomi di colonna scelti da noi.

**Alternative scartate.** Servizi esterni di autenticazione: i dati degli utenti starebbero fuori dall'UE o comunque presso terzi, con un costo per utente.

**Conseguenze.**

- La libreria è usata solo dentro il modulo `identity`. Il resto dell'app vede `getCurrentUser`, `requirePermission`, `signIn`, `signUp`, `signOut`: sostituirla tocca un solo modulo.
- `createAuth` riceve le dipendenze come parametri, quindi i test eseguono i flussi veri su un database in-process.
- Verifica email, recupero password e due fattori sono funzioni della libreria da attivare nella fase 4.
