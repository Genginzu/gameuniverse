import { Link } from "@/i18n/navigation";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface SeoBreadcrumbProps {
  items: BreadcrumbItem[];
}

export function SeoBreadcrumb({ items }: SeoBreadcrumbProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href && { item: `https://gameuniverse.gg${item.href}` }),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="mb-4 text-sm">
        <ol className="flex flex-wrap items-center gap-1 text-gray-400">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && <span className="mx-1">/</span>}
              {item.href ? (
                <Link href={item.href} className="transition-colors hover:text-white">
                  {item.label}
                </Link>
              ) : (
                <span className="text-gray-200">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
