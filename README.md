# Car Bidding

Piattaforma di aste online per auto da appassionati, classiche e moderne. Parte dal mercato italiano ed è predisposta per l'Europa (lingue, valute e regole per paese sono configurazione).

> Il nome "Car Bidding" è un segnaposto: si cambia in `src/platform/i18n/dictionaries/`.

**Stato: fase 1 di 5 completata** (fondamenta). Vedi [docs/roadmap.md](docs/roadmap.md).

## Avvio rapido

Servono Node.js 22+, [pnpm](https://pnpm.io) e Docker.

```bash
pnpm install
pnpm bootstrap      # crea .env con un segreto generato, avvia PostgreSQL, applica le migrazioni
pnpm dev        # http://localhost:3000
```

Per creare il primo amministratore, imposta `ADMIN_EMAIL` e `ADMIN_PASSWORD` in `.env` e lancia `pnpm db:seed`. Non esiste un'interfaccia per diventare admin: è voluto.

## Comandi

| Comando                         | Cosa fa                                                           |
| ------------------------------- | ----------------------------------------------------------------- |
| `pnpm dev`                      | Server di sviluppo                                                |
| `pnpm check`                    | Lint, controllo dei tipi e test: da lanciare prima di ogni commit |
| `pnpm test` / `pnpm test:watch` | Test (unitari e di integrazione, senza Docker)                    |
| `pnpm lint`                     | ESLint, incluse le regole di architettura                         |
| `pnpm typecheck`                | Controllo dei tipi TypeScript                                     |
| `pnpm format`                   | Formatta il codice con Prettier                                   |
| `pnpm build` / `pnpm start`     | Build e server di produzione                                      |
| `pnpm db:up` / `pnpm db:down`   | Avvia o ferma il PostgreSQL locale                                |
| `pnpm db:generate`              | Genera una migrazione dopo una modifica allo schema               |
| `pnpm db:migrate`               | Applica le migrazioni                                             |
| `pnpm db:seed`                  | Crea o promuove l'amministratore                                  |

## Struttura

```
src/
  app/        Presentazione e ingresso: pagine, componenti, server action, route API
  modules/    Il prodotto, una cartella per funzionalità
    identity/   utenti, sessioni, ruoli, permessi
    listings/   proposte dei venditori e loro revisione
    auctions/   aste e offerte
    community/  commenti e watchlist
    audit/      registro delle azioni sensibili
  platform/   Infrastruttura condivisa: database, ambiente, eventi, lingue
  shared/     Tipi di base senza dipendenze: denaro, risultati, contratto degli eventi
drizzle/      Migrazioni SQL
tests/        Test di integrazione su un PostgreSQL vero in-process
scripts/      Setup, migrazioni, seed
docs/         Architettura, decisioni, roadmap
```

Le regole su chi può importare cosa sono spiegate in [docs/architecture.md](docs/architecture.md) e verificate da `pnpm lint`.

## Documentazione

- [Architettura](docs/architecture.md): livelli, moduli, regole di dipendenza, come aggiungere una funzionalità
- [Sicurezza](docs/security.md): cosa è protetto oggi, cosa manca, cosa verificare prima del lancio
- [Decisioni](docs/decisions/): il perché delle scelte non ovvie
- [Roadmap](docs/roadmap.md): fasi dell'MVP e cosa resta fuori

## Stack

Next.js 16 (App Router) e React 19, TypeScript, PostgreSQL con Drizzle ORM, Better Auth, Tailwind CSS 4, Zod, Vitest. Codice e commenti sono in inglese, la documentazione in italiano.
