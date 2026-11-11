# 0005. Lingue con gli strumenti nativi di Next.js

**Contesto.** Il sito parte in italiano e deve aprirsi ad altri paesi senza riscritture.

**Decisione.** Lingua nel primo segmento dell'URL (`/it`, `/en`), dizionari JSON tipizzati e `next/root-params` per leggere la lingua lato server. Nessuna libreria di internazionalizzazione.

**Conseguenze.**

- Ogni lingua ha URL propri, utili per la SEO.
- Le pagine restano prerenderizzabili.
- I percorsi non sono tradotti (`/it/sign-in`, non `/it/accedi`): si può aggiungere in seguito.
- Mancano plurali e formati complessi. Date e valute usano `Intl`. Se i testi diventano complessi si valuta una libreria, e il cambio resta confinato in `platform/i18n`.
