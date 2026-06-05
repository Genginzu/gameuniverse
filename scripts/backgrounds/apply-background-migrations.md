# Instructions pour appliquer les migrations de background

## Étapes à suivre :

1. **Appliquer les migrations Supabase :**

   ```bash
   # Si vous utilisez Supabase CLI
   supabase db push

   # Ou si vous utilisez l'interface web Supabase
   # Copiez et exécutez le contenu des fichiers de migration dans l'éditeur SQL
   ```

2. **Migrations à appliquer dans l'ordre :**
   - `20240108000001_add_background_customization.sql` (ajoute background_color
     TEXT et background_image_url TEXT)
   - `20240109000001_add_background_color_to_games.sql` (modifie
     background_color en VARCHAR(7) et ajoute des valeurs par défaut)

3. **Après application des migrations, mettre à jour le code :**

   Dans `src/app/api/games/[slug]/route.ts`, remplacer :

   ```typescript
   // Dans la requête SELECT, ajouter :
   background_image_url,
   background_color,

   // Dans la section media :
   backgroundImage: game.background_image_url,

   // Dans transformedGame :
   backgroundColor: game.background_color,
   ```

4. **Vérifier que tout fonctionne :**
   ```bash
   npm run type-check
   # ou
   yarn type-check
   ```

## Résumé des changements

- ✅ Correction des types TypeScript pour correspondre aux types Supabase réels
- ✅ Ajout des interfaces appropriées pour les données de jeu
- ✅ Gestion des valeurs null/undefined dans les mappings
- ✅ Résolution des conflits entre migrations
- 🔄 En attente : Application des migrations pour activer background_color et
  background_image_url
