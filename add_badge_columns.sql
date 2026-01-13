-- 為 products 表添加標籤相關欄位
-- 在 Supabase Dashboard > SQL Editor 中執行此腳本

-- 添加 badge_label 欄位（標籤文字）
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS badge_label TEXT;

-- 添加 show_badge 欄位（是否顯示標籤）
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS show_badge BOOLEAN DEFAULT FALSE;

-- 為現有商品設置預設值（可選）
-- UPDATE products SET show_badge = FALSE WHERE show_badge IS NULL;
