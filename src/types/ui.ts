// Types pour les composants UI de base (sans props)

export interface SpinnerConfig {
  size?: "sm" | "md" | "lg";
}

export interface LoadingSpinnerConfig {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
}

export interface GameUniverseLogoConfig {
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
}

// Types pour les composants UI génériques
export interface ButtonVariant {
  variant?: "default" | "destructive" | "outline-solid" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export interface InputVariant {
  variant?: "default" | "error" | "success";
  size?: "default" | "sm" | "lg";
}
