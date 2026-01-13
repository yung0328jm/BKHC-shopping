# 購物網站 - 商品管理系統

一個現代化的商品上架與管理網站，使用 React + Vite 構建。

## 功能特色

- ✅ **商品管理** - 完整的商品上架、編輯、刪除功能
- ✅ **商品列表** - 美觀的卡片式商品展示，支援即時同步
- ✅ **搜尋與篩選** - 根據商品名稱、描述或分類進行搜尋
- ✅ **購物車系統** - 即時同步的購物車，跨裝置同步
- ✅ **用戶認證** - 使用 Supabase Auth 的用戶登入/註冊系統
- ✅ **訂單管理** - 完整的訂單建立、查詢、狀態管理
- ✅ **即時同步** - 使用 Supabase Realtime 實現多裝置即時同步
- ✅ **響應式設計** - 支援手機、平板、電腦等各種裝置

## 技術棧

- **React 18** - 前端框架
- **React Router** - 路由管理
- **Vite** - 建置工具
- **Supabase** - 後端即時資料庫與認證服務
- **CSS3** - 現代化樣式設計

## 安裝與執行

### 1. 安裝依賴

```bash
npm install
```

### 2. 啟動開發伺服器

```bash
npm run dev
```

瀏覽器會自動開啟 `http://localhost:5173`

### 3. 建置生產版本

```bash
npm run build
```

## Supabase 設定

### 1. 建立 Supabase 專案

1. 前往 [Supabase](https://supabase.com) 註冊並建立新專案
2. 在專案設定 > API 頁面取得：
   - Project URL
   - anon public key

### 2. 設定環境變數

在專案根目錄建立 `.env` 檔案，填入：

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 建立資料庫表

在 Supabase Dashboard > SQL Editor 中執行 `supabase_setup.sql` 檔案中的 SQL 腳本，建立以下表：
- `products` - 商品表
- `carts` - 購物車表
- `orders` - 訂單表
- `profiles` - 用戶資料表

### 4. 啟用 Realtime

在 Supabase Dashboard > Database > Replication 中確認以下表已啟用 Realtime：
- products
- carts
- orders

## 使用說明

1. **上架商品**：點擊導航欄的「上架商品」或商品列表頁的「上架新商品」按鈕
2. **填寫商品資訊**：
   - 商品名稱（必填）
   - 商品描述（選填）
   - 價格（必填）
   - 庫存數量（必填）
   - 商品分類（必填）
   - 商品圖片 URL（選填）
3. **管理商品**：在商品列表頁可以查看所有商品，並可刪除不需要的商品
4. **搜尋與篩選**：使用搜尋框和分類下拉選單快速找到想要的商品

## 專案結構

```
購物網站/
├── src/
│   ├── components/          # React 組件
│   │   ├── AddProduct.jsx   # 商品上架表單
│   │   ├── ProductList.jsx  # 商品列表
│   │   └── *.css           # 組件樣式
│   ├── utils/              # 工具函數
│   │   └── storage.js      # 本地儲存管理
│   ├── App.jsx             # 主應用組件
│   ├── main.jsx            # 應用入口
│   └── *.css               # 全域樣式
├── index.html              # HTML 模板
├── package.json            # 專案配置
└── vite.config.js          # Vite 配置
```

## 部署

### Vercel 部署

1. 將專案推送到 GitHub
2. 在 [Vercel](https://vercel.com) 匯入專案
3. 在環境變數設定中填入 Supabase URL 和 Key
4. 部署完成後即可透過專屬網址訪問

### Netlify 部署

1. 將專案推送到 GitHub
2. 在 [Netlify](https://netlify.com) 匯入專案
3. 建置命令：`npm run build`
4. 發布目錄：`dist`
5. 在環境變數設定中填入 Supabase URL 和 Key

## 已完成功能

- ✅ 商品編輯功能
- ✅ 購物車功能（即時同步）
- ✅ 用戶登入系統（Supabase Auth）
- ✅ 後端 API 整合（Supabase）
- ✅ 訂單管理系統（即時同步）

## 授權

MIT License

