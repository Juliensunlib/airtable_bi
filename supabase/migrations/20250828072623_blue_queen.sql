/*
  # Créer utilisateur administrateur

  1. Nouveau profil admin
    - Email: admin@sunlib.fr
    - Username: Julien Bernard
    - Role: admin

  2. Sécurité
    - Profil admin avec tous les droits
    - Mot de passe temporaire à changer lors de la première connexion
*/

-- Insérer l'utilisateur admin directement dans auth.users
-- Note: En production, ceci devrait être fait via l'interface Supabase ou l'API Auth
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@sunlib.fr',
  crypt('admin123', gen_salt('bf')), -- Mot de passe temporaire: admin123
  NOW(),
  NOW(),
  '',
  NOW(),
  '',
  NULL,
  '',
  '',
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{"username": "Julien Bernard", "role": "admin"}',
  FALSE,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL
) ON CONFLICT (email) DO NOTHING;

-- Créer le profil utilisateur correspondant
INSERT INTO public.users (
  id,
  username,
  email,
  role,
  created_at,
  updated_at
) 
SELECT 
  au.id,
  'Julien Bernard',
  'admin@sunlib.fr',
  'admin',
  NOW(),
  NOW()
FROM auth.users au 
WHERE au.email = 'admin@sunlib.fr'
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Ajouter des politiques pour permettre aux admins de gérer les utilisateurs
CREATE POLICY "Admins can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );