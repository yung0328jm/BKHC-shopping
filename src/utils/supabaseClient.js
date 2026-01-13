import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 檢查環境變數
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = `
❌ Supabase 環境變數未設定！

請確認：
1. 在專案根目錄有 .env 檔案
2. .env 檔案內容格式如下：
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key

3. 重新啟動開發伺服器（修改 .env 後必須重啟）

目前讀取到的值：
- VITE_SUPABASE_URL: ${supabaseUrl || '未設定'}
- VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '已設定（長度：' + supabaseAnonKey.length + '）' : '未設定'}
`
  console.error(errorMsg)
  alert('Supabase 未設定！請檢查 .env 檔案並重新啟動開發伺服器。\n\n查看瀏覽器控制台了解詳細資訊。')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

