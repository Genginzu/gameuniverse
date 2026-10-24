/**
 * AuthLayout : centre la carte d'authentification dans la zone de contenu
 * du shell éditorial (fourni par `src/app/[locale]/auth/layout.tsx`).
 */

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
