/**
 * Page index du POC design — sommaire des 3 maquettes.
 */

import Link from "next/link";
import { DynamicAccent } from "@/components/design-poc/DynamicAccent";
import { MAGENTA_PALETTE } from "@/components/design-poc/palettes";
import { PocHeader } from "@/components/design-poc/PocHeader";
import { PocFooter } from "@/components/design-poc/PocFooter";
import { SpotlightCard } from "@/components/design-poc/SpotlightCard";

interface PageProps {
  params: Promise<{ locale: string }>;
}

const DEMOS = [
  {
    href: "home",
    label: "Home",
    desc: "Page d'accueil éditoriale : hero avec image inline, services numérotés, jeux trending, marquee, stats, news.",
    accent: "Magenta (couleur marque)",
  },
  {
    href: "game",
    label: "Game",
    desc: "Fiche d'un jeu façon magazine : hero plein cadre, ticker live, bento stats, description multi-colonnes. Switcher d'accent intégré.",
    accent: "Cyberpunk yellow / Valorant red / Cyan / Magenta",
  },
  {
    href: "player",
    label: "Player",
    desc: "Profil joueur asymétrique : hero avatar + identité, bento (recent games, achievements, win rate, post, friends).",
    accent: "Gold (rang prestige)",
  },
];

export default async function DesignPocIndexPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <DynamicAccent palette={MAGENTA_PALETTE}>
      <PocHeader locale={locale} pageLabel="Index POC" />

      <section className="mx-auto w-full max-w-[1600px] px-6 pb-16 pt-24 lg:px-12 lg:pb-24 lg:pt-32">
        <p className="poc-kicker mb-6">Internal · design preview</p>
        <h1 className="poc-display text-[clamp(3rem,8vw,7rem)] leading-[0.92] text-white">
          New direction —{" "}
          <span className="bg-gradient-to-r from-[var(--poc-accent-300)] to-[var(--poc-accent-500)] bg-clip-text text-transparent">
            editorial
          </span>{" "}
          gaming.
        </h1>
        <p className="poc-display-light mt-8 max-w-3xl text-2xl text-zinc-300">
          POC isolé inspiré du thème <span className="text-[var(--poc-accent-400)]">Imba</span>.
          Aucune page existante n&apos;est modifiée — supprimer{" "}
          <code className="poc-mono text-sm">src/app/[locale]/design-poc/</code> et{" "}
          <code className="poc-mono text-sm">src/components/design-poc/</code> annule
          intégralement le POC.
        </p>
      </section>

      <section className="mx-auto w-full max-w-[1600px] px-6 pb-32 lg:px-12">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {DEMOS.map((demo, i) => (
            <SpotlightCard
              key={demo.href}
              as="a"
              href={`/${locale}/design-poc/${demo.href}`}
              className="block p-8 lg:p-10"
            >
              <p className="poc-num">{String(i + 1).padStart(2, "0")}</p>
              <h2 className="poc-display mt-4 text-3xl text-white sm:text-4xl">{demo.label}</h2>
              <p className="mt-4 text-sm text-zinc-400 leading-relaxed">{demo.desc}</p>
              <div className="poc-divider my-6" />
              <p className="poc-kicker">Accent</p>
              <p className="poc-mono mt-2 text-sm text-[var(--poc-accent-400)]">{demo.accent}</p>
              <p className="mt-8 inline-flex items-center gap-2 text-sm text-white">
                Open demo →
              </p>
            </SpotlightCard>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-6 rounded-3xl border border-white/5 bg-white/[0.02] p-8 lg:p-10">
          <p className="poc-kicker">Notes pour relecture</p>
          <ul className="space-y-3 text-sm text-zinc-300 leading-relaxed">
            <li>
              <strong className="text-white">Typo</strong> — display Tomorrow + mono JetBrains Mono
              chargés via Google Fonts au sein du POC. Modifiable dans{" "}
              <code className="poc-mono text-xs">design-poc.css</code>.
            </li>
            <li>
              <strong className="text-white">Couleur dynamique</strong> — composant{" "}
              <code className="poc-mono text-xs">DynamicAccent</code> qui injecte 50→900 + RGB
              triplet en CSS vars. La page <code className="poc-mono text-xs">/game</code> permet
              de tester 4 palettes différentes.
            </li>
            <li>
              <strong className="text-white">Mouvement</strong> — spotlight cursor sur les cartes,
              fade-up à l&apos;arrivée, hover image scale, marquee infini.
            </li>
            <li>
              <strong className="text-white">Données</strong> — toutes mockées sur cette branche
              POC. Aucun appel API, aucune dépendance i18n/auth/SWR.
            </li>
            <li>
              <Link
                href={`/${locale}`}
                className="text-[var(--poc-accent-400)] hover:underline"
              >
                ← Retour au site existant (inchangé)
              </Link>
            </li>
          </ul>
        </div>
      </section>

      <PocFooter />
    </DynamicAccent>
  );
}
