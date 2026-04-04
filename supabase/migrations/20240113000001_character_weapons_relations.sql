-- Migration: Character Weapons field and Relations table
-- Adds weapons text field to character_translations and relationships table

-- Ajouter le champ weapons à la table des traductions
ALTER TABLE public.character_translations ADD COLUMN weapons TEXT;
COMMENT ON COLUMN character_translations.weapons IS 'List of weapons/equipment used by the character (localized text)';
-- Table des relations entre personnages
CREATE TABLE public.character_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  related_character_id UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  relationship_type VARCHAR(50) NOT NULL, -- ally, enemy, rival, family, romantic, mentor, friend
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(character_id, related_character_id)
);
-- Index pour les performances
CREATE INDEX idx_character_relationships_character_id ON character_relationships(character_id);
CREATE INDEX idx_character_relationships_related_id ON character_relationships(related_character_id);
CREATE INDEX idx_character_relationships_type ON character_relationships(relationship_type);
-- RLS
ALTER TABLE character_relationships ENABLE ROW LEVEL SECURITY;
-- Politiques pour lecture publique
CREATE POLICY "Character relationships are viewable by everyone" ON character_relationships 
  FOR SELECT USING (true);
-- Politiques pour administration
CREATE POLICY "Admins can manage character relationships" ON character_relationships 
  FOR ALL USING (public.is_admin());
-- Politiques pour développement
CREATE POLICY "Allow insert character relationships for development" ON character_relationships 
  FOR INSERT WITH CHECK (true);
-- Commentaires
COMMENT ON TABLE character_relationships IS 'Relationships between characters (allies, enemies, family, etc.)';
COMMENT ON COLUMN character_relationships.relationship_type IS 'Type: ally, enemy, rival, family, romantic, mentor, friend';
