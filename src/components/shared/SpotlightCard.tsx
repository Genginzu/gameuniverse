"use client";

/**
 * Carte avec halo lumineux qui suit le curseur (style Linear, Resend).
 *
 * Met à jour les CSS variables `--spotlight-mx` et `--spotlight-my` au hover
 * pour que le radial-gradient de `.spotlight-card` (défini dans globals.css)
 * positionne sa lumière sous le curseur.
 *
 * Variante éditoriale : pas de `backdrop-blur` (cf retrait du glassmorphism
 * dans la refonte). Conserve uniquement le radial-gradient subtil + les
 * transparences blanches très légères, qui ne sont pas du glassmorphism
 * technique.
 *
 * Voir `docs/design/editorial-refonte-plan.md` section 3.
 */

import { useRef, type CSSProperties, type MouseEvent, type ReactNode } from "react";

type SpotlightTag = "div" | "article" | "section" | "a";

interface SpotlightCardBaseProps {
  children: ReactNode;
  className?: string;
  /**
   * Triplet RGB (sans virgules ni parenthèses) override pour la couleur du
   * halo — ex `"168 85 247"` pour du violet. Par défaut, utilise
   * `--neon-primary` du thème (variable existante).
   */
  glowColor?: string;
}

interface SpotlightCardDivProps extends SpotlightCardBaseProps {
  as?: Exclude<SpotlightTag, "a">;
  href?: never;
}

interface SpotlightCardAnchorProps extends SpotlightCardBaseProps {
  as: "a";
  href: string;
  target?: string;
  rel?: string;
}

export type SpotlightCardProps = SpotlightCardDivProps | SpotlightCardAnchorProps;

export function SpotlightCard(props: SpotlightCardProps) {
  const { children, className = "", as: Tag = "div", glowColor } = props;
  const ref = useRef<HTMLElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    node.style.setProperty("--spotlight-mx", `${x}%`);
    node.style.setProperty("--spotlight-my", `${y}%`);
  };

  const style: CSSProperties | undefined = glowColor
    ? ({ "--spotlight-glow": glowColor } as CSSProperties)
    : undefined;

  // Tag dispatch — TypeScript ne peut pas inférer correctement les props
  // d'intersection pour les éléments JSX intrinsèques, on utilise donc un
  // switch explicite.
  if (Tag === "a") {
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        onMouseMove={handleMouseMove}
        className={`spotlight-card ${className}`.trim()}
        href={(props as SpotlightCardAnchorProps).href}
        target={(props as SpotlightCardAnchorProps).target}
        rel={(props as SpotlightCardAnchorProps).rel}
        style={style}
      >
        {children}
      </a>
    );
  }

  if (Tag === "article") {
    return (
      <article
        ref={ref as React.RefObject<HTMLElement>}
        onMouseMove={handleMouseMove}
        className={`spotlight-card ${className}`.trim()}
        style={style}
      >
        {children}
      </article>
    );
  }

  if (Tag === "section") {
    return (
      <section
        ref={ref as React.RefObject<HTMLElement>}
        onMouseMove={handleMouseMove}
        className={`spotlight-card ${className}`.trim()}
        style={style}
      >
        {children}
      </section>
    );
  }

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      onMouseMove={handleMouseMove}
      className={`spotlight-card ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}
