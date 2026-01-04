/**
 * Utilitaires pour nettoyer l'état d'authentification
 */

export const clearAuthCookies = () => {
  if (typeof window !== "undefined") {
    // Nettoyer tous les cookies Supabase
    const cookies = document.cookie.split(";");

    cookies.forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();

      // Supprimer les cookies Supabase
      if (name.startsWith("sb-") || name.includes("supabase")) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    });

    // Nettoyer le localStorage aussi
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("sb-") || key.includes("supabase")) {
        localStorage.removeItem(key);
      }
    });

    // Nettoyer le sessionStorage
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith("sb-") || key.includes("supabase")) {
        sessionStorage.removeItem(key);
      }
    });
  }
};

export const handleAuthError = async (error: any, supabase: any) => {
  console.error("Auth error:", error);

  // Si c'est une erreur de refresh token, nettoyer et rediriger
  if (error?.message?.includes("refresh") || error?.message?.includes("token")) {
    clearAuthCookies();
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }
};
