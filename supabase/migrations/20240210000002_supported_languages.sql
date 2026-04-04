-- Migration: Add supported_languages reference table
-- Contains all languages that can be assigned to games (audio, subtitles, interface)

CREATE TABLE public.supported_languages (
  code VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  native_name VARCHAR(100) NOT NULL
);
-- Seed with common game languages (from IGDB and industry standards)
INSERT INTO supported_languages (code, name, native_name) VALUES
  ('ar', 'Arabic', 'العربية'),
  ('bg', 'Bulgarian', 'Български'),
  ('ca', 'Catalan', 'Català'),
  ('cs', 'Czech', 'Čeština'),
  ('da', 'Danish', 'Dansk'),
  ('de', 'German', 'Deutsch'),
  ('el', 'Greek', 'Ελληνικά'),
  ('en', 'English', 'English'),
  ('es', 'Spanish', 'Español'),
  ('et', 'Estonian', 'Eesti'),
  ('fi', 'Finnish', 'Suomi'),
  ('fr', 'French', 'Français'),
  ('he', 'Hebrew', 'עברית'),
  ('hi', 'Hindi', 'हिन्दी'),
  ('hr', 'Croatian', 'Hrvatski'),
  ('hu', 'Hungarian', 'Magyar'),
  ('id', 'Indonesian', 'Bahasa Indonesia'),
  ('it', 'Italian', 'Italiano'),
  ('ja', 'Japanese', '日本語'),
  ('ko', 'Korean', '한국어'),
  ('lt', 'Lithuanian', 'Lietuvių'),
  ('lv', 'Latvian', 'Latviešu'),
  ('ms', 'Malay', 'Bahasa Melayu'),
  ('nl', 'Dutch', 'Nederlands'),
  ('no', 'Norwegian', 'Norsk'),
  ('pl', 'Polish', 'Polski'),
  ('pt', 'Portuguese', 'Português'),
  ('pt-BR', 'Brazilian Portuguese', 'Português do Brasil'),
  ('ro', 'Romanian', 'Română'),
  ('ru', 'Russian', 'Русский'),
  ('sk', 'Slovak', 'Slovenčina'),
  ('sl', 'Slovenian', 'Slovenščina'),
  ('sr', 'Serbian', 'Српски'),
  ('sv', 'Swedish', 'Svenska'),
  ('th', 'Thai', 'ไทย'),
  ('tr', 'Turkish', 'Türkçe'),
  ('uk', 'Ukrainian', 'Українська'),
  ('vi', 'Vietnamese', 'Tiếng Việt'),
  ('zh-Hans', 'Chinese (Simplified)', '简体中文'),
  ('zh-Hant', 'Chinese (Traditional)', '繁體中文')
ON CONFLICT (code) DO NOTHING;
-- RLS
ALTER TABLE supported_languages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Supported languages are viewable by everyone"
  ON supported_languages FOR SELECT
  USING (true);
CREATE POLICY "Admins can manage supported languages"
  ON supported_languages
  FOR ALL USING (public.is_admin());
