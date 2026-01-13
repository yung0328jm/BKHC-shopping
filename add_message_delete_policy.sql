-- 添加管理員刪除對話的 RLS 政策
-- 在 Supabase Dashboard > SQL Editor 中執行此腳本

-- 刪除現有的刪除政策（如果存在）
DROP POLICY IF EXISTS "管理員可以刪除對話" ON conversations;

-- 管理員可以刪除任何對話（刪除對話時，相關訊息會自動刪除，因為有 CASCADE）
CREATE POLICY "管理員可以刪除對話"
  ON conversations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
