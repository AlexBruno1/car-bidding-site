# Architettura

Un monolite modulare: un'unica applicazione Next.js, divisa in moduli con confini verificati in automatico. L'obiettivo è poter cambiare o estrarre un pezzo senza toccare gli altri.

## Livelli

```
app  ──▶  modules  ──▶  shared
 │           │
 └────▶  platform  ──▶  shared
```

| Livello                  | Cartella             | Responsabilità                                                                                       | Non può                                             |
| ------------------------ | -------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Presentazione e ingresso | `src/app`            | Pagine, componenti, server action, route API. Valida l'input, controlla i permessi, chiama i moduli. | Accedere al database. Contenere regole di business. |
| Moduli                   | `src/modules/<nome>` | Il prodotto. Ogni modulo ha dominio, dati e una API pubblica.                                        | Entrare nei file interni di un altro modulo.        |
| Piattaforma              | `src/platform`       | Database, variabili d'ambiente, bus degli eventi, lingue.                                            | Contenere regole di business.                       |
| Condiviso                | `src/shared`         | Tipi di base: `Money`, `Result`, contratto degli eventi.                                             | Importare qualsiasi altra cosa del progetto.        |

## Anatomia di un modulo

```
modules/identity/
  index.ts        API pubblica pura: tipi e funzioni di dominio. Importabile ovunque, anche dal browser.
  server.ts       API pubblica lato server: funzioni che leggono la richiesta o il database.
  domain/         Regole di business in TypeScript puro. Niente Next.js, niente database, niente I/O.
  data/schema.ts  Le tabelle di cui il modulo è proprietario.
  auth.ts, ...    Dettagli interni: invisibili dall'esterno.
```

Dall'esterno un modulo si importa solo come `@/modules/<nome>` o `@/modules/<nome>/server`. All'interno si usano import relativi.

Il dominio è separato perché è la parte che non può sbagliare: essendo codice puro, si testa in millisecondi e non dipende dal framework. Se un giorno il motore d'asta dovrà diventare un servizio a parte, si sposta senza riscriverlo.

## Regole di dipendenza

Sono in `eslint.config.mjs` e fanno fallire `pnpm lint` e la CI:

1. Nessun import nei file interni di un altro modulo.
2. `src/app` non importa il database né l'ORM.
3. Il codice in `domain/` e `shared/` non importa Next.js, React, l'ORM, la libreria di autenticazione, la piattaforma o il livello dati.
4. Unica eccezione: i file `data/schema.ts` possono importare lo schema di altri moduli (servono per le chiavi esterne) e `platform/db/schema.ts` li riunisce.

Se una regola dà fastidio, quasi sempre è la direzione della dipendenza a essere sbagliata, non la regola.

## Comunicazione tra moduli

- **Chiamata diretta** alla API pubblica, quando un modulo ha bisogno di una risposta (per esempio `can(...)` di `identity`).
- **Eventi**, quando un modulo deve solo far sapere che qualcosa è successo. Chi pubblica non conosce chi ascolta. Il contratto è in `src/shared/events.ts`, il bus in `src/platform/events`.

Il bus oggi è in memoria e vale per un solo processo. Sta dietro un'interfaccia: con più istanze si sostituisce l'implementazione (LISTEN/NOTIFY di PostgreSQL o Redis) senza toccare i moduli.

## Dati

- **Ogni tabella ha un modulo proprietario.** Solo quel modulo la legge e la scrive. Gli altri passano dalla sua API.
- **Denaro**: sempre interi in centesimi più la valuta (`bigint` nel database, tipo `Money` nel codice). Mai numeri decimali.
- **Registri in sola aggiunta**: `bids`, `bid_voids` e `audit_log` non si possono modificare né cancellare. Lo impone un trigger nel database (`drizzle/0001_append_only_ledgers.sql`), quindi vale anche per script e strumenti esterni. Un'offerta si annulla aggiungendo una riga in `bid_voids`.
- **Vincoli nel database**: unicità, intervalli validi e chiavi esterne sono vincoli SQL, non solo controlli applicativi.
- **Prezzo di riserva**: è un dato segreto. Non va mai selezionato in una query il cui risultato arriva al browser.

### Modificare lo schema

1. Modifica `data/schema.ts` del modulo proprietario.
2. `pnpm db:generate` crea il file SQL in `drizzle/`. Leggilo prima di fare commit.
3. `pnpm db:migrate` lo applica.

Le migrazioni già pubblicate non si modificano: se ne aggiunge una nuova.

## Errori

- I fallimenti previsti (input non valido, regola violata) sono valori di ritorno di tipo `Result`, così il chiamante è obbligato a gestirli.
- Le eccezioni sono riservate a bug e guasti dell'infrastruttura.

## Autorizzazione

Tutte le regole sono in un posto: `modules/identity/domain/permissions.ts`. Ogni server action e route API chiama `requirePermission(...)` prima di agire. Nascondere un pulsante nell'interfaccia non è una protezione.

I ruoli sono due, `member` e `admin`. Ogni utente registrato può sia vendere sia offrire: quello che può fare in un dato momento dipende dai permessi, non da altri ruoli.

## Lingue

- La lingua è il primo segmento dell'URL (`/it/...`, `/en/...`). `src/proxy.ts` reindirizza chi arriva senza prefisso.
- I testi stanno in `src/platform/i18n/dictionaries/`. L'italiano è la fonte: un test verifica che le altre lingue abbiano le stesse chiavi.
- Nessun testo visibile all'utente è scritto nei componenti.

Per aggiungere una lingua: aggiungi il codice in `config.ts`, crea il file JSON e registralo in `dictionaries.ts`.

## Rendering

Next.js prerenderizza la parte statica di ogni pagina e trasmette dopo la parte che dipende dalla richiesta (per esempio il menu dell'utente). Due conseguenze pratiche:

- Tutto ciò che legge la sessione o i cookie va dentro `<Suspense>`.
- In una funzione lato server, leggi la richiesta (`headers()`) prima di toccare database o configurazione: è quello che impedisce al codice di girare durante la build.

## Test

| Tipo         | Dove                           | Cosa copre                                                      |
| ------------ | ------------------------------ | --------------------------------------------------------------- |
| Unitari      | accanto al codice, `*.test.ts` | Dominio: permessi, stati, denaro, eventi                        |
| Integrazione | `tests/integration`            | Schema, vincoli, trigger e autenticazione su un PostgreSQL vero |

I test di integrazione usano PGlite, cioè PostgreSQL compilato in WebAssembly: applicano le migrazioni reali, non richiedono Docker e ogni file parte da un database vuoto.

Per il dominio i test si scrivono prima del codice. I test end-to-end nel browser arrivano con l'interfaccia delle aste (fase 3).

## Come aggiungere una funzionalità

Esempio: la watchlist.

1. **Dominio**: in `modules/community/domain/` scrivi le regole e i loro test.
2. **Dati**: la tabella è già in `modules/community/data/schema.ts`. Aggiungi le query in `data/`.
3. **API pubblica**: esporta da `server.ts` le funzioni che servono fuori (per esempio `addToWatchlist`), e da `index.ts` i tipi.
4. **Permessi**: se serve una regola nuova, aggiungila in `identity/domain/permissions.ts` con il suo test.
5. **Ingresso**: crea la server action in `src/app`. Valida l'input con Zod, chiama `requirePermission`, poi il modulo.
6. **Presentazione**: pagina e componenti, con i testi nei dizionari.
7. `pnpm check`.
