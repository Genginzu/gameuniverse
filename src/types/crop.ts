// Types partagés pour le système de crop d'images

/** Dimensions d'une image en pixels */
export interface ImageDimensions {
  width: number;
  height: number;
}

/** Paramètres de crop dans le référentiel de l'image source (pixels naturels) */
export interface CropParams {
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
}

/** Configuration de sortie pour la génération du Blob */
export interface CropOutputConfig {
  width: number;
  height: number;
  format: string; // "image/webp"
  quality: number; // 0.9
}

/** État interne de l'éditeur de crop */
export interface CropState {
  x: number; // offset X en pixels CSS
  y: number; // offset Y en pixels CSS
  zoom: number; // 1.0 = zoom minimum (image remplit la zone)
}

/** Ratios d'aspect supportés */
export type CropAspectRatio = "1:1" | "16:5";

/** Mapping ratio → valeur numérique */
export const ASPECT_RATIO_VALUES: Record<CropAspectRatio, number> = {
  "1:1": 1,
  "16:5": 3.2,
};
