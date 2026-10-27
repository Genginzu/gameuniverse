"use client";

/**
 * Hero éditorial : kicker mono + titre display géant pouvant contenir
 * une image inline (qui interrompt visuellement la phrase) + paragraphe
 * description séparé par un trait fin + slot CTAs.
 *
 * Hérité du POC, adapté à la refonte éditoriale (variables CSS partagées,
 * pas de backdrop-blur). Voir docs/design/editorial-refonte-plan.md.
 */

import { AppImage } from "@/components/ui/app-image";
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
    <section className="editorial-hero flex">
      <AppImage
        src={backgroundImage}
        alt={backgroundAlt}
        fill
        priority
        className="object-cover object-[70%_center] lg:object-center"
        sizes="100vw"
      />
      {/* Readability only where the text sits: top on mobile, left third on desktop. */}
      <div
        className="from-editorial-bg/90 via-editorial-bg/60 lg:via-editorial-bg/40 absolute inset-0 bg-gradient-to-b to-transparent lg:bg-gradient-to-r lg:to-transparent lg:to-60%"
        aria-hidden
      />
      <div
        className="from-editorial-bg absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t to-transparent"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col justify-center px-6 py-16 lg:px-12 lg:py-20">
        <p className="editorial-kicker mb-4">{kicker}</p>

        <h1 className="editorial-display text-[clamp(2.75rem,6vw,5.5rem)] !leading-[1.05]">
          <span className="flex flex-wrap items-center gap-x-[0.25em] gap-y-0 text-white">
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
                    <AppImage
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

        <p className="mt-6 max-w-md text-base leading-relaxed text-zinc-200 lg:text-lg">
          {description}
        </p>

        {ctas && <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{ctas}</div>}
      </div>
    </section>
  );
}
