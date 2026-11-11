# Roadmap

## MVP

| Fase                       | Contenuto                                                                                                                                      | Stato   |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1. Fondamenta              | Struttura a moduli, schema dati, autenticazione e ruoli, lingue, ambiente locale, CI                                                           | Fatto   |
| 2. Motore d'asta           | Offerte in transazione, incremento minimo, anti-sniping, riserva, chiusura automatica. Test prima del codice, inclusi quelli di concorrenza.   | Da fare |
| 3. Interfaccia             | Homepage con le aste, scheda asta con offerte in tempo reale, flusso di vendita con caricamento foto, area personale                           | Da fare |
| 4. Admin, pagamenti, email | Coda di revisione delle proposte, moderazione, Stripe (carta verificata e commissione), email transazionali, verifica email, 2FA per gli admin | Da fare |
| 5. Verifica                | Test end-to-end di un'asta completa, dalla proposta all'aggiudicazione                                                                         | Da fare |

## Dopo l'MVP

- Verifica dell'identità degli offerenti
- Penetration test esterno
- CSP severa basata su nonce
- Altre lingue e valute, regole fiscali per paese
- Offerta massima automatica (proxy bidding)
- Ispezioni e report sulla vettura, servizi di trasporto
- Ricerca avanzata e avvisi salvati
- App mobile, sulla stessa logica di dominio
- Bus degli eventi su più istanze

## Da decidere con un professionista

- Inquadramento legale delle aste online in Italia e condizioni di vendita
- Diritto di recesso tra privati e tra professionista e consumatore
- IVA sulle commissioni e fatturazione
- Passaggio di proprietà e gestione dei documenti
- Informativa privacy e conservazione dei dati
