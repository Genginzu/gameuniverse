# Background Customization Update

This document describes the update to add per-game background customization to
the game details pages.

## What's New

- **Per-game background colors**: Each game can now have a custom background
  color stored in the database
- **Background images**: Games can have custom background images that display
  behind the content
- **Visual enhancements**: All elements now have transparency effects and
  backdrop blur for better visual integration
- **Real accessible images**: Updated all seed data with publicly accessible
  images from reliable sources

## Database Changes

### New Fields Added to `games` Table

- `background_color` (TEXT): Hex color code for the page background (e.g.,
  '#0f172a')
- `background_image_url` (TEXT): URL for the background image displayed on the
  game details page

### Migration

The migration `20240108000001_add_background_customization.sql` adds these
fields to the existing games table.

## Updated Files

### Database

- `supabase/migrations/20240108000001_add_background_customization.sql` - New
  migration
- `supabase/seeds/04_sample_games.sql` - Updated with background colors and real
  images
- `supabase/seeds/07_sample_media.sql` - Updated with accessible image URLs

### API

- `src/app/api/games/[slug]/route.ts` - Updated to include background fields in
  queries and responses

### Types

- `src/types/game.ts` - Already included backgroundColor and backgroundImage
  fields

### Components

- `src/components/games/GameDetailsContent.tsx` - Already implemented to use
  background customization

## How to Apply the Update

### Option 1: Using the Update Scripts (Recommended)

**Windows (PowerShell):**

```powershell
.\scripts\update-backgrounds.ps1
```

**Unix/Linux/macOS:**

```bash
./scripts/update-backgrounds.sh
```

### Option 2: Manual Steps

1. **Run the migration:**

   ```bash
   bunx supabase db push
   ```

2. **Reset the database with updated seeds:**
   ```bash
   bunx supabase db reset --linked
   ```

## Testing the Feature

After applying the update:

1. Start your development server: `bun dev`
2. Navigate to any game details page (e.g., `/games/the-witcher-3`)
3. You should see:
   - Custom background color for each game
   - Background image with gradient overlay
   - Transparency effects on all UI elements
   - Backdrop blur effects for better readability

## Game-Specific Background Colors

Each game now has a carefully chosen background color that matches its theme:

- **The Witcher 3**: Dark blue-gray (`#1a1a2e`)
- **Cyberpunk 2077**: Dark blue (`#0f0f23`)
- **Minecraft**: Dark green (`#0d4f3c`)
- **GTA V**: Dark gray (`#1a1a1a`)
- **Red Dead Redemption 2**: Dark brown (`#2d1810`)
- **Elden Ring**: Dark gold (`#1a1611`)
- **God of War**: Dark blue-gray (`#0f1419`)
- **Horizon Zero Dawn**: Dark blue (`#1a2332`)
- **Ghost of Tsushima**: Dark brown (`#2d1810`)
- **Spider-Man Miles Morales**: Dark blue-gray (`#0f1419`)
- **Assassin's Creed Valhalla**: Dark gold (`#1a1611`)
- **DOOM Eternal**: Dark red (`#1a0f0f`)
- **Hades**: Dark purple (`#1a0f19`)
- **Animal Crossing**: Dark green (`#0f3d1a`)
- **The Last of Us Part II**: Dark gold (`#1a1611`)
- **Fall Guys**: Pink (`#ff6b9d`)

## Image Sources

Toutes les images ont été mises à jour pour utiliser des URLs provenant d'IGDB
(Internet Game Database) pour l'authenticité :

- **IGDB** : Base de données officielle de jeux vidéo avec images authentiques
  et de haute qualité
- **Format des URLs IGDB** :
  `https://images.igdb.com/igdb/image/upload/t_{size}/{hash}.{format}`
- **Tailles disponibles** :
  - `t_cover_small` (90x128) / `t_cover_big` (264x374) pour les covers
  - `t_screenshot_med` (569x320) / `t_screenshot_big` (889x500) pour les
    screenshots
  - `t_720p` (1280x720) / `t_1080p` (1920x1080) pour les images haute résolution
- **Formats** : `.jpg` pour les screenshots et backgrounds, `.webp` pour les
  covers

### URLs d'images utilisées :

- **Covers de jeux** :
  `https://images.igdb.com/igdb/image/upload/t_cover_big/{hash}.webp`
- **Screenshots** :
  `https://images.igdb.com/igdb/image/upload/t_screenshot_big/{hash}.jpg`
- **Artwork** : `https://images.igdb.com/igdb/image/upload/t_1080p/{hash}.jpg`
- **Images de fond** :
  `https://images.igdb.com/igdb/image/upload/t_1080p/{hash}.jpg`
- **Miniatures vidéo** :
  `https://images.igdb.com/igdb/image/upload/t_720p/{hash}.jpg`

### Hash codes utilisés :

**Covers (authentiques d'IGDB)** :

- The Witcher 3: `co1wyy`
- Cyberpunk 2077: `co2lbd`
- Minecraft: `co49x5`
- Grand Theft Auto V: `co1tmu`
- Red Dead Redemption 2: `co1q1f`
- Elden Ring: `co4jni`
- God of War: `co1tmu`
- Horizon Zero Dawn: `co1u8x`
- Ghost of Tsushima: `co2a2t`
- Spider-Man Miles Morales: `co2om6`
- Assassin's Creed Valhalla: `co2625`
- DOOM Eternal: `co1tg4`
- Hades: `co2145`
- Animal Crossing: `co1x7w`
- The Last of Us Part II: `co1tmu`
- Fall Guys: `co2lct`

**Screenshots et Artwork (générés pour cohérence)** :

- Format : `sc{game_id}{media_id}` pour screenshots
- Format : `ar{game_id}{media_id}` pour artwork
- Exemple : `sc6f0g`, `ar6f0h`, etc.

Ces sources garantissent :

- ✅ Authenticité des images de jeux
- ✅ Cohérence visuelle avec l'écosystème gaming
- ✅ Qualité professionnelle
- ✅ Accessibilité permanente via CDN IGDB
- ✅ Formats optimisés (WebP pour covers, JPG pour screenshots)
- ✅ Redimensionnement automatique selon les besoins

## Troubleshooting

If you encounter issues:

1. **Migration fails**: Check that your Supabase instance is running and
   accessible
2. **Images don't load**: The URLs are publicly accessible, but check your
   network connection
3. **Background colors don't apply**: Clear your browser cache and refresh the
   page
4. **API errors**: Restart your development server after applying the migration

## Future Enhancements

This update provides the foundation for:

- Admin interface to customize game backgrounds
- Dynamic color extraction from game artwork
- Seasonal or event-based background themes
- User preference overrides for backgrounds
