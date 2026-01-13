-- 添加管理員刪除訊息的 RLS 政策
-- 在 Supabase Dashboard > SQL Editor 中執行此腳本

-- 刪除現有的刪除政策（如果存在）
DROP POLICY IF EXISTS "管理員可以刪除訊息" ON messages;

-- 管理員可以刪除任何訊息
CREATE POLICY "管理員可以刪除訊息"
  ON messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
