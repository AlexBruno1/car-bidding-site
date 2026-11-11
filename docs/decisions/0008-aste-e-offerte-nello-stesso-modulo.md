# 0008. Aste e offerte nello stesso modulo

**Contesto.** Il piano iniziale prevedeva due moduli separati, `auctions` e `bids`.

**Decisione.** Un solo modulo `auctions` che contiene anche le offerte.

**Motivo.** Un'offerta non esiste senza la sua asta e ogni offerta modifica l'asta nella stessa transazione (prezzo corrente, scadenza per l'anti-sniping). Due moduli sarebbero stati sempre modificati insieme e avrebbero dovuto condividere la transazione, cioè un confine solo apparente.

**Conseguenze.** Commenti e watchlist, che sono indipendenti dalle regole d'asta, stanno nel modulo `community`.
