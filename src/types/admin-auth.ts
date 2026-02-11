// Types pour l'authentification admin

export type UserRole = "admin" | "contributor" | "user";

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
}
