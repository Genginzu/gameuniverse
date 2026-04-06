# Checklist de Déploiement - Game Universe

## Avant le déploiement

### 1. Base de données (Supabase)

- [ ] Vérifier que toutes les migrations sont appliquées

  ```bash
  supabase db push
  ```

- [ ] Vérifier que la table `user_library` existe

  ```sql
  SELECT * FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'user_library';
  ```

- [ ] Vérifier que les fonctions de base de données existent

  ```sql
  SELECT routine_name FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name IN ('get_user_library_stats', 'is_game_in_user_library');
  ```

- [ ] Vérifier les politiques RLS
  ```sql
  SELECT * FROM pg_policies WHERE tablename = 'user_library';
  ```

### 2. Variables d'environnement

- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurée
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurée
- [ ] `RESEND_API_KEY` configurée (pour les emails)
- [ ] Toutes les variables sont définies dans Vercel

### 3. Build et Tests

- [ ] Le build passe sans erreur

  ```bash
  bun run build
  ```

- [ ] Les tests passent

  ```bash
  bun test --run
  ```

- [ ] Pas d'erreurs TypeScript
  ```bash
  bun run type-check
  ```

### 4. Fonctionnalités à tester

- [ ] Authentification (inscription, connexion, déconnexion)
- [ ] Page d'accueil (landing page)
- [ ] Page des jeux (`/games`)
  - [ ] Recherche de jeux
  - [ ] Filtres par genre
  - [ ] Pagination
  - [ ] Pas de rechargement infini
- [ ] Page de détails d'un jeu (`/games/[slug]`)
- [ ] Page bibliothèque (`/library`)
  - [ ] Affichage des statistiques
  - [ ] Liste des jeux de l'utilisateur
- [ ] Bouton "Ajouter à ma bibliothèque"
  - [ ] Fonctionne correctement
  - [ ] Gère les erreurs gracieusement si la migration n'est pas appliquée
- [ ] Internationalisation (FR/EN)

## Déploiement sur Vercel

### 1. Configuration Vercel

```bash
# Se connecter à Vercel
vercel login

# Lier le projet
vercel link

# Configurer les variables d'environnement
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add RESEND_API_KEY
```

### 2. Déploiement

```bash
# Déploiement en production
vercel --prod
```

### 3. Vérifications post-déploiement

- [ ] Le site est accessible
- [ ] Les pages se chargent correctement
- [ ] L'authentification fonctionne
- [ ] Les jeux s'affichent
- [ ] La recherche fonctionne
- [ ] Les filtres fonctionnent
- [ ] La bibliothèque utilisateur fonctionne (si migration appliquée)
- [ ] Pas d'erreurs dans la console du navigateur
- [ ] Pas d'erreurs dans les logs Vercel

## En cas de problème

### Migration non appliquée

Si la table `user_library` n'existe pas :

1. L'application fonctionne normalement
2. Les boutons "Ajouter à ma bibliothèque" ne causent pas d'erreur
3. La page `/library` affiche un état vide
4. Appliquer la migration dès que possible

### Erreurs de build

```bash
# Nettoyer le cache
rm -rf .next
rm -rf node_modules
bun install
bun run build
```

### Erreurs de connexion Supabase

1. Vérifier les variables d'environnement
2. Vérifier que l'URL Supabase est correcte
3. Vérifier que la clé anon est valide
4. Vérifier les politiques RLS

## Rollback

En cas de problème critique :

```bash
# Revenir à la version précédente
vercel rollback
```

## Monitoring

- [ ] Configurer les alertes Vercel
- [ ] Surveiller les logs d'erreur
- [ ] Surveiller les performances
- [ ] Surveiller l'utilisation de la base de données

## Documentation

- [ ] README.md à jour
- [ ] Documentation de la fonctionnalité bibliothèque
      (`docs/LIBRARY_FEATURE_SETUP.md`)
- [ ] Changelog mis à jour
