-- 為 orders 表添加運費相關欄位
-- 在 Supabase Dashboard > SQL Editor 中執行此腳本

-- 添加 shipping_fee 欄位（運費）
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_fee DECIMAL(10, 2) DEFAULT 0;

-- 添加 subtotal 欄位（小計，商品總額不含運費）
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2) DEFAULT 0;

-- 為現有訂單設置預設值（可選）
-- UPDATE orders SET shipping_fee = 0 WHERE shipping_fee IS NULL;
-- UPDATE orders SET subtotal = total WHERE subtotal IS NULL;
