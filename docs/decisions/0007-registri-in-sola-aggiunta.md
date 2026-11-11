# 0007. Registri in sola aggiunta imposti dal database

**Contesto.** La fiducia in una piattaforma d'aste dipende dal fatto che lo storico delle offerte non possa essere riscritto.

**Decisione.** Le tabelle `bids`, `bid_voids` e `audit_log` rifiutano `UPDATE`, `DELETE` e `TRUNCATE` tramite un trigger, con codice di errore dedicato `AP001`. Un'offerta si annulla aggiungendo una riga in `bid_voids`, firmata da un admin.

**Conseguenze.**

- La regola vale per qualunque client del database, non solo per l'applicazione.
- Prezzo corrente e numero di offerte sono copiati sulla riga dell'asta e aggiornati nella stessa transazione dell'offerta.
- Gli utenti con offerte o annunci non si possono cancellare fisicamente: la cancellazione dell'account richiesta dal GDPR andrà realizzata come anonimizzazione. Da progettare prima del lancio.
- Chi possiede il database può comunque disattivare il trigger: l'utente applicativo di produzione non deve avere quel privilegio.
