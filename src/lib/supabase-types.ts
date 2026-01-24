// Types personnalisés pour l'authentification et les profils
export interface Profile {
  id: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  preferred_locale: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProfileUpdate {
  username?: string;
  preferred_locale?: string;
  avatar_url?: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    username?: string;
    preferred_locale?: string;
  };
}
