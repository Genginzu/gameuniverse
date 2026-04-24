-- Seed public.languages with the two site languages (fr, en)
-- Required before any translation table that references languages(code)

INSERT INTO public.languages (code, name, native_name, is_default) VALUES
  ('fr', 'French', 'Français', true),
  ('en', 'English', 'English', false)
ON CONFLICT (code) DO NOTHING;
