# Design Document: Game Library

## Overview

Game Universe est une plateforme web moderne dédiée à la découverte et exploration de jeux vidéo. Cette première version MVP se concentre sur une bibliothèque de jeux complète avec des fonctionnalités de navigation, recherche, filtrage et consultation détaillée.

L'architecture privilégie la simplicité, la performance et l'extensibilité pour permettre l'ajout futur de fonctionnalités sociales et compétitives. La solution utilise une approche API-first avec une séparation claire entre le frontend et le backend.

## Architecture

### Architecture Générale

```mermaid
graph TB
    subgraph "Frontend (Next.js)"
        UI[Interface Utilisateur - shadcn/ui]
        Pages[Pages & API Routes]
        SSR[Server-Side Rendering]
    end

    subgraph "Supabase Backend"
        DB[(PostgreSQL Database)]
        Auth[Supabase Auth]
        Storage[Supabase Storage]
        API[Auto-generated API]
    end

    subgraph "External Services"
        Resend[Resend Email]
        Vercel[Vercel Hosting]
    end

    UI --> Pages
    Pages --> API
    Pages --> Auth
    Pages --> Storage
    Resend --> Auth
    Vercel --> UI
```

### Choix Technologiques

**Frontend:**

- **Runtime:** Bun pour des performances optimales (installation, build, dev)
- **Framework:** Next.js 16 avec App Router pour le SSR et les performances
- **Internationalization:** next-intl pour la gestion des langues (FR par défaut, EN)
- **UI Library:** shadcn/ui pour des composants modernes et accessibles
- **Icons:** react-icons pour une large collection d'icônes (React Icons)
- **Styling:** Tailwind CSS (inclus avec shadcn/ui) pour la rapidité de développement
- **TypeScript:** Pour la robustesse et l'expérience développeur
- **Deployment:** Vercel pour l'hébergement optimisé Next.js

**Backend & Services:**

- **Database:** Supabase PostgreSQL avec migrations et seeds automatisées
- **Authentication:** Supabase Auth pour la gestion des utilisateurs
- **Storage:** Supabase Storage pour les médias (images, vidéos)
- **Email:** Resend pour l'envoi d'emails transactionnels
- **API:** Next.js API Routes + Supabase client pour les opérations personnalisées
- **Internationalization:** Base de données multilingue avec tables de traduction

**Avantages Économiques:**

- **Vercel:** Plan gratuit généreux pour les projets personnels/MVP
- **Supabase:** 500MB de DB + 1GB de storage + 50MB de file uploads gratuits
- **Resend:** 3000 emails/mois gratuits
- **shadcn/ui:** Gratuit et open-source
- **Bun:** Gratuit et open-source, améliore les performances de développement
- **Coût total estimé:** 0€/mois pour un MVP avec trafic modéré

**Avantages de Bun pour ce projet:**

- **Installation 10-25x plus rapide** que npm/yarn
- **Démarrage Next.js accéléré** pour une meilleure expérience développeur
- **TypeScript transpilation ultra-rapide** intégrée
- **Test runner intégré** compatible Jest
- **Bundler intégré** pour optimiser les builds
- **Compatibilité parfaite** avec Next.js 16 et l'écosystème React

## Components and Interfaces

### Frontend Components

#### Core Components (shadcn/ui)

```typescript
// GameLibrary - Composant principal avec shadcn/ui
interface GameLibraryProps {
  games: Game[];
  loading: boolean;
  error?: string;
}

// GameCard - Carte de jeu utilisant Card de shadcn/ui
interface GameCardProps {
  game: GameSummary;
  onClick: (gameId: string) => void;
}

// GameDetails - Page de détails avec shadcn/ui components
interface GameDetailsProps {
  gameId: string;
}

// SearchBar - Utilise Input de shadcn/ui
interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

// FilterPanel - Utilise Checkbox et Select de shadcn/ui
interface FilterPanelProps {
  genres: Genre[];
  selectedGenres: string[];
  onGenreChange: (genres: string[]) => void;
}

// Pagination - Utilise Button de shadcn/ui
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// LandingPage - Page d'accueil pour utilisateurs non connectés
interface LandingPageProps {
  locale: string;
}

// Dashboard - Interface principale pour utilisateurs connectés
interface DashboardProps {
  user: User;
  locale: string;
}

// AuthForm - Formulaires de connexion/inscription
interface AuthFormProps {
  mode: "signin" | "signup";
  onSubmit: (data: AuthData) => void;
  loading?: boolean;
  error?: string;
}

// LanguageSwitcher - Sélecteur de langue
interface LanguageSwitcherProps {
  currentLocale: string;
  onLocaleChange: (locale: string) => void;
}
```

#### Layout Components (Next.js + shadcn/ui)

```typescript
// Header - Navigation avec shadcn/ui
interface HeaderProps {
  title: string;
  searchComponent?: React.ReactNode;
}

// Layout - Structure avec shadcn/ui
interface LayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

// MediaGallery - Galerie avec Dialog et Carousel de shadcn/ui
interface MediaGalleryProps {
  screenshots: string[];
  artwork: string[];
  videos: VideoMedia[];
}
```

### Backend API Interfaces

#### Supabase Database Schema avec Migrations

```sql
-- Migration 001: Tables principales
-- supabase/migrations/20240101000001_initial_schema.sql

-- Table des utilisateurs (étendue de auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  preferred_locale TEXT DEFAULT 'fr',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des langues supportées
CREATE TABLE public.languages (
  code VARCHAR(2) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  native_name VARCHAR(50) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE
);

-- Table principale des jeux
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  developer VARCHAR(255) NOT NULL,
  publisher VARCHAR(255) NOT NULL,
  release_date DATE,
  launch_price DECIMAL(10,2),
  current_price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'EUR',
  metascore INTEGER,
  pegi_rating INTEGER,
  esrb_rating VARCHAR(10),
  system_requirements JSONB,
  media JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des traductions de jeux
CREATE TABLE public.game_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  language_code VARCHAR(2) REFERENCES languages(code),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  UNIQUE(game_id, language_code)
);

-- Table des genres
CREATE TABLE public.genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table des traductions de genres
CREATE TABLE public.genre_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  genre_id UUID REFERENCES genres(id) ON DELETE CASCADE,
  language_code VARCHAR(2) REFERENCES languages(code),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  UNIQUE(genre_id, language_code)
);

-- Table de liaison jeux-genres
CREATE TABLE public.game_genres (
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  genre_id UUID REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, genre_id)
);

-- Index pour les performances
CREATE INDEX idx_games_slug ON games(slug);
CREATE INDEX idx_games_release_date ON games(release_date);
CREATE INDEX idx_game_translations_game_id ON game_translations(game_id);
CREATE INDEX idx_game_translations_language ON game_translations(language_code);
CREATE INDEX idx_genre_translations_genre_id ON genre_translations(genre_id);
CREATE INDEX idx_genre_translations_language ON genre_translations(language_code);
CREATE INDEX idx_game_genres_game_id ON game_genres(game_id);

-- Recherche full-text multilingue
CREATE INDEX idx_game_translations_title_search ON game_translations
  USING gin(to_tsvector('french', title));
CREATE INDEX idx_game_translations_title_search_en ON game_translations
  USING gin(to_tsvector('english', title));
```

```sql
-- Migration 002: RLS et politiques de sécurité
-- supabase/migrations/20240101000002_rls_policies.sql

-- Activation RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE genre_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;

-- Politiques pour lecture publique
CREATE POLICY "Games are viewable by everyone" ON games FOR SELECT USING (true);
CREATE POLICY "Game translations are viewable by everyone" ON game_translations FOR SELECT USING (true);
CREATE POLICY "Genres are viewable by everyone" ON genres FOR SELECT USING (true);
CREATE POLICY "Genre translations are viewable by everyone" ON genre_translations FOR SELECT USING (true);
CREATE POLICY "Game genres are viewable by everyone" ON game_genres FOR SELECT USING (true);
CREATE POLICY "Languages are viewable by everyone" ON languages FOR SELECT USING (true);

-- Politiques pour les profils utilisateurs
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Politiques pour administration (rôle admin requis)
CREATE POLICY "Admins can manage games" ON games FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND email LIKE '%@admin.gamesuniverse.com'
  ));

CREATE POLICY "Admins can manage game translations" ON game_translations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND email LIKE '%@admin.gamesuniverse.com'
  ));
```

```sql
-- Seeds modulaires par table
-- supabase/seeds/01_languages.sql
INSERT INTO languages (code, name, native_name, is_default) VALUES
('fr', 'French', 'Français', true),
('en', 'English', 'English', false);
```

```sql
-- supabase/seeds/02_genres.sql
INSERT INTO genres (id, slug) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'action'),
('550e8400-e29b-41d4-a716-446655440002', 'adventure'),
('550e8400-e29b-41d4-a716-446655440003', 'rpg'),
('550e8400-e29b-41d4-a716-446655440004', 'strategy'),
('550e8400-e29b-41d4-a716-446655440005', 'simulation'),
('550e8400-e29b-41d4-a716-446655440006', 'sports'),
('550e8400-e29b-41d4-a716-446655440007', 'racing'),
('550e8400-e29b-41d4-a716-446655440008', 'puzzle'),
('550e8400-e29b-41d4-a716-446655440009', 'horror'),
('550e8400-e29b-41d4-a716-446655440010', 'indie');
```

```sql
-- supabase/seeds/03_genre_translations.sql
-- Traductions françaises des genres
INSERT INTO genre_translations (genre_id, language_code, name, description) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'fr', 'Action', 'Jeux d''action et d''aventure rapides'),
('550e8400-e29b-41d4-a716-446655440002', 'fr', 'Aventure', 'Jeux d''aventure et d''exploration'),
('550e8400-e29b-41d4-a716-446655440003', 'fr', 'RPG', 'Jeux de rôle et progression de personnage'),
('550e8400-e29b-41d4-a716-446655440004', 'fr', 'Stratégie', 'Jeux de stratégie et tactique'),
('550e8400-e29b-41d4-a716-446655440005', 'fr', 'Simulation', 'Jeux de simulation réaliste'),
('550e8400-e29b-41d4-a716-446655440006', 'fr', 'Sport', 'Jeux de sport et compétition'),
('550e8400-e29b-41d4-a716-446655440007', 'fr', 'Course', 'Jeux de course automobile'),
('550e8400-e29b-41d4-a716-446655440008', 'fr', 'Puzzle', 'Jeux de réflexion et énigmes'),
('550e8400-e29b-41d4-a716-446655440009', 'fr', 'Horreur', 'Jeux d''horreur et suspense'),
('550e8400-e29b-41d4-a716-446655440010', 'fr', 'Indépendant', 'Jeux indépendants créatifs');

-- Traductions anglaises des genres
INSERT INTO genre_translations (genre_id, language_code, name, description) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'en', 'Action', 'Fast-paced action and adventure games'),
('550e8400-e29b-41d4-a716-446655440002', 'en', 'Adventure', 'Adventure and exploration games'),
('550e8400-e29b-41d4-a716-446655440003', 'en', 'RPG', 'Role-playing and character progression games'),
('550e8400-e29b-41d4-a716-446655440004', 'en', 'Strategy', 'Strategy and tactical games'),
('550e8400-e29b-41d4-a716-446655440005', 'en', 'Simulation', 'Realistic simulation games'),
('550e8400-e29b-41d4-a716-446655440006', 'en', 'Sports', 'Sports and competition games'),
('550e8400-e29b-41d4-a716-446655440007', 'en', 'Racing', 'Racing and driving games'),
('550e8400-e29b-41d4-a716-446655440008', 'en', 'Puzzle', 'Puzzle and brain teaser games'),
('550e8400-e29b-41d4-a716-446655440009', 'en', 'Horror', 'Horror and suspense games'),
('550e8400-e29b-41d4-a716-446655440010', 'en', 'Indie', 'Creative independent games');
```

```sql
-- supabase/seeds/04_sample_games.sql
-- Jeux d'exemple pour tester la plateforme
INSERT INTO games (id, slug, developer, publisher, release_date, launch_price, current_price, currency, metascore, pegi_rating, media) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'the-witcher-3', 'CD Projekt RED', 'CD Projekt', '2015-05-19', 59.99, 29.99, 'EUR', 93, 18, '{"coverImage": "/images/witcher3-cover.jpg", "screenshots": ["/images/witcher3-1.jpg", "/images/witcher3-2.jpg"], "artwork": [], "trailers": [], "gameplay": []}'),
('660e8400-e29b-41d4-a716-446655440002', 'cyberpunk-2077', 'CD Projekt RED', 'CD Projekt', '2020-12-10', 59.99, 39.99, 'EUR', 86, 18, '{"coverImage": "/images/cyberpunk-cover.jpg", "screenshots": ["/images/cyberpunk-1.jpg", "/images/cyberpunk-2.jpg"], "artwork": [], "trailers": [], "gameplay": []}'),
('660e8400-e29b-41d4-a716-446655440003', 'minecraft', 'Mojang Studios', 'Microsoft', '2011-11-18', 26.95, 26.95, 'EUR', 93, 7, '{"coverImage": "/images/minecraft-cover.jpg", "screenshots": ["/images/minecraft-1.jpg", "/images/minecraft-2.jpg"], "artwork": [], "trailers": [], "gameplay": []}');
```

```sql
-- supabase/seeds/05_sample_game_translations.sql
-- Traductions des jeux d'exemple
INSERT INTO game_translations (game_id, language_code, title, description) VALUES
-- The Witcher 3
('660e8400-e29b-41d4-a716-446655440001', 'fr', 'The Witcher 3: Wild Hunt', 'Un RPG épique dans un monde ouvert fantastique. Incarnez Geralt de Riv dans sa quête pour retrouver Ciri.'),
('660e8400-e29b-41d4-a716-446655440001', 'en', 'The Witcher 3: Wild Hunt', 'An epic RPG in a fantasy open world. Play as Geralt of Rivia in his quest to find Ciri.'),

-- Cyberpunk 2077
('660e8400-e29b-41d4-a716-446655440002', 'fr', 'Cyberpunk 2077', 'Un RPG d''action futuriste dans la mégalopole de Night City. Personnalisez votre cyberpunk et façonnez votre destin.'),
('660e8400-e29b-41d4-a716-446655440002', 'en', 'Cyberpunk 2077', 'A futuristic action RPG in the Night City megalopolis. Customize your cyberpunk and shape your destiny.'),

-- Minecraft
('660e8400-e29b-41d4-a716-446655440003', 'fr', 'Minecraft', 'Le jeu de construction et d''aventure ultime. Construisez, explorez et survivez dans des mondes infinis.'),
('660e8400-e29b-41d4-a716-446655440003', 'en', 'Minecraft', 'The ultimate building and adventure game. Build, explore and survive in infinite worlds.');
```

```sql
-- supabase/seeds/06_sample_game_genres.sql
-- Association des jeux avec leurs genres
INSERT INTO game_genres (game_id, genre_id) VALUES
-- The Witcher 3: RPG + Adventure
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003'),
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'),

-- Cyberpunk 2077: RPG + Action
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001'),

-- Minecraft: Simulation + Indie
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440010');
```

```sql
-- supabase/seed.sql - Fichier principal qui appelle tous les seeds
-- Ce fichier orchestre l'exécution de tous les seeds dans l'ordre correct

\echo 'Starting database seeding...'

\echo 'Seeding languages...'
\i seeds/01_languages.sql

\echo 'Seeding genres...'
\i seeds/02_genres.sql

\echo 'Seeding genre translations...'
\i seeds/03_genre_translations.sql

\echo 'Seeding sample games...'
\i seeds/04_sample_games.sql

\echo 'Seeding sample game translations...'
\i seeds/05_sample_game_translations.sql

\echo 'Seeding sample game genres associations...'
\i seeds/06_sample_game_genres.sql

\echo 'Database seeding completed successfully!'
```

#### Configuration next-intl

```typescript
// i18n/request.ts
import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async () => {
  // Détection de la langue depuis les cookies ou headers
  const cookieStore = cookies();
  const locale = cookieStore.get("locale")?.value || "fr";

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

```json
// messages/fr.json
{
  "navigation": {
    "home": "Accueil",
    "library": "Bibliothèque",
    "dashboard": "Tableau de bord",
    "login": "Connexion",
    "signup": "Inscription",
    "logout": "Déconnexion"
  },
  "landing": {
    "title": "Découvrez l'univers du jeu vidéo",
    "subtitle": "La plateforme complète pour explorer, découvrir et partager votre passion du gaming",
    "cta": {
      "signup": "Commencer gratuitement",
      "login": "Se connecter"
    }
  },
  "library": {
    "title": "Bibliothèque de jeux",
    "search": "Rechercher un jeu...",
    "filters": "Filtres",
    "noResults": "Aucun jeu trouvé"
  }
}
```

```json
// messages/en.json
{
  "navigation": {
    "home": "Home",
    "library": "Library",
    "dashboard": "Dashboard",
    "login": "Login",
    "signup": "Sign up",
    "logout": "Logout"
  },
  "landing": {
    "title": "Discover the gaming universe",
    "subtitle": "The complete platform to explore, discover and share your gaming passion",
    "cta": {
      "signup": "Get started for free",
      "login": "Sign in"
    }
  },
  "library": {
    "title": "Game Library",
    "search": "Search for a game...",
    "filters": "Filters",
    "noResults": "No games found"
  }
}
```

#### Next.js API Routes

```typescript
// /app/api/games/route.ts - Liste des jeux avec filtres
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const genres = searchParams.get("genres")?.split(",");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  // Utilisation du client Supabase
  const supabase = createRouteHandlerClient({ cookies });
  // ... logique de requête
}

// /app/api/games/[id]/route.ts - Détails d'un jeu
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  // ... logique de récupération
}

// /app/api/admin/games/route.ts - CRUD administratif
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... logique de création
}
```

#### Supabase Client Configuration

```typescript
// /lib/supabase.ts
import {
  createClientComponentClient,
  createServerComponentClient,
} from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Client pour les composants côté client
export const createClient = () => createClientComponentClient();

// Client pour les composants côté serveur
export const createServerClient = () => createServerComponentClient({ cookies });

// Types générés automatiquement par Supabase
export type Database = {
  public: {
    Tables: {
      games: {
        Row: Game;
        Insert: Omit<Game, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Game, "id" | "created_at" | "updated_at">>;
      };
      // ... autres tables
    };
  };
};
```

## Data Models

### Game Model

```typescript
interface Game {
  id: string;
  title: string;
  description?: string;
  developer: string;
  publisher: string;
  releaseDate: Date;
  genres: Genre[];
  platforms: Platform[];
  languages: {
    audio: string[];
    interface: string[];
    subtitles: string[];
  };
  ageRating: {
    pegi?: number;
    esrb?: string;
  };
  gameModes: GameMode[];
  pricing: {
    launchPrice?: number;
    currentPrice?: number;
    currency: string;
  };
  systemRequirements: {
    minimum: SystemSpec;
    recommended: SystemSpec;
  };
  metascore?: number;
  media: {
    coverImage?: string;
    screenshots: string[];
    artwork: string[];
    trailers: VideoMedia[];
    gameplay: VideoMedia[];
  };
  createdAt: Date;
  updatedAt: Date;
}

interface SystemSpec {
  os: string;
  processor: string;
  memory: string;
  graphics: string;
  storage: string;
}

interface VideoMedia {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: number;
}
```

### Supporting Models

```typescript
interface Genre {
  id: string;
  name: string;
  description?: string;
  gameCount: number;
}

interface Platform {
  id: string;
  name: string;
  type: "console" | "pc" | "mobile" | "handheld";
  manufacturer: string;
}

enum GameMode {
  SINGLE_PLAYER = "single-player",
  MULTIPLAYER = "multiplayer",
  COOPERATIVE = "cooperative",
  COMPETITIVE = "competitive",
}
```

### Database Schema

```sql
-- Schéma Supabase (voir section Backend API Interfaces pour le schéma complet)
-- Tables principales : games, genres, game_genres
-- RLS activé pour la sécurité
-- Index optimisés pour les recherches
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Game List Display Completeness

_For any_ set of games in the library, when displaying the game list, each game card should contain title, cover image, genre, and release year information.
**Validates: Requirements 1.2**

### Property 2: Pagination Navigation Consistency

_For any_ valid page number within the total page range, clicking pagination controls should navigate to the requested page and display the correct subset of games.
**Validates: Requirements 1.3**

### Property 3: Search Title Matching

_For any_ search query and game collection, the search results should only include games whose titles contain the search query (case-insensitive).
**Validates: Requirements 2.1, 2.4**

### Property 4: Search State Reset

_For any_ active search query, clearing the search should restore the display to show all available games.
**Validates: Requirements 2.5**

### Property 5: Genre Filter Accuracy

_For any_ selected genre filter and game collection, the filtered results should only include games that belong to the selected genre(s).
**Validates: Requirements 3.1, 3.2**

### Property 6: Genre Count Accuracy

_For any_ genre in the filter system, the displayed count should equal the actual number of games belonging to that genre.
**Validates: Requirements 3.4**

### Property 7: Filter State Reset

_For any_ active filter combination, clearing all filters should restore the display to show all available games.
**Validates: Requirements 3.5**

### Property 8: Game Details Completeness

_For any_ game in the system, the game details page should display all available information including title, developer, publisher, release date, genres, description, platforms, languages, age rating, game modes, pricing, system requirements, and metascore.
**Validates: Requirements 4.2**

### Property 9: Media Gallery Completeness

_For any_ game with media content, the details page should display all media types (screenshots, artwork, trailers, gameplay videos) in organized galleries with navigation controls.
**Validates: Requirements 4.3, 4.4**

### Property 10: Responsive Layout Adaptation

_For any_ supported screen size (mobile, tablet, desktop), the game library should adapt its layout appropriately and maintain functionality across orientation changes.
**Validates: Requirements 5.1, 5.2, 5.3, 5.5**

### Property 11: Game Validation Integrity

_For any_ game creation or update operation, all required fields should be validated, and invalid data should be rejected with appropriate error messages.
**Validates: Requirements 6.1, 6.2**

### Property 12: Game Deletion Consistency

_For any_ deleted game, it should be completely removed from all search results, filter results, and library displays.
**Validates: Requirements 6.3**

### Property 13: Bulk Operations Atomicity

_For any_ bulk operation on multiple games, either all operations should succeed or all should fail, maintaining data consistency.
**Validates: Requirements 6.4**

### Property 14: Real-time Display Updates

_For any_ game data modification, the changes should be immediately reflected in all relevant displays (library, search results, details page).
**Validates: Requirements 6.5**

## Error Handling

### Client-Side Error Handling (Next.js + shadcn/ui)

**Network Errors:**

- Utiliser les Error Boundaries de React pour capturer les erreurs
- Composants Toast de shadcn/ui pour les notifications d'erreur
- Retry automatique avec exponential backoff
- Indicateurs de statut réseau avec Badge de shadcn/ui

**Validation Errors:**

- Utiliser react-hook-form avec zod pour la validation
- Composants Form de shadcn/ui avec validation intégrée
- Messages d'erreur en temps réel avec Alert de shadcn/ui
- Highlight des champs problématiques

**Loading States:**

- Skeleton components de shadcn/ui pour les états de chargement
- Spinner component pour les opérations courtes
- Suspense boundaries pour le lazy loading
- Progressive loading avec Intersection Observer

### Server-Side Error Handling (Supabase + Next.js)

**Supabase Error Handling:**

```typescript
// Gestion des erreurs Supabase
interface SupabaseError {
  message: string;
  details: string;
  hint: string;
  code: string;
}

// Wrapper pour les opérations Supabase
async function handleSupabaseOperation<T>(
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  const { data, error } = await operation();

  if (error) {
    console.error("Supabase error:", error);
    throw new Error(error.message || "Database operation failed");
  }

  if (!data) {
    throw new Error("No data returned from operation");
  }

  return data;
}
```

**Next.js API Error Handling:**

```typescript
// Middleware d'erreur pour les API routes
export function withErrorHandler(handler: Function) {
  return async (req: Request, context: any) => {
    try {
      return await handler(req, context);
    } catch (error) {
      console.error("API Error:", error);

      if (error instanceof ValidationError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.details },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}
```

**Media Handling (Supabase Storage):**

- Fallback images stockées localement
- Lazy loading avec next/image
- Optimisation automatique des images par Next.js
- Gestion des erreurs de upload avec Progress de shadcn/ui

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests:**

- Verify specific examples and edge cases
- Test integration points between components
- Validate error conditions and boundary cases
- Focus on concrete scenarios and known inputs

**Property-Based Tests:**

- Verify universal properties across all inputs
- Test system behavior with randomized data
- Ensure correctness properties hold for any valid input
- Provide comprehensive input coverage through generation

### Property-Based Testing Configuration

**Framework:** fast-check pour TypeScript avec Jest/Vitest
**Configuration:**

- Minimum 100 itérations par test de propriété
- Générateurs personnalisés pour les données de jeux
- Shrinking activé pour trouver les exemples minimaux d'échec
- Configuration de timeout pour les tests longs

**Test Tagging Format:**
Chaque test de propriété doit référencer sa propriété du document de conception :

```typescript
// Feature: game-library, Property 1: Game List Display Completeness
test("game list displays complete information", () => {
  fc.assert(
    fc.property(gameArrayGenerator(), (games) => {
      const rendered = renderGameList(games);
      return games.every(
        (game) =>
          rendered.includes(game.title) &&
          rendered.includes(game.coverImage) &&
          rendered.includes(game.genre) &&
          rendered.includes(game.releaseYear.toString())
      );
    }),
    { numRuns: 100 }
  );
});
```

### Unit Testing Strategy (Next.js + Supabase)

**Component Testing:**

- Jest + React Testing Library pour les composants
- Mock des hooks Supabase avec MSW (Mock Service Worker)
- Tests d'intégration avec les composants shadcn/ui
- Tests de navigation avec Next.js router

**API Testing:**

- Tests des API routes Next.js
- Mock de Supabase client pour les tests unitaires
- Tests d'intégration avec une base de données de test
- Validation des politiques RLS

**End-to-End Testing:**

- Playwright pour les tests E2E
- Tests des parcours utilisateur critiques
- Tests de responsive design
- Tests d'accessibilité automatisés

### Test Data Management

**Générateurs pour les Tests de Propriété:**

```typescript
// Générateur de données de jeu
const gameGenerator = () =>
  fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    developer: fc.string({ minLength: 1, maxLength: 50 }),
    genres: fc.array(fc.string(), { minLength: 1, maxLength: 5 }),
    releaseYear: fc.integer({ min: 1970, max: 2030 }),
    // ... autres champs
  });

// Générateur de requêtes de recherche
const searchQueryGenerator = () =>
  fc.oneof(
    fc.string({ minLength: 1, maxLength: 50 }), // Requêtes normales
    fc.constant(""), // Requêtes vides
    fc.string().map((s) => s.toUpperCase()) // Variations de casse
  );
```

**Données Mock pour les Tests Unitaires:**

- Datasets de jeux prédéfinis pour des tests cohérents
- Scénarios de cas limites (listes vides, données manquantes)
- Mocks de réponses d'erreur pour les tests d'échec
- Datasets de performance avec de gros volumes

**Configuration Supabase pour les Tests:**

```typescript
// Mock du client Supabase pour les tests
export const createMockSupabaseClient = () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  // ... autres méthodes
});
```

#### Next.js API Routes avec Authentification et i18n

```typescript
// /app/api/games/route.ts - Liste des jeux avec filtres et i18n
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const genres = searchParams.get("genres")?.split(",");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const locale = searchParams.get("locale") || "fr";

  const supabase = createRouteHandlerClient({ cookies });

  // Requête avec jointures pour les traductions
  let query = supabase
    .from("games")
    .select(
      `
      id, slug, developer, publisher, release_date, launch_price, current_price,
      metascore, pegi_rating, esrb_rating, media,
      game_translations!inner(title, description),
      game_genres(genres(genre_translations(name)))
    `
    )
    .eq("game_translations.language_code", locale)
    .eq("game_genres.genres.genre_translations.language_code", locale);

  if (search) {
    query = query.ilike("game_translations.title", `%${search}%`);
  }

  // ... logique de pagination et filtres
}

// /app/api/auth/callback/route.ts - Callback d'authentification
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}

// /app/api/profile/route.ts - Gestion du profil utilisateur
export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return NextResponse.json({ user, profile });
}

export async function PATCH(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updates = await request.json();

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

// /app/api/languages/route.ts - Langues disponibles
export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  const { data: languages } = await supabase
    .from("languages")
    .select("*")
    .order("is_default", { ascending: false });

  return NextResponse.json(languages);
}
```

#### Configuration Bun pour le Projet

```json
// package.json - Configuration optimisée pour Bun
{
  "name": "game-universe",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "bun run next dev",
    "build": "bun run next build",
    "start": "bun run next start",
    "lint": "bun run next lint",
    "test": "bun test",
    "test:watch": "bun test --watch",
    "type-check": "bun run tsc --noEmit",
    "db:migrate": "bunx supabase db push",
    "db:seed": "bunx supabase db seed",
    "db:reset": "bunx supabase db reset"
  },
  "dependencies": {
    "next": "^16.0.0",
    "@supabase/auth-helpers-nextjs": "latest",
    "@supabase/supabase-js": "latest",
    "next-intl": "latest",
    "resend": "latest"
  },
  "devDependencies": {
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "typescript": "latest",
    "eslint": "latest",
    "eslint-config-next": "latest",
    "prettier": "latest",
    "fast-check": "latest"
  }
}
```

```toml
# bunfig.toml - Configuration Bun
[install]
# Utiliser le cache global pour accélérer les installations
cache = true
# Installer les peer dependencies automatiquement
auto = true
# Utiliser les liens symboliques pour économiser l'espace
link-native-bins = true

[run]
# Utiliser Bun comme runtime par défaut
bun = true
# Activer le hot reload pour le développement
hot = true

[test]
# Configuration des tests avec Bun
preload = ["./test/setup.ts"]
# Utiliser le runner de test intégré de Bun
runner = "bun"
```

```typescript
// bun.config.ts - Configuration avancée pour Bun
import type { BunConfig } from "bun";

const config: BunConfig = {
  // Configuration du serveur de développement
  dev: {
    port: 3000,
    hot: true,
  },

  // Configuration des tests
  test: {
    timeout: 10000,
    coverage: {
      enabled: true,
      threshold: 80,
    },
  },

  // Configuration du build
  build: {
    target: "browser",
    minify: true,
    sourcemap: "external",
  },
};

export default config;
```

#### Configuration Supabase avec Migrations

```typescript
// supabase/config.toml
[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://yourdomain.vercel.app"]
jwt_expiry = 3600
enable_signup = true
enable_confirmations = true

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = true

# Configuration des migrations automatiques
[db]
shadow_database_url = "postgresql://postgres:postgres@localhost:54322/postgres"

# Scripts de migration
[scripts]
migrate = "supabase db reset && supabase db push"
seed = "supabase db seed"
```

#### Middleware Next.js pour l'authentification et i18n

```typescript
// middleware.ts
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

const intlMiddleware = createIntlMiddleware({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "as-needed",
});

export async function middleware(request: NextRequest) {
  // Gestion de l'internationalisation
  const intlResponse = intlMiddleware(request);

  // Gestion de l'authentification
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // Redirection des utilisateurs non connectés vers la landing page
  if (!session && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirection des utilisateurs connectés vers le dashboard
  if (session && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return intlResponse || response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```
