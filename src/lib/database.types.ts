export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
  public: {
    Tables: {
      companies: {
        Row: {
          company_type: string | null;
          created_at: string | null;
          description: string | null;
          founded_year: number | null;
          headquarters: string | null;
          id: string;
          is_active: boolean | null;
          logo_url: string | null;
          name: string;
          slug: string;
          updated_at: string | null;
          website_url: string | null;
        };
        Insert: {
          company_type?: string | null;
          created_at?: string | null;
          description?: string | null;
          founded_year?: number | null;
          headquarters?: string | null;
          id?: string;
          is_active?: boolean | null;
          logo_url?: string | null;
          name: string;
          slug: string;
          updated_at?: string | null;
          website_url?: string | null;
        };
        Update: {
          company_type?: string | null;
          created_at?: string | null;
          description?: string | null;
          founded_year?: number | null;
          headquarters?: string | null;
          id?: string;
          is_active?: boolean | null;
          logo_url?: string | null;
          name?: string;
          slug?: string;
          updated_at?: string | null;
          website_url?: string | null;
        };
        Relationships: [];
      };
      character_comments: {
        Row: {
          id: string;
          user_id: string;
          character_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          character_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          character_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "character_comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "character_comments_character_id_fkey";
            columns: ["character_id"];
            isOneToOne: false;
            referencedRelation: "characters";
            referencedColumns: ["id"];
          },
        ];
      };
      content_descriptor_translations: {
        Row: {
          content_descriptor_id: string | null;
          description: string | null;
          id: string;
          language_code: string | null;
          name: string;
        };
        Insert: {
          content_descriptor_id?: string | null;
          description?: string | null;
          id?: string;
          language_code?: string | null;
          name: string;
        };
        Update: {
          content_descriptor_id?: string | null;
          description?: string | null;
          id?: string;
          language_code?: string | null;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "content_descriptor_translations_content_descriptor_id_fkey";
            columns: ["content_descriptor_id"];
            isOneToOne: false;
            referencedRelation: "content_descriptors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_descriptor_translations_language_code_fkey";
            columns: ["language_code"];
            isOneToOne: false;
            referencedRelation: "languages";
            referencedColumns: ["code"];
          },
        ];
      };
      content_descriptors: {
        Row: {
          code: string;
          created_at: string | null;
          icon_url: string | null;
          id: string;
          rating_system_id: string | null;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          icon_url?: string | null;
          id?: string;
          rating_system_id?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          icon_url?: string | null;
          id?: string;
          rating_system_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "content_descriptors_rating_system_id_fkey";
            columns: ["rating_system_id"];
            isOneToOne: false;
            referencedRelation: "rating_systems";
            referencedColumns: ["id"];
          },
        ];
      };
      friendships: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          status: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          status?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          status?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "friendships_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "friendships_receiver_id_fkey";
            columns: ["receiver_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      game_artwork: {
        Row: {
          alt_text: string | null;
          artwork_type: string | null;
          caption: string | null;
          created_at: string | null;
          display_order: number | null;
          game_id: string;
          id: string;
          is_featured: boolean | null;
          url: string;
        };
        Insert: {
          alt_text?: string | null;
          artwork_type?: string | null;
          caption?: string | null;
          created_at?: string | null;
          display_order?: number | null;
          game_id: string;
          id?: string;
          is_featured?: boolean | null;
          url: string;
        };
        Update: {
          alt_text?: string | null;
          artwork_type?: string | null;
          caption?: string | null;
          created_at?: string | null;
          display_order?: number | null;
          game_id?: string;
          id?: string;
          is_featured?: boolean | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_artwork_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      game_companies: {
        Row: {
          company_id: string;
          created_at: string | null;
          game_id: string;
          id: string;
          is_primary: boolean | null;
          role: string;
        };
        Insert: {
          company_id: string;
          created_at?: string | null;
          game_id: string;
          id?: string;
          is_primary?: boolean | null;
          role: string;
        };
        Update: {
          company_id?: string;
          created_at?: string | null;
          game_id?: string;
          id?: string;
          is_primary?: boolean | null;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_companies_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_companies_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      game_genres: {
        Row: {
          game_id: string;
          genre_id: string;
        };
        Insert: {
          game_id: string;
          genre_id: string;
        };
        Update: {
          game_id?: string;
          genre_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_genres_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_genres_genre_id_fkey";
            columns: ["genre_id"];
            isOneToOne: false;
            referencedRelation: "genres";
            referencedColumns: ["id"];
          },
        ];
      };
      game_prices: {
        Row: {
          created_at: string | null;
          currency: string;
          game_id: string;
          id: string;
          is_available: boolean | null;
          last_updated: string | null;
          platform: string;
          price: number;
          store_id: string;
          store_url: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          currency?: string;
          game_id: string;
          id?: string;
          is_available?: boolean | null;
          last_updated?: string | null;
          platform: string;
          price: number;
          store_id: string;
          store_url?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          currency?: string;
          game_id?: string;
          id?: string;
          is_available?: boolean | null;
          last_updated?: string | null;
          platform?: string;
          price?: number;
          store_id?: string;
          store_url?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "game_prices_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_prices_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      game_reviews: {
        Row: {
          id: string;
          user_id: string;
          game_id: string;
          rating: number;
          content: string;
          positive_points: string[];
          negative_points: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_id: string;
          rating: number;
          content: string;
          positive_points?: string[];
          negative_points?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_id?: string;
          rating?: number;
          content?: string;
          positive_points?: string[];
          negative_points?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_reviews_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_reviews_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      game_rating_descriptors: {
        Row: {
          content_descriptor_id: string;
          game_rating_id: string;
        };
        Insert: {
          content_descriptor_id: string;
          game_rating_id: string;
        };
        Update: {
          content_descriptor_id?: string;
          game_rating_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_rating_descriptors_content_descriptor_id_fkey";
            columns: ["content_descriptor_id"];
            isOneToOne: false;
            referencedRelation: "content_descriptors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_rating_descriptors_game_rating_id_fkey";
            columns: ["game_rating_id"];
            isOneToOne: false;
            referencedRelation: "game_ratings";
            referencedColumns: ["id"];
          },
        ];
      };
      game_ratings: {
        Row: {
          assigned_date: string | null;
          created_at: string | null;
          game_id: string | null;
          id: string;
          is_primary: boolean | null;
          rating_id: string | null;
        };
        Insert: {
          assigned_date?: string | null;
          created_at?: string | null;
          game_id?: string | null;
          id?: string;
          is_primary?: boolean | null;
          rating_id?: string | null;
        };
        Update: {
          assigned_date?: string | null;
          created_at?: string | null;
          game_id?: string | null;
          id?: string;
          is_primary?: boolean | null;
          rating_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "game_ratings_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_ratings_rating_id_fkey";
            columns: ["rating_id"];
            isOneToOne: false;
            referencedRelation: "ratings";
            referencedColumns: ["id"];
          },
        ];
      };
      game_screenshots: {
        Row: {
          alt_text: string | null;
          caption: string | null;
          created_at: string | null;
          display_order: number | null;
          game_id: string;
          id: string;
          is_featured: boolean | null;
          url: string;
        };
        Insert: {
          alt_text?: string | null;
          caption?: string | null;
          created_at?: string | null;
          display_order?: number | null;
          game_id: string;
          id?: string;
          is_featured?: boolean | null;
          url: string;
        };
        Update: {
          alt_text?: string | null;
          caption?: string | null;
          created_at?: string | null;
          display_order?: number | null;
          game_id?: string;
          id?: string;
          is_featured?: boolean | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_screenshots_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      game_translations: {
        Row: {
          description: string | null;
          game_id: string | null;
          id: string;
          language_code: string | null;
          title: string;
        };
        Insert: {
          description?: string | null;
          game_id?: string | null;
          id?: string;
          language_code?: string | null;
          title: string;
        };
        Update: {
          description?: string | null;
          game_id?: string | null;
          id?: string;
          language_code?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_translations_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_translations_language_code_fkey";
            columns: ["language_code"];
            isOneToOne: false;
            referencedRelation: "languages";
            referencedColumns: ["code"];
          },
        ];
      };
      game_videos: {
        Row: {
          created_at: string | null;
          description: string | null;
          display_order: number | null;
          duration_seconds: number | null;
          game_id: string;
          id: string;
          is_featured: boolean | null;
          thumbnail_url: string | null;
          title: string;
          url: string;
          video_type: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          duration_seconds?: number | null;
          game_id: string;
          id?: string;
          is_featured?: boolean | null;
          thumbnail_url?: string | null;
          title: string;
          url: string;
          video_type?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          duration_seconds?: number | null;
          game_id?: string;
          id?: string;
          is_featured?: boolean | null;
          thumbnail_url?: string | null;
          title?: string;
          url?: string;
          video_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "game_videos_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      game_versions: {
        Row: {
          id: string;
          game_id: string;
          igdb_id: number | null;
          version_title: string;
          description: string | null;
          cover_image_url: string | null;
          display_order: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          game_id: string;
          igdb_id?: number | null;
          version_title: string;
          description?: string | null;
          cover_image_url?: string | null;
          display_order?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          game_id?: string;
          igdb_id?: number | null;
          version_title?: string;
          description?: string | null;
          cover_image_url?: string | null;
          display_order?: number | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "game_versions_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      game_languages: {
        Row: {
          id: string;
          game_id: string;
          language_code: string;
          language_name: string;
          has_audio: boolean | null;
          has_subtitles: boolean | null;
          has_interface: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          game_id: string;
          language_code: string;
          language_name: string;
          has_audio?: boolean | null;
          has_subtitles?: boolean | null;
          has_interface?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          game_id?: string;
          language_code?: string;
          language_name?: string;
          has_audio?: boolean | null;
          has_subtitles?: boolean | null;
          has_interface?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "game_languages_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_languages_language_code_fkey";
            columns: ["language_code"];
            isOneToOne: false;
            referencedRelation: "supported_languages";
            referencedColumns: ["code"];
          },
        ];
      };
      games: {
        Row: {
          id: string;
          slug: string;
          developer?: string;
          publisher?: string;
          release_date: string | null;
          launch_price?: number | null;
          current_price?: number | null;
          currency?: string | null;
          metascore: number | null;
          pegi_rating?: number | null;
          esrb_rating?: string | null;
          system_requirements: Json | null;
          media?: Json | null;
          cover_image_url: string | null;
          background_image_url?: string | null;
          background_color?: string | null;
          accent_color?: string | null;
          label_color?: string | null;
          text_color?: string | null;
          igdb_id: number | null;
          last_synced_at?: string | null;
          playtime_hastily?: number | null;
          playtime_normally?: number | null;
          playtime_completely?: number | null;
          playtime_updated_at?: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          developer?: string;
          publisher?: string;
          release_date?: string | null;
          launch_price?: number | null;
          current_price?: number | null;
          currency?: string | null;
          metascore?: number | null;
          pegi_rating?: number | null;
          esrb_rating?: string | null;
          system_requirements?: Json | null;
          media?: Json | null;
          cover_image_url?: string | null;
          background_image_url?: string | null;
          background_color?: string | null;
          accent_color?: string | null;
          label_color?: string | null;
          text_color?: string | null;
          igdb_id?: number | null;
          last_synced_at?: string | null;
          playtime_hastily?: number | null;
          playtime_normally?: number | null;
          playtime_completely?: number | null;
          playtime_updated_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          developer?: string;
          publisher?: string;
          release_date?: string | null;
          launch_price?: number | null;
          current_price?: number | null;
          currency?: string | null;
          metascore?: number | null;
          pegi_rating?: number | null;
          esrb_rating?: string | null;
          system_requirements?: Json | null;
          media?: Json | null;
          cover_image_url?: string | null;
          background_image_url?: string | null;
          background_color?: string | null;
          accent_color?: string | null;
          label_color?: string | null;
          text_color?: string | null;
          igdb_id?: number | null;
          last_synced_at?: string | null;
          playtime_hastily?: number | null;
          playtime_normally?: number | null;
          playtime_completely?: number | null;
          playtime_updated_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      genre_translations: {
        Row: {
          description: string | null;
          genre_id: string | null;
          id: string;
          language_code: string | null;
          name: string;
        };
        Insert: {
          description?: string | null;
          genre_id?: string | null;
          id?: string;
          language_code?: string | null;
          name: string;
        };
        Update: {
          description?: string | null;
          genre_id?: string | null;
          id?: string;
          language_code?: string | null;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "genre_translations_genre_id_fkey";
            columns: ["genre_id"];
            isOneToOne: false;
            referencedRelation: "genres";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "genre_translations_language_code_fkey";
            columns: ["language_code"];
            isOneToOne: false;
            referencedRelation: "languages";
            referencedColumns: ["code"];
          },
        ];
      };
      genres: {
        Row: {
          created_at: string | null;
          id: string;
          slug: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          slug: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          slug?: string;
        };
        Relationships: [];
      };
      languages: {
        Row: {
          code: string;
          is_default: boolean | null;
          name: string;
          native_name: string;
        };
        Insert: {
          code: string;
          is_default?: boolean | null;
          name: string;
          native_name: string;
        };
        Update: {
          code?: string;
          is_default?: boolean | null;
          name?: string;
          native_name?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          email: string;
          username: string | null;
          id: string;
          preferred_locale: string | null;
          stats_private: boolean;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          email: string;
          username?: string | null;
          id: string;
          preferred_locale?: string | null;
          stats_private?: boolean;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          email?: string;
          username?: string | null;
          id?: string;
          preferred_locale?: string | null;
          stats_private?: boolean;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      rating_systems: {
        Row: {
          code: string;
          country_codes: string[] | null;
          created_at: string | null;
          description: string | null;
          id: string;
          name: string;
          website_url: string | null;
        };
        Insert: {
          code: string;
          country_codes?: string[] | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          website_url?: string | null;
        };
        Update: {
          code?: string;
          country_codes?: string[] | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          website_url?: string | null;
        };
        Relationships: [];
      };
      ratings: {
        Row: {
          code: string;
          color_hex: string | null;
          created_at: string | null;
          description: string | null;
          display_name: string;
          icon_url: string | null;
          id: string;
          minimum_age: number | null;
          rating_system_id: string | null;
          sort_order: number | null;
        };
        Insert: {
          code: string;
          color_hex?: string | null;
          created_at?: string | null;
          description?: string | null;
          display_name: string;
          icon_url?: string | null;
          id?: string;
          minimum_age?: number | null;
          rating_system_id?: string | null;
          sort_order?: number | null;
        };
        Update: {
          code?: string;
          color_hex?: string | null;
          created_at?: string | null;
          description?: string | null;
          display_name?: string;
          icon_url?: string | null;
          id?: string;
          minimum_age?: number | null;
          rating_system_id?: string | null;
          sort_order?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "ratings_rating_system_id_fkey";
            columns: ["rating_system_id"];
            isOneToOne: false;
            referencedRelation: "rating_systems";
            referencedColumns: ["id"];
          },
        ];
      };
      stores: {
        Row: {
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          logo_url: string | null;
          name: string;
          updated_at: string | null;
          website_url: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          logo_url?: string | null;
          name: string;
          updated_at?: string | null;
          website_url?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          logo_url?: string | null;
          name?: string;
          updated_at?: string | null;
          website_url?: string | null;
        };
        Relationships: [];
      };
      supported_languages: {
        Row: {
          code: string;
          name: string;
          native_name: string | null;
        };
        Insert: {
          code: string;
          name: string;
          native_name?: string | null;
        };
        Update: {
          code?: string;
          name?: string;
          native_name?: string | null;
        };
        Relationships: [];
      };
      user_library: {
        Row: {
          id: string;
          user_id: string;
          game_id: string;
          added_at: string;
          status: string;
          play_time_hours: number;
          play_time_hastily: number | null;
          play_time_normally: number | null;
          play_time_completely: number | null;
          rating: number | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_id: string;
          added_at?: string;
          status?: string;
          play_time_hours?: number;
          play_time_hastily?: number | null;
          play_time_normally?: number | null;
          play_time_completely?: number | null;
          rating?: number | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_id?: string;
          added_at?: string;
          status?: string;
          play_time_hours?: number;
          play_time_hastily?: number | null;
          play_time_normally?: number | null;
          play_time_completely?: number | null;
          rating?: number | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_library_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_library_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      cleanup_orphaned_data: { Args: never; Returns: undefined };
      cleanup_orphaned_prices: { Args: never; Returns: undefined };
      cleanup_orphaned_rating_data: { Args: never; Returns: undefined };
      compare_game_prices: {
        Args: { game_uuid: string };
        Returns: {
          average_price: number;
          best_price: number;
          currency: string;
          game_id: string;
          price_range: number;
          stores_with_prices: Json;
          total_stores: number;
          worst_price: number;
        }[];
      };
      create_store: {
        Args: { logo_url?: string; store_name: string; website_url?: string };
        Returns: {
          message: string;
          store_id: string;
          success: boolean;
        }[];
      };
      get_active_stores: {
        Args: never;
        Returns: {
          created_at: string;
          id: string;
          is_active: boolean;
          logo_url: string;
          name: string;
          updated_at: string;
          website_url: string;
        }[];
      };
      get_best_price: {
        Args: { game_uuid: string };
        Returns: {
          created_at: string;
          currency: string;
          game_id: string;
          id: string;
          is_available: boolean;
          last_updated: string;
          platform: string;
          price: number;
          store_id: string;
          store_logo_url: string;
          store_name: string;
          store_url: string;
          store_website_url: string;
        }[];
      };
      get_game_companies: {
        Args: { company_role?: string; game_uuid: string };
        Returns: {
          company_id: string;
          company_name: string;
          company_slug: string;
          is_primary: boolean;
          role: string;
        }[];
      };
      get_price_history: {
        Args: {
          game_uuid: string;
          start_date?: string;
          end_date?: string;
          store_filter?: string;
          platform_filter?: string;
        };
        Returns: {
          id: string;
          game_id: string;
          store_id: string;
          store_name: string;
          store_logo_url: string;
          price: number;
          currency: string;
          platform: string;
          recorded_at: string;
        }[];
      };
      get_price_history_stats: {
        Args: { game_uuid: string };
        Returns: {
          min_price: number;
          max_price: number;
          avg_price: number;
          currency: string;
          total_snapshots: number;
        }[];
      };
      get_game_prices: {
        Args: {
          game_uuid: string;
          platform_filter?: string;
          store_filter?: string;
        };
        Returns: {
          created_at: string;
          currency: string;
          game_id: string;
          id: string;
          is_available: boolean;
          last_updated: string;
          platform: string;
          price: number;
          store_id: string;
          store_logo_url: string;
          store_name: string;
          store_url: string;
          store_website_url: string;
        }[];
      };
      get_primary_game_rating: {
        Args: { game_uuid: string; lang_code?: string };
        Returns: {
          color_hex: string;
          content_descriptors: Json;
          minimum_age: number;
          rating_display_name: string;
          rating_system_code: string;
        }[];
      };
      get_store_stats: {
        Args: { store_uuid: string };
        Returns: {
          average_price: number;
          highest_price: number;
          last_price_update: string;
          lowest_price: number;
          store_id: string;
          store_name: string;
          total_games: number;
        }[];
      };
      is_admin: { Args: { user_id?: string }; Returns: boolean };
      search_stores: {
        Args: { search_term: string };
        Returns: {
          created_at: string;
          id: string;
          is_active: boolean;
          logo_url: string;
          name: string;
          updated_at: string;
          website_url: string;
        }[];
      };
      update_store: {
        Args: {
          is_active?: boolean;
          logo_url?: string;
          store_id: string;
          store_name?: string;
          website_url?: string;
        };
        Returns: {
          message: string;
          success: boolean;
        }[];
      };
      validate_price_data: {
        Args: never;
        Returns: {
          issue_count: number;
          issue_type: string;
          sample_ids: string[];
          table_name: string;
        }[];
      };
      validate_store_data: {
        Args: { logo_url?: string; store_name: string; website_url?: string };
        Returns: {
          error_message: string;
          is_valid: boolean;
        }[];
      };
      get_user_library_stats: {
        Args: { user_uuid: string };
        Returns: {
          total_games: number;
          owned_games: number;
          completed_games: number;
          total_play_time: number;
          average_rating: number | null;
        }[];
      };
      is_game_in_user_library: {
        Args: { user_uuid: string; game_uuid: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
