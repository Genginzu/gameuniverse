/**
 * Données mockées pour la page POC "Game Detail".
 * Couvre la totalité des informations affichées par la page existante
 * (`/games/[slug]`) afin de pouvoir comparer la mise en page sans dépendance
 * au backend.
 */

import {
  type AccentPalette,
  CYBERPUNK_PALETTE,
  VALORANT_PALETTE,
  CYAN_PALETTE,
  MAGENTA_PALETTE,
} from "@/components/design-poc/palettes";

export interface PocGameData {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  storyline: string;

  releaseDate: string;
  metascore: number;
  developers: string[];
  publishers: string[];

  cover: string;
  hero: string;
  screenshots: string[];
  videos: { thumbnail: string; title: string; durationLabel: string }[];

  platforms: { id: string; name: string; abbreviation: string; iconified: string }[];
  genres: { id: string; name: string }[];

  pricing: {
    store: string;
    price: number;
    currency: string;
    discount?: number;
    platform: string;
    url: string;
  }[];

  /** 90 jours de variation, valeurs en monnaie locale */
  priceHistory: { date: string; price: number }[];

  ageRatings: { system: string; rating: string; minimumAge: number | null; descriptors: string[] }[];

  languages: {
    code: string;
    name: string;
    interface: boolean;
    audio: boolean;
    subtitles: boolean;
  }[];

  playtime: {
    official: { mainStory: number; mainSides: number; completionist: number } | null;
    community: { avg: number; sample: number } | null;
    contributors: { name: string; avatar: string; hours: number }[];
  };

  music: {
    composers: string[];
    tracksCount: number;
    streamingPlatforms: { name: string; icon: string; url: string }[];
  } | null;

  versions: {
    name: string;
    cover: string;
    price: number;
    currency: string;
    description: string;
  }[];

  dlcExtensions: { name: string; cover: string; releaseDate: string; description: string }[];

  similarGames: { title: string; cover: string; year: string }[];

  reviews: {
    author: string;
    avatar: string;
    rating: number;
    quote: string;
    date: string;
  }[];

  /** Stats live mockées pour le ticker */
  liveStats: { playersOnline: number; activeStreams: number; tournaments: number };

  paletteKey: string;
  palette: AccentPalette;
}

/** Donnée principale du POC — Cyberpunk 2077 (palette jaune signature) */
export const CYBERPUNK_GAME: PocGameData = {
  id: "cp2077",
  slug: "cyberpunk-2077",
  title: "Cyberpunk 2077",
  tagline:
    "Welcome to Night City — where every choice writes your legend, and every street remembers your name.",
  description:
    "Cyberpunk 2077 est un RPG d'action en monde ouvert se déroulant à Night City, une mégalopole obsédée par le pouvoir, le glamour et la modification corporelle. Vous incarnez V, un mercenaire hors-la-loi à la recherche d'un implant unique : la clé de l'immortalité.",
  storyline:
    "Personnalisez votre cyberware, votre arsenal et votre style de jeu, puis explorez une ville tentaculaire où vos choix ont un poids. Forgez des relations durables avec un casting de personnages mémorables, et sculptez votre légende dans la moelle même de Night City.",
  releaseDate: "2020-12-10",
  metascore: 86,
  developers: ["CD Projekt Red"],
  publishers: ["CD Projekt"],

  cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1rcz.webp",
  hero: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&q=80",
  screenshots: [
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&q=80",
    "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&q=80",
    "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1200&q=80",
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=1200&q=80",
  ],
  videos: [
    {
      thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80",
      title: "Phantom Liberty — Official Trailer",
      durationLabel: "2:24",
    },
    {
      thumbnail: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1200&q=80",
      title: "Gameplay deep dive — Update 2.1",
      durationLabel: "8:11",
    },
  ],

  platforms: [
    { id: "pc", name: "PC", abbreviation: "PC", iconified: "PC" },
    { id: "ps5", name: "PlayStation 5", abbreviation: "PS5", iconified: "PS5" },
    { id: "xsx", name: "Xbox Series X/S", abbreviation: "XSX", iconified: "XSX" },
    { id: "stadia", name: "Stadia", abbreviation: "Stadia", iconified: "STD" },
  ],
  genres: [
    { id: "rpg", name: "RPG" },
    { id: "open-world", name: "Open World" },
    { id: "action", name: "Action" },
    { id: "fps", name: "FPS" },
  ],

  pricing: [
    { store: "Steam", platform: "PC", price: 59.99, currency: "EUR", discount: 50, url: "#" },
    { store: "GOG", platform: "PC", price: 49.99, currency: "EUR", discount: 60, url: "#" },
    { store: "PlayStation Store", platform: "PS5", price: 39.99, currency: "EUR", discount: 33, url: "#" },
    { store: "Microsoft Store", platform: "XSX", price: 41.99, currency: "EUR", discount: 30, url: "#" },
  ],

  priceHistory: generateFakePriceHistory(59.99, 90),

  ageRatings: [
    {
      system: "PEGI",
      rating: "18",
      minimumAge: 18,
      descriptors: ["Violence", "Sex", "Drugs", "Strong language"],
    },
    {
      system: "ESRB",
      rating: "M",
      minimumAge: 17,
      descriptors: ["Blood", "Strong language", "Suggestive themes"],
    },
  ],

  languages: [
    { code: "en", name: "English", interface: true, audio: true, subtitles: true },
    { code: "fr", name: "Français", interface: true, audio: true, subtitles: true },
    { code: "de", name: "Deutsch", interface: true, audio: true, subtitles: true },
    { code: "es", name: "Español", interface: true, audio: true, subtitles: true },
    { code: "it", name: "Italiano", interface: true, audio: true, subtitles: true },
    { code: "ja", name: "日本語", interface: true, audio: true, subtitles: true },
    { code: "pl", name: "Polski", interface: true, audio: true, subtitles: true },
    { code: "ru", name: "Русский", interface: true, audio: false, subtitles: true },
    { code: "pt", name: "Português", interface: true, audio: false, subtitles: true },
    { code: "zh", name: "中文", interface: true, audio: false, subtitles: true },
  ],

  playtime: {
    official: { mainStory: 25, mainSides: 60, completionist: 102 },
    community: { avg: 78, sample: 1840 },
    contributors: [
      { name: "Lyra", avatar: "https://i.pravatar.cc/64?img=11", hours: 84 },
      { name: "Marko", avatar: "https://i.pravatar.cc/64?img=12", hours: 142 },
      { name: "Reyna", avatar: "https://i.pravatar.cc/64?img=13", hours: 67 },
      { name: "Kael", avatar: "https://i.pravatar.cc/64?img=14", hours: 31 },
      { name: "Echo", avatar: "https://i.pravatar.cc/64?img=15", hours: 215 },
    ],
  },

  music: {
    composers: ["Marcin Przybyłowicz", "P.T. Adamczyk", "Paul Leonard-Morgan"],
    tracksCount: 47,
    streamingPlatforms: [
      { name: "Spotify", icon: "logos:spotify-icon", url: "#" },
      { name: "Apple Music", icon: "logos:apple-music", url: "#" },
      { name: "YouTube", icon: "logos:youtube-icon", url: "#" },
    ],
  },

  versions: [
    {
      name: "Standard Edition",
      cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1rcz.webp",
      price: 59.99,
      currency: "EUR",
      description: "The base game with all post-launch updates.",
    },
    {
      name: "Phantom Liberty Bundle",
      cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co7497.webp",
      price: 89.99,
      currency: "EUR",
      description: "Base game + Phantom Liberty expansion.",
    },
    {
      name: "Ultimate Edition",
      cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co7497.webp",
      price: 99.99,
      currency: "EUR",
      description: "Everything : base game, expansion, soundtrack & artbook.",
    },
  ],

  dlcExtensions: [
    {
      name: "Phantom Liberty",
      cover: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&q=80",
      releaseDate: "2023-09-26",
      description:
        "Espionnage, paranoïa et nouvelle zone de jeu. Idris Elba rejoint le casting.",
    },
  ],

  similarGames: [
    {
      title: "The Witcher 3",
      cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.webp",
      year: "2015",
    },
    {
      title: "Deus Ex: Mankind Divided",
      cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1xbc.webp",
      year: "2016",
    },
    {
      title: "Watch Dogs: Legion",
      cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co24lh.webp",
      year: "2020",
    },
    {
      title: "Starfield",
      cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co5tn5.webp",
      year: "2023",
    },
  ],

  reviews: [
    {
      author: "Marko Steel",
      avatar: "https://i.pravatar.cc/64?img=12",
      rating: 9.2,
      quote:
        "Phantom Liberty transforme un bon RPG en quelque chose de mémorable. Night City n'a jamais été aussi vivant, et chaque mission secondaire pourrait être l'arc principal d'un autre jeu.",
      date: "May 02, 2026",
    },
    {
      author: "Lyra Nightwhisper",
      avatar: "https://i.pravatar.cc/64?img=11",
      rating: 8.7,
      quote:
        "Le système de cyberware me rappelle ce que j'aimais dans Deus Ex en plus moderne. Le rythme de l'histoire principale reste irrégulier mais les personnages compensent largement.",
      date: "Apr 28, 2026",
    },
    {
      author: "Echo",
      avatar: "https://i.pravatar.cc/64?img=15",
      rating: 9.5,
      quote:
        "215 heures plus tard et je découvre encore des coins de la map. La VF est l'une des meilleures de la décennie.",
      date: "Apr 15, 2026",
    },
  ],

  liveStats: { playersOnline: 487_320, activeStreams: 89, tournaments: 14 },

  paletteKey: "cyberpunk",
  palette: CYBERPUNK_PALETTE,
};

/** Variantes pour démontrer le théming dynamique. */
export const VALORANT_GAME: PocGameData = {
  ...CYBERPUNK_GAME,
  id: "valorant",
  slug: "valorant",
  title: "Valorant",
  tagline: "Defy the limits. Compete on the world's biggest tactical FPS stage.",
  description:
    "Valorant est un FPS tactique 5v5 nerveux et compétitif. Choisissez votre agent, exploitez ses pouvoirs uniques et imposez votre style.",
  storyline:
    "Sur une Terre alternative, des agents venus du monde entier mettent leurs talents au service de la VALORANT Protocol. Chaque saison redessine la carte, les armes et les méta de jeu.",
  developers: ["Riot Games"],
  publishers: ["Riot Games"],
  releaseDate: "2020-06-02",
  metascore: 80,
  cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co5w0g.webp",
  hero: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1920&q=80",
  paletteKey: "valorant",
  palette: VALORANT_PALETTE,
  pricing: [{ store: "Riot Client", platform: "PC", price: 0, currency: "EUR", url: "#" }],
  ageRatings: [
    { system: "PEGI", rating: "16", minimumAge: 16, descriptors: ["Violence", "Online"] },
    { system: "ESRB", rating: "T", minimumAge: 13, descriptors: ["Violence", "Blood"] },
  ],
};

export const STELLAR_GAME: PocGameData = {
  ...CYBERPUNK_GAME,
  id: "stellar",
  slug: "stellar-quest",
  title: "Stellar Quest",
  tagline: "An odyssey through the stars, hand-drawn frame by frame.",
  description:
    "Une aventure narrative dessinée à la main qui mêle exploration spatiale et puzzle environnemental.",
  storyline: "Un cargo perdu, une cargaison oubliée et une héroïne qui cherche son chemin parmi les étoiles.",
  developers: ["Indie Studios"],
  publishers: ["Indie Studios"],
  releaseDate: "2025-03-14",
  metascore: 91,
  cover: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&q=80",
  hero: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1920&q=80",
  paletteKey: "magenta",
  palette: MAGENTA_PALETTE,
};

export const AQUA_GAME: PocGameData = {
  ...CYBERPUNK_GAME,
  id: "aqua",
  slug: "aqua-drift",
  title: "Aqua Drift",
  tagline: "Race the seven seas in the most stunning racer of the year.",
  description: "Un jeu de course aquatique avec un système de drift unique.",
  storyline: "Sept régions, douze équipes, une seule couronne.",
  developers: ["Wave Interactive"],
  publishers: ["Wave Interactive"],
  releaseDate: "2025-07-22",
  metascore: 85,
  cover: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&q=80",
  hero: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1920&q=80",
  paletteKey: "cyan",
  palette: CYAN_PALETTE,
};

export const POC_GAMES: Record<string, PocGameData> = {
  cyberpunk: CYBERPUNK_GAME,
  valorant: VALORANT_GAME,
  magenta: STELLAR_GAME,
  cyan: AQUA_GAME,
};

/** Génère 90 jours de variation de prix réaliste */
function generateFakePriceHistory(basePrice: number, days: number) {
  const result: { date: string; price: number }[] = [];
  const now = new Date();
  let currentPrice = basePrice;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Variations type soldes ponctuelles
    let price: number;
    if (i % 30 < 5) price = basePrice * 0.5; // Sale every month
    else if (i % 14 < 2) price = basePrice * 0.75;
    else price = currentPrice + (Math.random() - 0.5) * 2;

    price = Math.max(basePrice * 0.3, Math.min(basePrice, price));
    currentPrice = price;
    result.push({ date: date.toISOString().slice(0, 10), price: Number(price.toFixed(2)) });
  }
  return result;
}
