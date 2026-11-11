# 0002. Confini tra moduli verificati dal lint

**Contesto.** In un monolite i confini tra moduli si degradano se dipendono solo dalla disciplina.

**Decisione.** Le regole di dipendenza sono regole ESLint (`no-restricted-imports`) in `eslint.config.mjs`. Una violazione fa fallire `pnpm lint` e la CI.

**Alternative scartate.** Plugin dedicati ai confini architetturali: più espressivi, ma sono una dipendenza in più con una configurazione propria. La regola nativa copre i casi che servono ed è leggibile da chiunque.

**Conseguenze.** I moduli hanno due punti di ingresso (`index.ts` puro e `server.ts`), perché un solo file mescolerebbe codice per il browser e codice solo server. All'interno di un modulo si usano import relativi.
