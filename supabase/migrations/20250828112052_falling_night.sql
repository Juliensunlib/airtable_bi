/*
  # Création du profil administrateur par défaut

  1. Fonction pour créer un utilisateur admin
    - Crée un utilisateur avec email/mot de passe
    - Assigne le rôle admin
    - Configure les permissions

  2. Sécurité
    - Fonction sécurisée pour l'initialisation
    - Vérification des doublons
*/

-- Fonction pour créer l'utilisateur admin par défaut
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier si l'admin existe déjà
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = 'admin@airtableau.com'
  ) THEN
    -- Insérer l'utilisateur admin dans auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@airtableau.com',
      crypt('admin123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"username": "admin", "role": "admin"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
    
    RAISE NOTICE 'Utilisateur admin créé avec succès';
  ELSE
    RAISE NOTICE 'Utilisateur admin existe déjà';
  END IF;
END;
$$;

-- Exécuter la fonction pour créer l'admin
SELECT create_admin_user();

-- Supprimer la fonction après utilisation
DROP FUNCTION IF EXISTS create_admin_user();