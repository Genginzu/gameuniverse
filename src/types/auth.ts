// Types pour l'authentification

export type AuthMode = "signin" | "signup";

export interface AuthSuccessMessage {
  message: string;
  show: boolean;
}
