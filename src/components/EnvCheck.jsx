// 環境變數診斷工具
function EnvCheck() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>環境變數診斷</h2>
      <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
        <p><strong>VITE_SUPABASE_URL:</strong></p>
        <p style={{ color: url ? 'green' : 'red' }}>
          {url || '❌ 未設定'}
        </p>
        
        <p><strong>VITE_SUPABASE_ANON_KEY:</strong></p>
        <p style={{ color: key ? 'green' : 'red' }}>
          {key ? `✅ 已設定（長度：${key.length}，前10個字符：${key.substring(0, 10)}...）` : '❌ 未設定'}
        </p>
        
        <p><strong>所有環境變數：</strong></p>
        <pre style={{ background: '#fff', padding: '10px', overflow: 'auto' }}>
          {JSON.stringify(import.meta.env, null, 2)}
        </pre>
      </div>
    </div>
  )
}

export default EnvCheck
