-- Execute este SQL no Supabase SQL Editor
-- Adiciona campo de role na tabela user_settings

-- Adicionar coluna role (admin ou user)
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS name text DEFAULT '';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- Para definir seu usuário como admin, rode:
-- UPDATE user_settings SET role = 'admin', name = 'Anderson' WHERE user_id = 'SEU_USER_ID';
--
-- Para encontrar seu user_id:
-- SELECT id, email FROM auth.users;

-- Permitir que admins vejam dados de outros usuários (read-only)
-- Políticas de admin para cada tabela

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_settings
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vocab words: admin pode ler todos
CREATE POLICY "Admins can read all vocab" ON vocab_words FOR SELECT USING (auth.uid() = user_id OR is_admin());
-- Study sessions: admin pode ler todos
CREATE POLICY "Admins can read all sessions" ON study_sessions FOR SELECT USING (auth.uid() = user_id OR is_admin());
-- Test results: admin pode ler todos
CREATE POLICY "Admins can read all tests" ON test_results FOR SELECT USING (auth.uid() = user_id OR is_admin());
-- Conversations: admin pode ler todos
CREATE POLICY "Admins can read all conversations" ON conversations FOR SELECT USING (auth.uid() = user_id OR is_admin());
-- Writing entries: admin pode ler todos
CREATE POLICY "Admins can read all writing" ON writing_entries FOR SELECT USING (auth.uid() = user_id OR is_admin());
-- User settings: admin pode ler e editar todos
CREATE POLICY "Admins can read all settings" ON user_settings FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Admins can update all settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id OR is_admin());

-- View para facilitar queries do admin (junta auth.users com settings)
CREATE OR REPLACE VIEW admin_user_overview AS
SELECT
  u.id as user_id,
  u.email,
  u.created_at as joined_at,
  COALESCE(s.name, '') as name,
  COALESCE(s.level, 'A1') as level,
  COALESCE(s.role, 'user') as role,
  COALESCE(s.active, true) as active,
  (SELECT COUNT(*) FROM vocab_words v WHERE v.user_id = u.id) as vocab_count,
  (SELECT COUNT(*) FROM vocab_words v WHERE v.user_id = u.id AND v.repetitions >= 3 AND v.ease_factor >= 2.3) as mastered_count,
  (SELECT COALESCE(SUM(ss.minutes), 0) FROM study_sessions ss WHERE ss.user_id = u.id) as total_minutes,
  (SELECT COUNT(*) FROM test_results t WHERE t.user_id = u.id) as test_count,
  (SELECT COUNT(*) FROM conversations c WHERE c.user_id = u.id) as conversation_count,
  (SELECT COUNT(*) FROM writing_entries w WHERE w.user_id = u.id) as writing_count,
  (SELECT COALESCE(AVG(t.score::float / t.total * 100), 0) FROM test_results t WHERE t.user_id = u.id) as avg_test_score,
  (SELECT MAX(ss.date) FROM study_sessions ss WHERE ss.user_id = u.id) as last_study_date
FROM auth.users u
LEFT JOIN user_settings s ON s.user_id = u.id;
