import { useState } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { useImageLoading } from "@/hooks/useImageLoading";

interface LazyImageProps {
  src?: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
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
  fallbackSrc = "/images/placeholder-game.jpg",
  showSkeleton = true,
  sizes,
  priority = false,
}: LazyImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { isLoading, hasError, imageSrc } = useImageLoading({ src, fallbackSrc });

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageLoaded(true);
  };

  if (isLoading && showSkeleton) {
    return <Skeleton className={`${className} ${fill ? "absolute inset-0" : ""}`} />;
  }

  if (!imageSrc) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <svg
          className="h-12 w-12 text-gray-400"
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
    <div className="relative">
      {showSkeleton && !imageLoaded && <Skeleton className={`absolute inset-0 ${className}`} />}
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        className={`${className} ${!imageLoaded ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        priority={priority}
        sizes={sizes}
      />
    </div>
  );
}
