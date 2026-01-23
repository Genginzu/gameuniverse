-- Seed pour créer l'utilisateur de développement
-- Ce fichier doit être exécuté en premier (préfixe 00_)

-- Insérer l'utilisateur dans auth.users
-- Le mot de passe est 'poisson03'
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '00000000-0000-0000-0000-000000000000',
  'thomas_lenormand@hotmail.fr',
  '$2b$10$N6KeNYoIzFt7VTtfKkkP3Ocalj0SXDwxsMQzr5C8tRbR2ceg3qKsC',
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"username": "Genginzu"}',
  false,
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Créer l'identité email pour l'utilisateur
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'thomas_lenormand@hotmail.fr',
  jsonb_build_object(
    'sub', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'email', 'thomas_lenormand@hotmail.fr',
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Créer le profil associé dans la table public.profiles (si elle existe)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
    VALUES (
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      'thomas_lenormand@hotmail.fr',
      'Genginzu',
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
