# 0006. CSP di base senza nonce

**Contesto.** Una Content Security Policy severa richiede un nonce diverso a ogni richiesta. In Next.js questo obbliga a renderizzare ogni pagina a ogni richiesta, rinunciando al prerendering.

**Decisione.** Per l'MVP si usa una policy statica che limita le origini a `'self'`, vieta l'inclusione in frame e i plugin, ma consente script e stili in linea.

**Conseguenze.** La policy blocca il caricamento di script da altri domini, ma non un eventuale script in linea iniettato. La difesa principale contro l'iniezione resta l'escape automatico di React e il divieto di rendere HTML fornito dagli utenti. La CSP con nonce è in roadmap, da valutare insieme al suo costo sulle prestazioni.
