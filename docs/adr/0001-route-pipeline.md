# Un pipeline de route déclaratif, ordre fixe et forme d'erreur unique

Les routes API refaisaient chacune leur prologue (auth, rôle admin, suspension,
rate limit, parsing, conversion d'erreurs), avec des statuts et corps
divergents. Elles déclarent désormais ce prologue via `defineRoute`
(`src/lib/api/route/`), qui l'exécute dans un ordre fixe : identité → rôle →
suspension → rate limit → params / query / body → handler. Tout refus a la forme
`{ error, code, details? }`, et le client se fonde sur `code`, pas sur le
message.

## Considered Options

- **Prologue impératif** (`const ctx = await prologue(...)` puis
  `if (ctx instanceof Response) return ctx`) : rejeté. Chaque route garde un
  branchement et peut réordonner les étapes, ce qui ramène la divergence.
- **Handler renvoyant des données brutes** : rejeté. Les statuts 201, les
  en-têtes et le streaming NDJSON devraient alors être décrits dans la config.

## Consequences

- La suspension passe avant le rate limit : un compte suspendu refusé ne
  consomme pas son quota. Le rate limit passe avant la lecture du body : un
  spam malformé est décompté.
- Un appelant déconnecté reçoit 401 (et non 403) sur les routes admin.
- La seam d'I/O (`RouteEnvironment` : identité, suspension, rate limit) a deux
  adapters, Supabase et en mémoire (`src/test-helpers/route-environment.ts`).
  Le client de données reste hors de cette seam.
- Les messages `error` restent en anglais et ne sont pas traduits ; l'i18n se
  fait côté client à partir de `code`.
