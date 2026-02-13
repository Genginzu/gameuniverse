-- Migration: Suppression de la colonne description de la table companies
-- Les descriptions sont désormais gérées via company_translations (i18n)

ALTER TABLE public.companies DROP COLUMN IF EXISTS description;
