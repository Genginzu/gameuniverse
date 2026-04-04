-- Migration: Ajout de la colonne de confidentialité des statistiques joueur
-- Permet aux joueurs de masquer leurs statistiques enrichies et leur résumé annuel
-- pour les visiteurs de leur profil.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stats_private BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN public.profiles.stats_private
IS 'Si true, les statistiques enrichies et le résumé annuel sont masqués pour les visiteurs';
