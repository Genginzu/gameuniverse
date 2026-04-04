-- Migration: Table d'historique de prix des jeux
-- Création de la table game_price_history pour stocker les snapshots de prix
-- horodatés, permettant de suivre l'évolution des prix dans le temps.

-- Table d'historique de prix
CREATE TABLE IF NOT EXISTS public.game_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  platform VARCHAR(50) NOT NULL,
  recorded_at TIMESTAMP NOT NULL DEFAULT NOW()
);
-- Contraintes de validation
ALTER TABLE game_price_history ADD CONSTRAINT game_price_history_price_positive
  CHECK (price >= 0);
ALTER TABLE game_price_history ADD CONSTRAINT game_price_history_currency_format
  CHECK (LENGTH(currency) = 3 AND currency = UPPER(currency));
-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_price_history_game_id
  ON game_price_history(game_id);
CREATE INDEX IF NOT EXISTS idx_price_history_game_date
  ON game_price_history(game_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_game_store
  ON game_price_history(game_id, store_id);
-- Activation Row Level Security
ALTER TABLE game_price_history ENABLE ROW LEVEL SECURITY;
-- Politique de lecture publique (utilisateurs anonymes et authentifiés)
CREATE POLICY "Price history is viewable by everyone"
  ON game_price_history
  FOR SELECT
  USING (true);
-- Politique d'écriture restreinte aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can insert price history"
  ON game_price_history
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
-- Politique d'administration complète
CREATE POLICY "Admins can manage price history"
  ON game_price_history
  FOR ALL
  USING (public.is_admin());
-- Commentaires pour documentation
COMMENT ON TABLE game_price_history IS 'Historique des prix des jeux — chaque ligne est un snapshot horodaté du prix d''un jeu sur un magasin/plateforme donné';
COMMENT ON COLUMN game_price_history.id IS 'Identifiant unique du snapshot de prix';
COMMENT ON COLUMN game_price_history.game_id IS 'Référence vers le jeu concerné';
COMMENT ON COLUMN game_price_history.store_id IS 'Référence vers le magasin concerné';
COMMENT ON COLUMN game_price_history.price IS 'Prix enregistré au moment du snapshot (doit être >= 0)';
COMMENT ON COLUMN game_price_history.currency IS 'Code devise ISO 4217 (3 lettres majuscules, ex: EUR, USD)';
COMMENT ON COLUMN game_price_history.platform IS 'Plateforme de jeu (PC, PlayStation, Xbox, etc.)';
COMMENT ON COLUMN game_price_history.recorded_at IS 'Horodatage du snapshot de prix';
-- ============================================================================
-- Trigger : Enregistrement automatique de l'historique de prix
-- Capture chaque insertion ou modification de prix dans game_prices
-- et crée un snapshot dans game_price_history.
-- Utilise un bloc EXCEPTION pour ne jamais bloquer la transaction principale.
-- ============================================================================

CREATE OR REPLACE FUNCTION record_price_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Sur INSERT : enregistrer le prix initial
  IF TG_OP = 'INSERT' THEN
    BEGIN
      INSERT INTO game_price_history (game_id, store_id, price, currency, platform, recorded_at)
      VALUES (NEW.game_id, NEW.store_id, NEW.price, NEW.currency, NEW.platform, NOW());
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'record_price_history: échec INSERT snapshot pour game_id=%, store_id=% : %', NEW.game_id, NEW.store_id, SQLERRM;
    END;
    RETURN NEW;
  END IF;

  -- Sur UPDATE : enregistrer seulement si le prix a changé
  IF TG_OP = 'UPDATE' AND OLD.price IS DISTINCT FROM NEW.price THEN
    BEGIN
      INSERT INTO game_price_history (game_id, store_id, price, currency, platform, recorded_at)
      VALUES (NEW.game_id, NEW.store_id, NEW.price, NEW.currency, NEW.platform, NOW());
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'record_price_history: échec UPDATE snapshot pour game_id=%, store_id=% : %', NEW.game_id, NEW.store_id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Attacher le trigger AFTER INSERT OR UPDATE sur game_prices
CREATE TRIGGER trg_record_price_history
  AFTER INSERT OR UPDATE ON game_prices
  FOR EACH ROW
  EXECUTE FUNCTION record_price_history();
COMMENT ON FUNCTION record_price_history() IS 'Trigger function : enregistre un snapshot dans game_price_history à chaque insertion ou changement de prix dans game_prices. Résilient — journalise les erreurs via RAISE WARNING sans bloquer la transaction.';
