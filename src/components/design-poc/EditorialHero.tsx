"use client";

/**
 * Hero éditorial style Imba : kicker + titre display géant avec image inline
 * (qui interrompt visuellement la phrase) + paragraphe à droite séparé par un trait fin.
 */

import Image from "next/image";

interface EditorialHeroProps {
  kicker: string;
  /** Mots du titre. `image` = un objet image inline qui s'insère entre 2 mots. */
  parts: Array<
    | { type: "text"; value: string; accent?: boolean }
    | { type: "break" }
    | { type: "image"; src: string; alt: string }
  >;
  description: string;
  ctas?: React.ReactNode;
  backgroundImage: string;
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
    <section className="relative min-h-[640px] overflow-hidden lg:min-h-[720px]">
      {/* Background photo immersive */}
      <Image
        src={backgroundImage}
        alt={backgroundAlt}
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
      <div className="poc-scanlines" />
      {/* Gradient pour lisibilité */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#120821]/70 via-[#120821]/40 to-[#120821]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#120821] to-transparent" />

      {/* Contenu */}
      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1600px] flex-col px-6 pb-16 pt-32 lg:px-12 lg:pb-24 lg:pt-44">
        <p className="poc-kicker poc-reveal mb-6">{kicker}</p>

        <h1 className="poc-display poc-reveal text-[clamp(3rem,8vw,7.5rem)] leading-[0.92]">
          <span className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white">
            {parts.map((part, idx) => {
              if (part.type === "text") {
                return (
                  <span
                    key={idx}
                    className={
                      part.accent
                        ? "bg-gradient-to-r from-[var(--poc-accent-300)] to-[var(--poc-accent-500)] bg-clip-text text-transparent"
                        : ""
                    }
                  >
                    {part.value}
                  </span>
                );
              }
              if (part.type === "break") return <br key={idx} className="basis-full" />;
              if (part.type === "image") {
                return (
                  <span
                    key={idx}
                    className="relative inline-block h-[0.9em] w-[1.6em] overflow-hidden rounded-full ring-2 ring-[var(--poc-accent-500)]/40"
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

        {/* Paragraphe + CTA en bas à droite */}
        <div className="mt-auto flex flex-col gap-8 pt-16 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xs lg:ml-auto lg:order-2">
            <div className="poc-divider mb-4 w-12 bg-[var(--poc-accent-400)]" />
            <p className="text-sm leading-relaxed text-zinc-300">{description}</p>
          </div>

          {ctas && <div className="flex flex-wrap items-center gap-3 lg:order-1">{ctas}</div>}
        </div>
      </div>
    </section>
  );
}
