import { useState } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

interface LazyImageProps {
  src?: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  wrapperClassName?: string;
  fallbackSrc?: string;
  showSkeleton?: boolean;
  sizes?: string;
  priority?: boolean;
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = "",
  wrapperClassName = "",
  fallbackSrc = "",
  showSkeleton = true,
  sizes,
  priority = false,
}: LazyImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Utiliser le fallback si pas de src ou si erreur de chargement
  const effectiveSrc = hasError || !src ? fallbackSrc : src;

  // Pas de src et pas de fallback → placeholder SVG
  if (!effectiveSrc) {
    return (
      <div className={`bg-background flex items-center justify-center ${className}`}>
        <svg
          className="h-12 w-12 text-gray-400 dark:text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`${fill ? "relative h-full w-full" : "relative"} ${wrapperClassName}`}>
      {showSkeleton && !imageLoaded && <Skeleton className={`absolute inset-0 ${className}`} />}
      <Image
        src={effectiveSrc}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        className={`${className} ${!imageLoaded ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          // Si c'est déjà le fallback qui échoue, on affiche quand même
          if (hasError) {
            setImageLoaded(true);
            return;
          }
          setHasError(true);
          setImageLoaded(false);
        }}
        priority={priority}
        sizes={sizes}
      />
    </div>
  );
}
