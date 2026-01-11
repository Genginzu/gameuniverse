import { useState, useEffect } from "react";

interface UseImageLoadingProps {
  src?: string;
  fallbackSrc?: string;
}

export function useImageLoading({ src, fallbackSrc }: UseImageLoadingProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | undefined>(src);

  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      setHasError(true);
      setImageSrc(fallbackSrc);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    const img = new Image();

    img.onload = () => {
      setIsLoading(false);
      setHasError(false);
      setImageSrc(src);
    };

    img.onerror = () => {
      setIsLoading(false);
      setHasError(true);
      setImageSrc(fallbackSrc);
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, fallbackSrc]);

  return {
    isLoading,
    hasError,
    imageSrc,
  };
}
