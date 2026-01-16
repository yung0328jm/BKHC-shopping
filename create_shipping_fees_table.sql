-- 建立運費設定資料表
-- 在 Supabase Dashboard > SQL Editor 中執行此腳本

-- 1. 建立 shipping_fees 表（運費設定表）
CREATE TABLE IF NOT EXISTS shipping_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fee_711 DECIMAL(10, 2) NOT NULL DEFAULT 60,
  fee_home DECIMAL(10, 2) NOT NULL DEFAULT 100,
  fee_pickup DECIMAL(10, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 插入預設運費設定（如果不存在）
INSERT INTO shipping_fees (id, fee_711, fee_home, fee_pickup)
SELECT 
  gen_random_uuid(),
  60,
  100,
  0
WHERE NOT EXISTS (SELECT 1 FROM shipping_fees);

-- 3. 啟用 Row Level Security (RLS)
ALTER TABLE shipping_fees ENABLE ROW LEVEL SECURITY;

-- 4. 刪除現有的 RLS 政策（如果存在）
DROP POLICY IF EXISTS "所有人都可以讀取運費設定" ON shipping_fees;
DROP POLICY IF EXISTS "管理員可以更新運費設定" ON shipping_fees;

-- 5. 設定 RLS 政策
-- 所有人都可以讀取運費設定
CREATE POLICY "所有人都可以讀取運費設定"
  ON shipping_fees FOR SELECT
  USING (true);

-- 只有管理員可以更新運費設定
CREATE POLICY "管理員可以更新運費設定"
  ON shipping_fees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- 6. 建立更新時間的觸發器
DROP TRIGGER IF EXISTS update_shipping_fees_updated_at ON shipping_fees;
CREATE TRIGGER update_shipping_fees_updated_at
  BEFORE UPDATE ON shipping_fees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. 啟用 Realtime（即時同步）
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE shipping_fees;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
