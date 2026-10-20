# Pages légales et informations éditeur

## Description

Pages `/mentions-legales`, `/confidentialite`, `/cookies`, `/cgv`, `/cgu`.
Rendues par `LegalDocument` (`src/components/legal/LegalDocument.tsx`).

## Traductions

Textes dans `src/messages/legal/fr.json` (référence) et `src/messages/legal/en.json`.
Ces fichiers sont séparés des catalogues principaux : lus côté serveur uniquement
(`getLegalTranslator`), ils ne sont pas envoyés au client par `getMessages()`.

Structure : `<page>.content.<bloc>`, l'ordre des clés = l'ordre d'affichage.
Le préfixe de la clé donne le type de bloc :

- `h2_x` / `h3_x` : titre (ancre `#x`, ex `h2_mediation` → `/cgv#mediation`)
- `p_x` : paragraphe
- `ul_x` : objet dont chaque valeur est un élément de liste
- `table_x` : `{ head: {...}, rows: { ligne: {...} } }`

Balises rich text disponibles (`legalRichTags.tsx`) : `<strong>`, liens internes
`<mentions>`, `<privacy>`, `<cookies>`, `<cgv>`, liens externes `<cnil>`, `<odr>`,
et valeurs éditeur en balise vide (`<operator></operator>`, `<email></email>`,
`<siret></siret>`, `<vat></vat>`, `<court></court>`, `<mediatorName></mediatorName>`…).

Ajouter une langue : créer `src/messages/legal/<locale>.json` avec les mêmes clés et
l'enregistrer dans `LOADERS` (`src/lib/legal/legalMessages.ts`).
`src/lib/legal/__tests__/legalMessages.test.ts` vérifie la parité des clés FR/EN et que
chaque message se formate sans balise manquante.

L'identité de l'éditeur est centralisée dans **un seul fichier** :
`src/lib/legal/publisherInfo.ts` (`PUBLISHER_INFO`).
Tant qu'un champ vaut `null`, les pages affichent `[À COMPLÉTER]` / `[TO BE COMPLETED]`.

## Accès

- Liens dans le footer éditorial (`EditorialFooter`) et `LegalFooterLinks` (auth).
- Lien « Médiation de la consommation » → `/cgv#mediation`.

## Renseigner les informations (issue #336)

Éditer `PUBLISHER_INFO` :

| Champ                 | Affiché dans                     | Obligatoire |
| --------------------- | -------------------------------- | ----------- |
| `operatorName`        | Mentions, confidentialité, CGV   | Oui         |
| `address`             | Mentions                         | Oui         |
| `siret`               | Mentions                         | Oui         |
| `vat`                 | Mentions                         | Oui         |
| `email`               | Mentions, confidentialité, CGV   | Oui         |
| `competentCourt`      | CGV (clause B2B)                 | Oui         |
| `mediator`            | CGV § 7                          | Oui         |
| `phone`               | Mentions (ligne masquée si null) | Non         |
| `publicationDirector` | Mentions (défaut : exploitant)   | Non         |

TVA en franchise : `vat: { kind: "franchise" }` (affiche la mention art. 293 B du CGI).
Sinon : `vat: { kind: "number", value: "FR..." }`.

`getMissingLegalFields()` liste les champs obligatoires encore manquants (check avant mise en ligne).

## Hébergeurs

`HOSTING_PROVIDERS` dans le même fichier.
Vérifiés en octobre 2026 :

- Vercel Inc. — 440 N Barranca Avenue #4133, Covina, CA 91723 (politique de confidentialité Vercel).
- Supabase Pte. Ltd. — projet prod `vilgzbeifmimflyttwhr`, région West Europe (Londres).
  Le Royaume-Uni bénéficie d'une décision d'adéquation UE (renouvelée le 19/12/2025, jusqu'en 2031).

## Restant à faire hors code

- Immatriculer la micro-entreprise avant tout encaissement Stripe.
- Adhérer à un médiateur de la consommation agréé, puis renseigner `mediator`.
- Brancher pixel publicitaire / chat sur la catégorie de consentement `marketing` avant activation.
- Vérifier les droits sur les visuels (IGDB, Google CSE) et l'authenticité des avis.
- Relecture par un avocat avant mise en ligne.
