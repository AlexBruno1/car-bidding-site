# 0001. Monolite modulare su Next.js

**Contesto.** Serve un MVP sviluppabile da una persona, su cui iterare, con buona separazione tra le parti.

**Decisione.** Un'unica applicazione Next.js con frontend e backend, organizzata in moduli per funzionalità. Ogni modulo ha un dominio in TypeScript puro, un livello dati e una API pubblica. Non si adotta un MVC classico: Next.js non ha controller né modelli propri, e i livelli descritti in `docs/architecture.md` danno la stessa separazione senza andare contro il framework.

**Alternative scartate.** Backend separato (per esempio NestJS): più struttura, ma due applicazioni da sviluppare e pubblicare. Microservizi: costo operativo senza beneficio a questo volume.

**Conseguenze.** Un solo deploy e tipi condivisi da un capo all'altro. Il dominio non dipende dal framework, quindi un modulo si può estrarre in un servizio in seguito.
