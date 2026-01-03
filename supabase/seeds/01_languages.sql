-- Seeds pour les langues supportées
-- Insertion des langues de base : français (par défaut) et anglais

INSERT INTO languages (code, name, native_name, is_default) VALUES
('fr', 'French', 'Français', true),
('en', 'English', 'English', false)
ON CONFLICT (code) DO NOTHING;