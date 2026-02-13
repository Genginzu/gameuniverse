-- Seeds pour les traductions des entreprises
-- Traductions en français et anglais

-- Les descriptions françaises sont déjà migrées depuis la colonne companies.description
-- Ajout des traductions anglaises

INSERT INTO company_translations (company_id, language_code, description)
SELECT id, 'en', CASE slug
  WHEN 'cd-projekt-red' THEN 'Polish game studio famous for The Witcher series and Cyberpunk 2077.'
  WHEN 'cd-projekt' THEN 'Polish publisher and developer, parent company of CD Projekt RED.'
  WHEN 'take-two-interactive' THEN 'American publisher, owner of Rockstar Games and 2K Games.'
  WHEN 'activision' THEN 'American video game publisher, creator of Call of Duty.'
  ELSE NULL
END
FROM companies
WHERE slug IN ('cd-projekt-red', 'cd-projekt', 'take-two-interactive', 'activision')
ON CONFLICT (company_id, language_code) DO NOTHING;
