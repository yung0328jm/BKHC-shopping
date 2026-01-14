-- 為 products 表添加預購商品欄位
-- 在 Supabase Dashboard > SQL Editor 中執行此腳本

-- 添加 is_preorder 欄位（是否為預購商品）
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_preorder BOOLEAN DEFAULT FALSE;

-- 為現有商品設置預設值（可選）
-- UPDATE products SET is_preorder = FALSE WHERE is_preorder IS NULL;
