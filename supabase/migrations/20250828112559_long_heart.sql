/*
  # Schema initial pour AirTableau BI

  1. Tables principales
    - `profiles` - Profils utilisateurs étendus
    - `airtable_connections` - Connexions Airtable par utilisateur
    - `dashboards` - Tableaux de bord personnalisés
    - `reports` - Rapports sauvegardés
    - `dashboard_reports` - Relation many-to-many entre dashboards et reports

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques pour isoler les données par utilisateur
    - Trigger pour créer automatiquement un profil utilisateur
*/

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des profils utilisateurs étendus
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des connexions Airtable
CREATE TABLE IF NOT EXISTS airtable_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  api_key TEXT NOT NULL,
  base_id TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des tableaux de bord
CREATE TABLE IF NOT EXISTS dashboards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  layout JSONB DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des rapports
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  connection_id UUID REFERENCES airtable_connections(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('bar', 'line', 'pie', 'doughnut', 'table', 'kpi', 'area', 'scatter')),
  config JSONB NOT NULL DEFAULT '{}',
  data_cache JSONB,
  cache_expires_at TIMESTAMPTZ,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table de liaison dashboard-reports
CREATE TABLE IF NOT EXISTS dashboard_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  dashboard_id UUID REFERENCES dashboards(id) ON DELETE CASCADE NOT NULL,
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE NOT NULL,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  width INTEGER DEFAULT 1,
  height INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dashboard_id, report_id)
);

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE airtable_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_reports ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour profiles
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Politiques RLS pour airtable_connections
CREATE POLICY "Users can manage own connections" ON airtable_connections
  FOR ALL USING (auth.uid() = user_id);

-- Politiques RLS pour dashboards
CREATE POLICY "Users can manage own dashboards" ON dashboards
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can read public dashboards" ON dashboards
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

-- Politiques RLS pour reports
CREATE POLICY "Users can manage own reports" ON reports
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can read public reports" ON reports
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

-- Politiques RLS pour dashboard_reports
CREATE POLICY "Users can manage own dashboard reports" ON dashboard_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM dashboards 
      WHERE dashboards.id = dashboard_reports.dashboard_id 
      AND dashboards.user_id = auth.uid()
    )
  );

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_airtable_connections_updated_at BEFORE UPDATE ON airtable_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboards_updated_at BEFORE UPDATE ON dashboards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer automatiquement un profil utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un profil
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_airtable_connections_user_id ON airtable_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_user_id ON dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_connection_id ON reports(connection_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_reports_dashboard_id ON dashboard_reports(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_reports_report_id ON dashboard_reports(report_id);