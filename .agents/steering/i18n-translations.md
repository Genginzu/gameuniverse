---
inclusion: always
---

# Internationalisation (i18n) : Français & Anglais

## Langues disponibles

Le site supporte deux langues :

- **Français (`fr`)** — langue principale et `defaultLocale`
- **Anglais (`en`)**

Configuration : `src/i18n/routing.ts`, bibliothèque `next-intl`.

## Fichiers de traduction

Les traductions sont dans `src/messages/` :

```
src/messages/
├── fr.json   # Français (référence)
└── en.json   # Anglais
```

## Règles obligatoires

- ✅ Toute chaîne de texte visible par l'utilisateur **doit** être traduite via
  `next-intl` (`useTranslations`, `getTranslations`).
- ✅ Lors de l'ajout de nouvelles clés, les ajouter dans **les deux fichiers**
  (`fr.json` et `en.json`) simultanément.
- ✅ Le fichier `fr.json` est la référence. Toute nouvelle clé commence par le
  français, puis est traduite en anglais.
- ✅ Utiliser des namespaces cohérents dans les fichiers JSON (ex :
  `"games": { ... }`, `"admin": { ... }`).
- ✅ Dans les specs, chaque tâche impliquant du texte UI doit inclure la mise en
  place des traductions FR et EN.

## Patterns d'utilisation

### Composants client

```tsx
import { useTranslations } from "next-intl";

const t = useTranslations("namespace");
// Utiliser t("key") dans le JSX
```

### Composants serveur / pages

```tsx
import { getTranslations } from "next-intl/server";

const t = await getTranslations("namespace");
```

## Interdictions

- ❌ Ne **jamais** écrire de texte en dur dans le JSX (pas de chaînes littérales
  visibles par l'utilisateur).
- ❌ Ne **jamais** ajouter une clé dans un seul fichier de langue. Toujours les
  deux.
- ❌ Ne **jamais** utiliser `fr.json` comme seule source sans équivalent dans
  `en.json`.

## Specs et tâches

Lors de la rédaction de specs (`requirements.md`, `design.md`, `tasks.md`),
**toujours** prévoir une étape de traduction :

- Identifier les nouvelles clés i18n nécessaires
- Ajouter les traductions FR et EN dans les tâches d'implémentation
- Vérifier que les deux fichiers restent synchronisés
