"use client";

import type { PlayerSocialLinks } from "@/types/player";

interface PlayerCardSocialLinksProps {
  socialLinks: PlayerSocialLinks;
}

/** Compact colored social icons for the player card */
export function PlayerCardSocialLinks({ socialLinks }: PlayerCardSocialLinksProps) {
  const links = [
    {
      key: "facebook" as const,
      href: socialLinks.facebook,
      color: "bg-blue-600",
      icon: FacebookIcon,
    },
    {
      key: "twitter" as const,
      href: socialLinks.twitter,
      color: "bg-black dark:bg-white dark:text-black",
      icon: XIcon,
    },
    { key: "twitch" as const, href: socialLinks.twitch, color: "bg-purple-500", icon: TwitchIcon },
  ];

  const visibleLinks = links.filter((l) => l.href);
  if (visibleLinks.length === 0) return null;

  return (
    <div className="flex gap-2">
      {visibleLinks.map(({ key, href, color, icon: IconComp }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={key}
          onClick={(e) => e.stopPropagation()}
          className={`flex h-10 w-10 items-center justify-center rounded-full ${color} text-white transition-opacity hover:opacity-80`}
        >
          <IconComp className="h-3.5 w-3.5" />
        </a>
      ))}
    </div>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TwitchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0 1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
    </svg>
  );
}
