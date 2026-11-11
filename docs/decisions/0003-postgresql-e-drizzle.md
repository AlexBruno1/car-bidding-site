# 0003. PostgreSQL con Drizzle, PGlite nei test

**Contesto.** Le offerte richiedono transazioni, blocchi di riga e vincoli forti.

**Decisione.** PostgreSQL come unico archivio dati. Drizzle come ORM: lo schema è TypeScript, le query restano vicine all'SQL e le migrazioni sono file SQL leggibili. I test di integrazione girano su PGlite, cioè PostgreSQL compilato in WebAssembly, con le migrazioni reali.

**Conseguenze.**

- I test non richiedono Docker e ogni file parte da un database pulito.
- Il codice riceve un tipo `Database` indipendente dal driver, così la stessa funzione gira in produzione e nei test.
- PGlite esegue una connessione sola. I test di concorrenza sulle offerte (fase 2) dovranno girare anche contro un PostgreSQL vero in CI.
