import type { CropParams, CropOutputConfig } from "@/types/crop";
import { CROP_OUTPUT_FORMAT, CROP_OUTPUT_QUALITY } from "@/types/upload";

/**
 * Génère un Blob recadré à partir d'une image source et de paramètres de crop.
 * Utilise un <canvas> HTML pour dessiner la portion source aux dimensions de sortie.
 */
export function cropCanvas(
  image: HTMLImageElement,
  cropParams: CropParams,
  output: CropOutputConfig
): Promise<Blob> {
  const format = output.format ?? CROP_OUTPUT_FORMAT;
  const quality = output.quality ?? CROP_OUTPUT_QUALITY;

  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = output.width;
      canvas.height = output.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return reject(new Error("Failed to get canvas 2d context"));
      }

      ctx.drawImage(
        image,
        cropParams.sourceX,
        cropParams.sourceY,
        cropParams.sourceWidth,
        cropParams.sourceHeight,
        0,
        0,
        output.width,
        output.height
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return reject(new Error("canvas.toBlob() returned null"));
          }
          resolve(blob);
        },
        format,
        quality
      );
    } catch (error) {
      reject(error instanceof Error ? error : new Error("Canvas operation failed"));
    }
  });
}
