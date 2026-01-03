export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-center font-mono text-sm">
        <h1 className="mb-8 text-center text-4xl font-bold">Game Universe</h1>
        <p className="text-center text-lg text-muted-foreground">
          Découvrez l&apos;univers du jeu vidéo
        </p>
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Next.js 16 + TypeScript + Tailwind CSS + Bun
          </p>
        </div>
      </div>
    </main>
  );
}
