-- 建立公佈欄資料表
-- 在 Supabase Dashboard > SQL Editor 中執行此腳本

-- 1. 建立 announcements 表（公佈欄表）
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '重要公告',
  payment_info TEXT,
  shipping_info TEXT,
  grid_items JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 插入預設公告（如果不存在）
INSERT INTO announcements (id, title, payment_info, shipping_info, grid_items)
SELECT 
  gen_random_uuid(),
  '重要公告',
  '請在訂單確認後3日內完成匯款\n匯款帳號：\n銀行：\n帳號：\n戶名：',
  '商品將於收到款項後3-5個工作天內出貨\n運費說明：\n配送方式：',
  '[]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM announcements);

-- 3. 啟用 Row Level Security (RLS)
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- 4. 刪除現有的 RLS 政策（如果存在）
DROP POLICY IF EXISTS "所有人都可以讀取公告" ON announcements;
DROP POLICY IF EXISTS "管理員可以更新公告" ON announcements;

-- 5. 設定 RLS 政策
-- 所有人都可以讀取公告
CREATE POLICY "所有人都可以讀取公告"
  ON announcements FOR SELECT
  USING (true);

-- 只有管理員可以更新公告
CREATE POLICY "管理員可以更新公告"
  ON announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- 6. 建立更新時間的觸發器
DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. 啟用 Realtime（即時同步）
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
