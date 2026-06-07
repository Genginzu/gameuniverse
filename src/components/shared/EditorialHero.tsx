"use client";

/**
 * Hero éditorial : kicker mono + titre display géant pouvant contenir
 * une image inline (qui interrompt visuellement la phrase) + paragraphe
 * description séparé par un trait fin + slot CTAs.
 *
 * Hérité du POC, adapté à la refonte éditoriale (variables CSS partagées,
 * pas de backdrop-blur). Voir docs/design/editorial-refonte-plan.md.
 */

import Image from "next/image";
import type { ReactNode } from "react";

export type EditorialHeroPart =
  | { type: "text"; value: string; accent?: boolean }
  | { type: "break" }
  | { type: "image"; src: string; alt: string };

interface EditorialHeroProps {
  /** Petit label uppercase mono au-dessus du titre. */
  kicker: string;
  /**
   * Mots du titre. `image` insère un visuel inline entre 2 mots,
   * `break` force un retour à la ligne.
   */
  parts: EditorialHeroPart[];
  /** Paragraphe descriptif court, affiché en bas à droite. */
  description: string;
  /** CTAs facultatifs (boutons, liens), rendus en bas à gauche. */
  ctas?: ReactNode;
  /** URL de l'image de fond plein cadre. */
  backgroundImage: string;
  /** Texte alternatif décrivant l'image de fond. */
  backgroundAlt: string;
}

export function EditorialHero({
  kicker,
  parts,
  description,
  ctas,
  backgroundImage,
  backgroundAlt,
}: EditorialHeroProps) {
  return (
    <section className="editorial-hero">
      <Image
        src={backgroundImage}
        alt={backgroundAlt}
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
      <div className="editorial-scanlines" aria-hidden />
      {/* Gradients de lisibilité au-dessus de l'image */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--editorial-bg)]/70 via-[var(--editorial-bg)]/40 to-[var(--editorial-bg)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[var(--editorial-bg)] to-transparent" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1600px] flex-col px-6 pt-32 pb-16 lg:px-12 lg:pt-44 lg:pb-24">
        <p className="editorial-kicker mb-6">{kicker}</p>

        <h1 className="editorial-display pb-6 text-[clamp(3rem,8vw,7.5rem)] !leading-[1.15]">
          <span className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white">
            {parts.map((part, idx) => {
              if (part.type === "text") {
                return (
                  <span
                    key={idx}
                    className={
                      part.accent
                        ? "bg-gradient-to-r from-[rgb(var(--neon-secondary))] to-[rgb(var(--neon-primary))] bg-clip-text text-transparent"
                        : ""
                    }
                  >
                    {part.value}
                  </span>
                );
              }
              if (part.type === "break") {
                return <br key={idx} className="basis-full" />;
              }
              if (part.type === "image") {
                return (
                  <span
                    key={idx}
                    className="relative inline-block h-[0.9em] w-[1.6em] overflow-hidden rounded-full ring-2 ring-[rgb(var(--neon-primary))]/40"
                    aria-hidden
                  >
                    <Image
                      src={part.src}
                      alt={part.alt}
                      fill
                      className="object-cover"
                      sizes="120px"
                    />
                  </span>
                );
              }
              return null;
            })}
          </span>
        </h1>

        <div className="mt-auto flex flex-col gap-8 pt-16 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xs lg:order-2 lg:ml-auto">
            <div className="editorial-divider mb-4 w-12" />
            <p className="text-sm leading-relaxed text-zinc-300">{description}</p>
          </div>

          {ctas && <div className="flex flex-wrap items-center gap-3 lg:order-1">{ctas}</div>}
        </div>
      </div>
    </section>
  );
}
