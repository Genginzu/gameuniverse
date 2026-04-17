export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      achievement_catalog: {
        Row: {
          category: string
          created_at: string
          description_en: string
          description_fr: string
          icon: string
          id: string
          key: string
          name_en: string
          name_fr: string
          sort_order: number
          threshold: number
          tier: string
          xp_value: number
        }
        Insert: {
          category: string
          created_at?: string
          description_en: string
          description_fr: string
          icon: string
          id?: string
          key: string
          name_en: string
          name_fr: string
          sort_order?: number
          threshold: number
          tier: string
          xp_value: number
        }
        Update: {
          category?: string
          created_at?: string
          description_en?: string
          description_fr?: string
          icon?: string
          id?: string
          key?: string
          name_en?: string
          name_fr?: string
          sort_order?: number
          threshold?: number
          tier?: string
          xp_value?: number
        }
        Relationships: []
      }
      character_character_roles: {
        Row: {
          character_id: string
          role_id: string
        }
        Insert: {
          character_id: string
          role_id: string
        }
        Update: {
          character_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_character_roles_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_character_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "character_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      character_comments: {
        Row: {
          character_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          character_id: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          character_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_comments_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_favorites: {
        Row: {
          character_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          character_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          character_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_favorites_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_field_overrides: {
        Row: {
          character_id: string
          field_name: string
          id: string
          overridden_at: string
          overridden_by: string | null
        }
        Insert: {
          character_id: string
          field_name: string
          id?: string
          overridden_at?: string
          overridden_by?: string | null
        }
        Update: {
          character_id?: string
          field_name?: string
          id?: string
          overridden_at?: string
          overridden_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_field_overrides_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_games: {
        Row: {
          character_id: string
          created_at: string | null
          game_id: string
          is_primary: boolean | null
        }
        Insert: {
          character_id: string
          created_at?: string | null
          game_id: string
          is_primary?: boolean | null
        }
        Update: {
          character_id?: string
          created_at?: string | null
          game_id?: string
          is_primary?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "character_games_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      character_media: {
        Row: {
          alt_text: string | null
          character_id: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_featured: boolean | null
          thumbnail_url: string | null
          title: string | null
          type: string
          url: string
        }
        Insert: {
          alt_text?: string | null
          character_id: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          thumbnail_url?: string | null
          title?: string | null
          type: string
          url: string
        }
        Update: {
          alt_text?: string | null
          character_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          thumbnail_url?: string | null
          title?: string | null
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_media_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_relationships: {
        Row: {
          character_id: string
          created_at: string | null
          description: string | null
          id: string
          related_character_id: string
          relationship_type: string
        }
        Insert: {
          character_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          related_character_id: string
          relationship_type: string
        }
        Update: {
          character_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          related_character_id?: string
          relationship_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_relationships_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_relationships_related_character_id_fkey"
            columns: ["related_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_role_translations: {
        Row: {
          description: string | null
          id: string
          language_code: string
          name: string
          role_id: string
        }
        Insert: {
          description?: string | null
          id?: string
          language_code: string
          name: string
          role_id: string
        }
        Update: {
          description?: string | null
          id?: string
          language_code?: string
          name?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_role_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "character_role_translations_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "character_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      character_roles: {
        Row: {
          created_at: string | null
          id: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          slug?: string
        }
        Relationships: []
      }
      character_translations: {
        Row: {
          biography: string | null
          character_id: string
          description: string | null
          id: string
          language_code: string
          name: string
          role: string | null
          weapons: string | null
        }
        Insert: {
          biography?: string | null
          character_id: string
          description?: string | null
          id?: string
          language_code: string
          name: string
          role?: string | null
          weapons?: string | null
        }
        Update: {
          biography?: string | null
          character_id?: string
          description?: string | null
          id?: string
          language_code?: string
          name?: string
          role?: string | null
          weapons?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_translations_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      characters: {
        Row: {
          background_color: string | null
          background_image: string | null
          created_at: string | null
          gender_id: string | null
          id: string
          igdb_id: number | null
          main_image: string | null
          slug: string
          species_id: string | null
          updated_at: string | null
          view_count: number
        }
        Insert: {
          background_color?: string | null
          background_image?: string | null
          created_at?: string | null
          gender_id?: string | null
          id?: string
          igdb_id?: number | null
          main_image?: string | null
          slug: string
          species_id?: string | null
          updated_at?: string | null
          view_count?: number
        }
        Update: {
          background_color?: string | null
          background_image?: string | null
          created_at?: string | null
          gender_id?: string | null
          id?: string
          igdb_id?: number | null
          main_image?: string | null
          slug?: string
          species_id?: string | null
          updated_at?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "characters_gender_id_fkey"
            columns: ["gender_id"]
            isOneToOne: false
            referencedRelation: "genders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          company_type: string | null
          created_at: string | null
          founded_year: number | null
          headquarters: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          slug: string
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          company_type?: string | null
          created_at?: string | null
          founded_year?: number | null
          headquarters?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          company_type?: string | null
          created_at?: string | null
          founded_year?: number | null
          headquarters?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      company_translations: {
        Row: {
          company_id: string | null
          description: string | null
          id: string
          language_code: string | null
        }
        Insert: {
          company_id?: string | null
          description?: string | null
          id?: string
          language_code?: string | null
        }
        Update: {
          company_id?: string | null
          description?: string | null
          id?: string
          language_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_translations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      content_descriptor_translations: {
        Row: {
          content_descriptor_id: string | null
          description: string | null
          id: string
          language_code: string | null
          name: string
        }
        Insert: {
          content_descriptor_id?: string | null
          description?: string | null
          id?: string
          language_code?: string | null
          name: string
        }
        Update: {
          content_descriptor_id?: string | null
          description?: string | null
          id?: string
          language_code?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_descriptor_translations_content_descriptor_id_fkey"
            columns: ["content_descriptor_id"]
            isOneToOne: false
            referencedRelation: "content_descriptors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_descriptor_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      content_descriptors: {
        Row: {
          code: string
          created_at: string | null
          icon_url: string | null
          id: string
          rating_system_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          icon_url?: string | null
          id?: string
          rating_system_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          icon_url?: string | null
          id?: string
          rating_system_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_descriptors_rating_system_id_fkey"
            columns: ["rating_system_id"]
            isOneToOne: false
            referencedRelation: "rating_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          participant_1: string
          participant_2: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          participant_1: string
          participant_2: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          participant_1?: string
          participant_2?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_participant_1_fkey"
            columns: ["participant_1"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_2_fkey"
            columns: ["participant_2"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string | null
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friendships_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_artwork: {
        Row: {
          alt_text: string | null
          artwork_type: string | null
          caption: string | null
          created_at: string | null
          display_order: number | null
          game_id: string
          id: string
          is_featured: boolean | null
          url: string
        }
        Insert: {
          alt_text?: string | null
          artwork_type?: string | null
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          game_id: string
          id?: string
          is_featured?: boolean | null
          url: string
        }
        Update: {
          alt_text?: string | null
          artwork_type?: string | null
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          game_id?: string
          id?: string
          is_featured?: boolean | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_artwork_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_collection_items: {
        Row: {
          added_at: string
          collection_id: string
          game_id: string
          id: string
          note: string | null
          position: number
        }
        Insert: {
          added_at?: string
          collection_id: string
          game_id: string
          id?: string
          note?: string | null
          position?: number
        }
        Update: {
          added_at?: string
          collection_id?: string
          game_id?: string
          id?: string
          note?: string | null
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "game_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_collection_items_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_collections: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      game_companies: {
        Row: {
          company_id: string
          created_at: string | null
          game_id: string
          id: string
          is_primary: boolean | null
          role: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          game_id: string
          id?: string
          is_primary?: boolean | null
          role: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          game_id?: string
          id?: string
          is_primary?: boolean | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_companies_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_dlc_extensions: {
        Row: {
          category: string
          cover_image_url: string | null
          created_at: string | null
          display_order: number | null
          game_id: string
          id: string
          igdb_id: number
          name: string
          release_date: string | null
          slug: string | null
          summary: string | null
        }
        Insert: {
          category: string
          cover_image_url?: string | null
          created_at?: string | null
          display_order?: number | null
          game_id: string
          id?: string
          igdb_id: number
          name: string
          release_date?: string | null
          slug?: string | null
          summary?: string | null
        }
        Update: {
          category?: string
          cover_image_url?: string | null
          created_at?: string | null
          display_order?: number | null
          game_id?: string
          id?: string
          igdb_id?: number
          name?: string
          release_date?: string | null
          slug?: string | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_dlc_extensions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_field_overrides: {
        Row: {
          field_name: string
          game_id: string
          id: string
          modified_at: string
          modified_by: string | null
        }
        Insert: {
          field_name: string
          game_id: string
          id?: string
          modified_at?: string
          modified_by?: string | null
        }
        Update: {
          field_name?: string
          game_id?: string
          id?: string
          modified_at?: string
          modified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_field_overrides_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_genres: {
        Row: {
          game_id: string
          genre_id: string
        }
        Insert: {
          game_id: string
          genre_id: string
        }
        Update: {
          game_id?: string
          genre_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_genres_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_genres_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
        ]
      }
      game_languages: {
        Row: {
          created_at: string | null
          game_id: string
          has_audio: boolean | null
          has_interface: boolean | null
          has_subtitles: boolean | null
          id: string
          language_code: string
          language_name: string
        }
        Insert: {
          created_at?: string | null
          game_id: string
          has_audio?: boolean | null
          has_interface?: boolean | null
          has_subtitles?: boolean | null
          id?: string
          language_code: string
          language_name: string
        }
        Update: {
          created_at?: string | null
          game_id?: string
          has_audio?: boolean | null
          has_interface?: boolean | null
          has_subtitles?: boolean | null
          id?: string
          language_code?: string
          language_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_languages_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_music: {
        Row: {
          composer: string | null
          created_at: string
          game_id: string
          id: string
          spotify_embed_url: string | null
          updated_at: string
          youtube_video_url: string | null
        }
        Insert: {
          composer?: string | null
          created_at?: string
          game_id: string
          id?: string
          spotify_embed_url?: string | null
          updated_at?: string
          youtube_video_url?: string | null
        }
        Update: {
          composer?: string | null
          created_at?: string
          game_id?: string
          id?: string
          spotify_embed_url?: string | null
          updated_at?: string
          youtube_video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_music_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: true
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_platforms: {
        Row: {
          game_id: string
          platform_id: string
        }
        Insert: {
          game_id: string
          platform_id: string
        }
        Update: {
          game_id?: string
          platform_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_platforms_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_platforms_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      game_price_history: {
        Row: {
          currency: string
          game_id: string
          id: string
          platform: string
          price: number
          recorded_at: string
          store_id: string
        }
        Insert: {
          currency?: string
          game_id: string
          id?: string
          platform: string
          price: number
          recorded_at?: string
          store_id: string
        }
        Update: {
          currency?: string
          game_id?: string
          id?: string
          platform?: string
          price?: number
          recorded_at?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_price_history_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_price_history_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      game_prices: {
        Row: {
          created_at: string | null
          currency: string
          game_id: string
          id: string
          is_available: boolean | null
          last_updated: string | null
          platform: string
          price: number
          store_id: string
          store_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string
          game_id: string
          id?: string
          is_available?: boolean | null
          last_updated?: string | null
          platform: string
          price: number
          store_id: string
          store_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          game_id?: string
          id?: string
          is_available?: boolean | null
          last_updated?: string | null
          platform?: string
          price?: number
          store_id?: string
          store_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_prices_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_prices_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      game_rating_descriptors: {
        Row: {
          content_descriptor_id: string
          game_rating_id: string
        }
        Insert: {
          content_descriptor_id: string
          game_rating_id: string
        }
        Update: {
          content_descriptor_id?: string
          game_rating_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_rating_descriptors_content_descriptor_id_fkey"
            columns: ["content_descriptor_id"]
            isOneToOne: false
            referencedRelation: "content_descriptors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rating_descriptors_game_rating_id_fkey"
            columns: ["game_rating_id"]
            isOneToOne: false
            referencedRelation: "game_ratings"
            referencedColumns: ["id"]
          },
        ]
      }
      game_ratings: {
        Row: {
          assigned_date: string | null
          created_at: string | null
          game_id: string | null
          id: string
          is_primary: boolean | null
          rating_id: string | null
        }
        Insert: {
          assigned_date?: string | null
          created_at?: string | null
          game_id?: string | null
          id?: string
          is_primary?: boolean | null
          rating_id?: string | null
        }
        Update: {
          assigned_date?: string | null
          created_at?: string | null
          game_id?: string | null
          id?: string
          is_primary?: boolean | null
          rating_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_ratings_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_ratings_rating_id_fkey"
            columns: ["rating_id"]
            isOneToOne: false
            referencedRelation: "ratings"
            referencedColumns: ["id"]
          },
        ]
      }
      game_reviews: {
        Row: {
          content: string
          created_at: string
          game_id: string
          id: string
          negative_points: string[]
          positive_points: string[]
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          game_id: string
          id?: string
          negative_points?: string[]
          positive_points?: string[]
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          game_id?: string
          id?: string
          negative_points?: string[]
          positive_points?: string[]
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_reviews_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_screenshots: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string | null
          display_order: number | null
          game_id: string
          id: string
          is_featured: boolean | null
          url: string
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          game_id: string
          id?: string
          is_featured?: boolean | null
          url: string
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          game_id?: string
          id?: string
          is_featured?: boolean | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_screenshots_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          duration_minutes: number
          ended_at: string
          game_id: string
          id: string
          started_at: string
          user_id: string
        }
        Insert: {
          duration_minutes?: number
          ended_at: string
          game_id: string
          id?: string
          started_at: string
          user_id: string
        }
        Update: {
          duration_minutes?: number
          ended_at?: string
          game_id?: string
          id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_similar_games: {
        Row: {
          created_at: string | null
          display_order: number | null
          game_id: string
          id: string
          similar_game_id: string | null
          similar_igdb_id: number
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          game_id: string
          id?: string
          similar_game_id?: string | null
          similar_igdb_id: number
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          game_id?: string
          id?: string
          similar_game_id?: string | null
          similar_igdb_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_similar_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_similar_games_similar_game_id_fkey"
            columns: ["similar_game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_translations: {
        Row: {
          description: string | null
          game_id: string | null
          id: string
          language_code: string | null
          storyline: string | null
          title: string
        }
        Insert: {
          description?: string | null
          game_id?: string | null
          id?: string
          language_code?: string | null
          storyline?: string | null
          title: string
        }
        Update: {
          description?: string | null
          game_id?: string | null
          id?: string
          language_code?: string | null
          storyline?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_translations_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      game_version_translations: {
        Row: {
          created_at: string | null
          description: string | null
          game_version_id: string
          id: string
          language_code: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          game_version_id: string
          id?: string
          language_code: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          game_version_id?: string
          id?: string
          language_code?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_version_translations_game_version_id_fkey"
            columns: ["game_version_id"]
            isOneToOne: false
            referencedRelation: "game_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_versions: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          game_id: string
          id: string
          igdb_id: number
          version_title: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          game_id: string
          id?: string
          igdb_id: number
          version_title: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          game_id?: string
          id?: string
          igdb_id?: number
          version_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_versions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_videos: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          duration_seconds: number | null
          game_id: string
          id: string
          is_featured: boolean | null
          thumbnail_url: string | null
          title: string
          url: string
          video_type: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_seconds?: number | null
          game_id: string
          id?: string
          is_featured?: boolean | null
          thumbnail_url?: string | null
          title: string
          url: string
          video_type?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_seconds?: number | null
          game_id?: string
          id?: string
          is_featured?: boolean | null
          thumbnail_url?: string | null
          title?: string
          url?: string
          video_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_videos_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          accent_color: string | null
          background_color: string | null
          background_image_url: string | null
          cover_image_url: string | null
          created_at: string | null
          id: string
          igdb_id: number | null
          label_color: string | null
          last_activity_at: string | null
          last_synced_at: string | null
          metascore: number | null
          playtime_completely: number | null
          playtime_hastily: number | null
          playtime_normally: number | null
          playtime_updated_at: string | null
          popularity_score: number | null
          release_date: string | null
          slug: string
          system_requirements: Json | null
          text_color: string | null
          updated_at: string | null
          view_count: number
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          background_image_url?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          id?: string
          igdb_id?: number | null
          label_color?: string | null
          last_activity_at?: string | null
          last_synced_at?: string | null
          metascore?: number | null
          playtime_completely?: number | null
          playtime_hastily?: number | null
          playtime_normally?: number | null
          playtime_updated_at?: string | null
          popularity_score?: number | null
          release_date?: string | null
          slug: string
          system_requirements?: Json | null
          text_color?: string | null
          updated_at?: string | null
          view_count?: number
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          background_image_url?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          id?: string
          igdb_id?: number | null
          label_color?: string | null
          last_activity_at?: string | null
          last_synced_at?: string | null
          metascore?: number | null
          playtime_completely?: number | null
          playtime_hastily?: number | null
          playtime_normally?: number | null
          playtime_updated_at?: string | null
          popularity_score?: number | null
          release_date?: string | null
          slug?: string
          system_requirements?: Json | null
          text_color?: string | null
          updated_at?: string | null
          view_count?: number
        }
        Relationships: []
      }
      gender_translations: {
        Row: {
          gender_id: string
          id: string
          language_code: string
          name: string
        }
        Insert: {
          gender_id: string
          id?: string
          language_code: string
          name: string
        }
        Update: {
          gender_id?: string
          id?: string
          language_code?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "gender_translations_gender_id_fkey"
            columns: ["gender_id"]
            isOneToOne: false
            referencedRelation: "genders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gender_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      genders: {
        Row: {
          created_at: string | null
          id: string
          igdb_id: number | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          igdb_id?: number | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          igdb_id?: number | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      genre_translations: {
        Row: {
          description: string | null
          genre_id: string | null
          id: string
          language_code: string | null
          name: string
        }
        Insert: {
          description?: string | null
          genre_id?: string | null
          id?: string
          language_code?: string | null
          name: string
        }
        Update: {
          description?: string | null
          genre_id?: string | null
          id?: string
          language_code?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "genre_translations_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "genre_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      genres: {
        Row: {
          created_at: string | null
          id: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          slug?: string
        }
        Relationships: []
      }
      igdb_global_sync: {
        Row: {
          cover_image_id: string | null
          created_at: string | null
          id: number
          igdb_id: number
          is_colors_synced: boolean | null
          is_enriched: boolean | null
          is_metascore_synced: boolean | null
          is_synced: boolean | null
          matched_game_id: string | null
          name: string
        }
        Insert: {
          cover_image_id?: string | null
          created_at?: string | null
          id?: number
          igdb_id: number
          is_colors_synced?: boolean | null
          is_enriched?: boolean | null
          is_metascore_synced?: boolean | null
          is_synced?: boolean | null
          matched_game_id?: string | null
          name: string
        }
        Update: {
          cover_image_id?: string | null
          created_at?: string | null
          id?: number
          igdb_id?: number
          is_colors_synced?: boolean | null
          is_enriched?: boolean | null
          is_metascore_synced?: boolean | null
          is_synced?: boolean | null
          matched_game_id?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "igdb_global_sync_matched_game_id_fkey"
            columns: ["matched_game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      igdb_webhook_events: {
        Row: {
          character_id: string | null
          created_at: string
          entity_type: string
          error_message: string | null
          event_type: string
          game_id: string | null
          id: string
          igdb_id: number
          payload: Json
          processed_at: string | null
          status: string
        }
        Insert: {
          character_id?: string | null
          created_at?: string
          entity_type: string
          error_message?: string | null
          event_type: string
          game_id?: string | null
          id?: string
          igdb_id: number
          payload?: Json
          processed_at?: string | null
          status?: string
        }
        Update: {
          character_id?: string | null
          created_at?: string
          entity_type?: string
          error_message?: string | null
          event_type?: string
          game_id?: string | null
          id?: string
          igdb_id?: number
          payload?: Json
          processed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "igdb_webhook_events_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "igdb_webhook_events_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      languages: {
        Row: {
          code: string
          is_default: boolean | null
          name: string
          native_name: string
        }
        Insert: {
          code: string
          is_default?: boolean | null
          name: string
          native_name: string
        }
        Update: {
          code?: string
          is_default?: boolean | null
          name?: string
          native_name?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content_preview: string
          created_at: string
          id: string
          is_read: boolean
          recipient_id: string
          reference_id: string
          sender_id: string
          type: string
        }
        Insert: {
          content_preview?: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id: string
          reference_id: string
          sender_id: string
          type: string
        }
        Update: {
          content_preview?: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id?: string
          reference_id?: string
          sender_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_translations: {
        Row: {
          abbreviation: string | null
          id: string
          language_code: string
          name: string
          platform_id: string
        }
        Insert: {
          abbreviation?: string | null
          id?: string
          language_code: string
          name: string
          platform_id: string
        }
        Update: {
          abbreviation?: string | null
          id?: string
          language_code?: string
          name?: string
          platform_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_translations_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      platforms: {
        Row: {
          created_at: string
          icon_url: string | null
          id: string
          igdb_id: number | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon_url?: string | null
          id?: string
          igdb_id?: number | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon_url?: string | null
          id?: string
          igdb_id?: number | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      player_achievements: {
        Row: {
          achievement_key: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_key: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_key?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      player_goals: {
        Row: {
          created_at: string
          current_value: number
          deadline: string | null
          goal_type: string
          id: string
          target_value: number
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number
          deadline?: string | null
          goal_type: string
          id?: string
          target_value: number
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number
          deadline?: string | null
          goal_type?: string
          id?: string
          target_value?: number
          user_id?: string
        }
        Relationships: []
      }
      player_linked_platforms: {
        Row: {
          access_token: string | null
          auth_type: string
          created_at: string | null
          external_id: string | null
          id: string
          platform: string
          platform_username: string | null
          player_id: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          auth_type?: string
          created_at?: string | null
          external_id?: string | null
          id?: string
          platform: string
          platform_username?: string | null
          player_id: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          auth_type?: string
          created_at?: string | null
          external_id?: string | null
          id?: string
          platform?: string
          platform_username?: string | null
          player_id?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_linked_platforms_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          player_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          player_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          player_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_posts_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_xp: {
        Row: {
          id: string
          updated_at: string
          user_id: string
          xp_total: number
        }
        Insert: {
          id?: string
          updated_at?: string
          user_id: string
          xp_total?: number
        }
        Update: {
          id?: string
          updated_at?: string
          user_id?: string
          xp_total?: number
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          player_id: string
          post_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          player_id: string
          post_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          player_id?: string
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "player_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_mentions: {
        Row: {
          id: string
          mentioned_player_id: string
          post_id: string
        }
        Insert: {
          id?: string
          mentioned_player_id: string
          post_id: string
        }
        Update: {
          id?: string
          mentioned_player_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_mentions_mentioned_player_id_fkey"
            columns: ["mentioned_player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_mentions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "player_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_tags: {
        Row: {
          id: string
          post_id: string
          tag: string
        }
        Insert: {
          id?: string
          post_id: string
          tag: string
        }
        Update: {
          id?: string
          post_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "player_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          created_at: string | null
          email: string
          id: string
          level: number | null
          preferred_locale: string | null
          social_links: Json | null
          stats_private: boolean | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          created_at?: string | null
          email: string
          id: string
          level?: number | null
          preferred_locale?: string | null
          social_links?: Json | null
          stats_private?: boolean | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          level?: number | null
          preferred_locale?: string | null
          social_links?: Json | null
          stats_private?: boolean | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      rating_systems: {
        Row: {
          code: string
          country_codes: string[] | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          website_url: string | null
        }
        Insert: {
          code: string
          country_codes?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          website_url?: string | null
        }
        Update: {
          code?: string
          country_codes?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          website_url?: string | null
        }
        Relationships: []
      }
      rating_translations: {
        Row: {
          description: string
          id: string
          language_code: string
          rating_id: string
        }
        Insert: {
          description: string
          id?: string
          language_code: string
          rating_id: string
        }
        Update: {
          description?: string
          id?: string
          language_code?: string
          rating_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rating_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "rating_translations_rating_id_fkey"
            columns: ["rating_id"]
            isOneToOne: false
            referencedRelation: "ratings"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          code: string
          color_hex: string | null
          created_at: string | null
          description: string | null
          display_name: string
          icon_url: string | null
          id: string
          minimum_age: number | null
          rating_system_id: string | null
          sort_order: number | null
        }
        Insert: {
          code: string
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          display_name: string
          icon_url?: string | null
          id?: string
          minimum_age?: number | null
          rating_system_id?: string | null
          sort_order?: number | null
        }
        Update: {
          code?: string
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          icon_url?: string | null
          id?: string
          minimum_age?: number | null
          rating_system_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ratings_rating_system_id_fkey"
            columns: ["rating_system_id"]
            isOneToOne: false
            referencedRelation: "rating_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      review_votes: {
        Row: {
          created_at: string
          id: string
          review_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "game_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      species: {
        Row: {
          created_at: string | null
          id: string
          igdb_id: number | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          igdb_id?: number | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          igdb_id?: number | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      species_translations: {
        Row: {
          id: string
          language_code: string
          name: string
          species_id: string
        }
        Insert: {
          id?: string
          language_code: string
          name: string
          species_id: string
        }
        Update: {
          id?: string
          language_code?: string
          name?: string
          species_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "species_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "species_translations_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      supported_languages: {
        Row: {
          code: string
          name: string
          native_name: string
        }
        Insert: {
          code: string
          name: string
          native_name: string
        }
        Update: {
          code?: string
          name?: string
          native_name?: string
        }
        Relationships: []
      }
      translation_stats_cache: {
        Row: {
          complete: number
          entity_type: string
          language_code: string
          missing: number
          partial: number
          percentage: number
          total: number
          updated_at: string
        }
        Insert: {
          complete?: number
          entity_type: string
          language_code: string
          missing?: number
          partial?: number
          percentage?: number
          total?: number
          updated_at?: string
        }
        Update: {
          complete?: number
          entity_type?: string
          language_code?: string
          missing?: number
          partial?: number
          percentage?: number
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_library: {
        Row: {
          added_at: string | null
          game_id: string
          id: string
          notes: string | null
          play_time_completely: number | null
          play_time_hastily: number | null
          play_time_hours: number | null
          play_time_normally: number | null
          rating: number | null
          status: string | null
          user_id: string
        }
        Insert: {
          added_at?: string | null
          game_id: string
          id?: string
          notes?: string | null
          play_time_completely?: number | null
          play_time_hastily?: number | null
          play_time_hours?: number | null
          play_time_normally?: number | null
          rating?: number | null
          status?: string | null
          user_id: string
        }
        Update: {
          added_at?: string | null
          game_id?: string
          id?: string
          notes?: string | null
          play_time_completely?: number | null
          play_time_hastily?: number | null
          play_time_hours?: number | null
          play_time_normally?: number | null
          rating?: number | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_library_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_orphaned_data: { Args: never; Returns: undefined }
      cleanup_orphaned_prices: { Args: never; Returns: undefined }
      cleanup_orphaned_rating_data: { Args: never; Returns: undefined }
      compare_game_prices: {
        Args: { game_uuid: string }
        Returns: {
          average_price: number
          best_price: number
          currency: string
          game_id: string
          price_range: number
          stores_with_prices: Json
          total_stores: number
          worst_price: number
        }[]
      }
      create_store: {
        Args: { logo_url?: string; store_name: string; website_url?: string }
        Returns: {
          message: string
          store_id: string
          success: boolean
        }[]
      }
      fast_count_estimate: { Args: { table_name: string }; Returns: number }
      get_active_stores: {
        Args: never
        Returns: {
          created_at: string
          id: string
          is_active: boolean
          logo_url: string
          name: string
          updated_at: string
          website_url: string
        }[]
      }
      get_admin_games_listing: {
        Args: {
          p_limit?: number
          p_locale?: string
          p_offset?: number
          p_search?: string
          p_sort_by?: string
          p_sort_order?: string
        }
        Returns: Json
      }
      get_best_price: {
        Args: { game_uuid: string }
        Returns: {
          created_at: string
          currency: string
          game_id: string
          id: string
          is_available: boolean
          last_updated: string
          platform: string
          price: number
          store_id: string
          store_logo_url: string
          store_name: string
          store_url: string
          store_website_url: string
        }[]
      }
      get_character_favorite_count: {
        Args: { character_uuid: string }
        Returns: number
      }
      get_common_games: {
        Args: {
          current_user_id: string
          game_locale?: string
          page_number?: number
          page_size?: number
          target_player_id: string
        }
        Returns: {
          cover_image_url: string
          game_id: string
          genre_names: string[]
          slug: string
          title: string
          total_count: number
        }[]
      }
      get_game_companies: {
        Args: { company_role?: string; game_uuid: string }
        Returns: {
          company_id: string
          company_name: string
          company_slug: string
          is_primary: boolean
          role: string
        }[]
      }
      get_game_prices: {
        Args: {
          game_uuid: string
          platform_filter?: string
          store_filter?: string
        }
        Returns: {
          created_at: string
          currency: string
          game_id: string
          id: string
          is_available: boolean
          last_updated: string
          platform: string
          price: number
          store_id: string
          store_logo_url: string
          store_name: string
          store_url: string
          store_website_url: string
        }[]
      }
      get_games_listing: {
        Args: {
          p_game_ids?: string[]
          p_in_library?: boolean
          p_include_description?: boolean
          p_limit?: number
          p_locale?: string
          p_offset?: number
          p_user_id?: string
        }
        Returns: Json
      }
      get_missing_translations: {
        Args: {
          p_entity_type: string
          p_languages: string[]
          p_limit?: number
          p_page?: number
          p_required_fields: string[]
          p_search?: string
        }
        Returns: {
          entity_id: string
          identifier: string
          total_count: number
        }[]
      }
      get_player_activity: {
        Args: {
          event_type?: string
          locale_code?: string
          page_number?: number
          page_size?: number
          player_uuid: string
        }
        Returns: Json
      }
      get_price_history: {
        Args: {
          end_date?: string
          game_uuid: string
          platform_filter?: string
          start_date?: string
          store_filter?: string
        }
        Returns: {
          currency: string
          game_id: string
          id: string
          platform: string
          price: number
          recorded_at: string
          store_id: string
          store_logo_url: string
          store_name: string
        }[]
      }
      get_price_history_stats: {
        Args: { game_uuid: string }
        Returns: {
          avg_price: number
          currency: string
          max_price: number
          min_price: number
          total_snapshots: number
        }[]
      }
      get_primary_game_rating: {
        Args: { game_uuid: string; lang_code?: string }
        Returns: {
          color_hex: string
          content_descriptors: Json
          minimum_age: number
          rating_display_name: string
          rating_system_code: string
        }[]
      }
      get_store_stats: {
        Args: { store_uuid: string }
        Returns: {
          average_price: number
          highest_price: number
          last_price_update: string
          lowest_price: number
          store_id: string
          store_name: string
          total_games: number
        }[]
      }
      get_user_games_count: { Args: { user_uuid: string }; Returns: number }
      get_user_library_stats: {
        Args: { user_uuid: string }
        Returns: {
          average_rating: number
          completed_games: number
          owned_games: number
          total_games: number
          total_play_time: number
        }[]
      }
      increment_character_view_count: {
        Args: { p_character_id: string }
        Returns: undefined
      }
      increment_game_view_count: {
        Args: { p_game_id: string }
        Returns: undefined
      }
      is_admin: { Args: { user_id?: string }; Returns: boolean }
      is_character_favorited: {
        Args: { character_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_game_in_user_library: {
        Args: { game_uuid: string; user_uuid: string }
        Returns: boolean
      }
      refresh_translation_stats: { Args: never; Returns: undefined }
      refresh_translation_stats_cross_lang: {
        Args: {
          p_entity_type: string
          p_fk_column: string
          p_languages?: string[]
          p_required_fields: string[]
          p_translation_table: string
        }
        Returns: undefined
      }
      refresh_translation_stats_for_type: {
        Args: {
          p_entity_type: string
          p_fk_column: string
          p_required_fields: string[]
          p_translation_table: string
        }
        Returns: undefined
      }
      search_stores: {
        Args: { search_term: string }
        Returns: {
          created_at: string
          id: string
          is_active: boolean
          logo_url: string
          name: string
          updated_at: string
          website_url: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      update_store: {
        Args: {
          is_active_param?: boolean
          logo_url_param?: string
          store_id: string
          store_name?: string
          website_url_param?: string
        }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      validate_price_data: {
        Args: never
        Returns: {
          issue_count: number
          issue_type: string
          sample_ids: string[]
          table_name: string
        }[]
      }
      validate_store_data: {
        Args: { logo_url?: string; store_name: string; website_url?: string }
        Returns: {
          error_message: string
          is_valid: boolean
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
