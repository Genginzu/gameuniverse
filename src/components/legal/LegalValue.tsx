import type { ReactNode } from "react";

/**
 * Prints a publisher value, or a visible placeholder while it is still
 * missing from `PUBLISHER_INFO`.
 */
export function LegalValue({ value, placeholder }: { value: string | null; placeholder: string }) {
  if (value && value.trim() !== "") return <>{value}</>;
  return <span className="font-semibold text-white">{placeholder}</span>;
}

export function LegalEmail({ email, placeholder }: { email: string | null; placeholder: string }) {
  if (!email) return <LegalValue value={null} placeholder={placeholder} />;
  return <a href={`mailto:${email}`}>{email}</a>;
}

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} rel="noopener noreferrer" target="_blank">
      {children}
    </a>
  );
}
