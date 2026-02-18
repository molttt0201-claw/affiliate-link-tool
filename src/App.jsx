import { useState, useEffect } from 'react'

const API_BASE = 'https://api.pub.affiliates.one/api/v2'

// 從 URL 提取網域
function extractDomain(url) {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

// 從 preview_url 提取網域
function extractDomainFromPreview(previewUrl) {
  if (!previewUrl) return null
  return extractDomain(previewUrl)
}

// URL 編碼
function encodeUrl(url) {
  try {
    return encodeURIComponent(url)
  } catch {
    return ''
  }
}

function App() {
  const [apiKey, setApiKey] = useState('')
  const [brands, setBrands] = useState([])
  const [brandDomains, setBrandDomains] = useState({})
  const [inputUrl, setInputUrl] = useState('')
  const [resultUrl, setResultUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [copied, setCopied] = useState(false)
  const [apiKeyValid, setApiKeyValid] = useState(false)

  // 載入已儲存的 API Key
  useEffect(() => {
    const savedKey = localStorage.getItem('affiliate_api_key')
    if (savedKey) {
      setApiKey(savedKey)
      fetchBrands(savedKey)
    }
  }, [])

  // 儲存 API Key 並取得品牌
  const handleApiKeySave = async () => {
    if (!apiKey.trim()) {
      setError('請輸入 API Key')
      return
    }
    
    setError('')
    localStorage.setItem('affiliate_api_key', apiKey.trim())
    await fetchBrands(apiKey.trim())
  }

  // 驗證 API Key 並取得品牌列表
  const fetchBrands = async (key) => {
    setLoading(true)
    setStatus('正在驗證 API Key...')
    setApiKeyValid(false)
    
    try {
      const response = await fetch(
        `${API_BASE}/affiliates/offers.json?api_key=${key}&approval_statuses=Active&per_page=10&locale=zh-TW`
      )
      
      if (!response.ok) {
        throw new Error('API 請求失敗，請檢查 API Key')
      }
      
      const data = await response.json()
      
      // 檢查是否有錯誤或沒有資料
      if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
        // 可能 key 有效但沒有申請品牌，再試試不篩選
        const response2 = await fetch(
          `${API_BASE}/affiliates/offers.json?api_key=${key}&per_page=10&locale=zh-TW`
        )
        const data2 = await response2.json()
        
        if (!data2.data || !Array.isArray(data2.data) || data2.data.length === 0) {
          throw new Error('API Key 無效或無法取得品牌資料')
        }
        
        // 有資料但沒申請品牌
        setBrands([])
        setBrandDomains({})
        setApiKeyValid(true)
        setStatus('API Key 驗證成功，但尚未申請任何品牌')
        return
      }
      
      // 成功取得品牌
      setBrands(data.data)
      
      // 建立網域對照表
      const domainMap = {}
      data.data.forEach(brand => {
        const domain = extractDomainFromPreview(brand.preview_url)
        if (domain && brand.tracking_link) {
          domainMap[domain] = {
            name: brand.name,
            trackingLink: brand.tracking_link
          }
        }
      })
      setBrandDomains(domainMap)
      setApiKeyValid(true)
      setStatus(`✅ 已載入 ${data.data.length} 個品牌`)
    } catch (err) {
      setError(err.message || 'API Key 驗證失敗，請確認 Key 是否正確')
      setStatus('')
      setApiKeyValid(false)
    } finally {
      setLoading(false)
    }
  }

  // 轉換網址
  const handleConvert = () => {
    setError('')
    setResultUrl('')
    setCopied(false)
    
    if (!inputUrl.trim()) {
      setError('請輸入網址')
      return
    }
    
    const inputDomain = extractDomain(inputUrl)
    
    if (!inputDomain) {
      setError('無效的網址格式')
      return
    }
    
    const brandInfo = brandDomains[inputDomain]
    
    if (!brandInfo) {
      setError(`⚠️ "${inputDomain}" 不在您已申請的品牌列表中`)
      return
    }
    
    // 轉換網址
    const trackingLink = brandInfo.trackingLink
    const encodedUrl = encodeUrl(inputUrl)
    const finalUrl = `${trackingLink}&t=${encodedUrl}`
    
    setResultUrl(finalUrl)
  }

  // 複製結果
  const handleCopy = async () => {
    if (!resultUrl) return
    
    try {
      await navigator.clipboard.writeText(resultUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('複製失敗，請手動複製')
    }
  }

  // 清除 API Key
  const handleClearApiKey = () => {
    localStorage.removeItem('affiliate_api_key')
    setApiKey('')
    setBrands([])
    setBrandDomains({})
    setStatus('')
    setApiKeyValid(false)
    setError('')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        {/* 標題 */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>🔗 聯盟網連結工具</h1>
          <p style={{ color: '#4b5563', marginTop: '0.5rem' }}>快速將網址轉換為追蹤連結</p>
        </div>

        {/* API Key 設定 */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>API Key</h2>
            {apiKeyValid && (
              <button
                onClick={handleClearApiKey}
                style={{ fontSize: '0.875rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                清除
              </button>
            )}
          </div>
          
          {!apiKeyValid ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="輸入您的 API Key"
                style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
              />
              <button
                onClick={handleApiKeySave}
                disabled={loading}
                style={{ width: '100%', padding: '0.75rem', background: loading ? '#9ca3af' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? '驗證中...' : '驗證並儲存'}
              </button>
            </div>
          ) : (
            <div style={{ fontSize: '0.875rem', color: '#059669', background: '#ecfdf5', padding: '0.75rem 1rem', borderRadius: '8px' }}>
              {status}
            </div>
          )}
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        {/* 轉換工具 */}
        {apiKeyValid && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>網址轉換</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  貼上您想轉換的網址
                </label>
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://www.nike.com/tw/..."
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
                />
              </div>

              <button
                onClick={handleConvert}
                disabled={loading || !inputUrl}
                style={{ width: '100%', padding: '0.75rem', background: loading || !inputUrl ? '#9ca3af' : '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '500', cursor: loading || !inputUrl ? 'not-allowed' : 'pointer' }}
              >
                {loading ? '轉換中...' : '轉換為追蹤連結'}
              </button>

              {/* 結果 */}
              {resultUrl && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f0fdf4', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#166534', marginBottom: '0.5rem' }}>轉換結果：</div>
                  <div style={{ background: 'white', padding: '0.75rem', borderRadius: '6px', border: '1px solid #bbf7d0', fontSize: '0.875rem', color: '#374151', wordBreak: 'break-all', marginBottom: '0.75rem' }}>
                    {resultUrl}
                  </div>
                  <button
                    onClick={handleCopy}
                    style={{ width: '100%', padding: '0.75rem', background: copied ? '#16a34a' : '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '500', cursor: 'pointer' }}
                  >
                    {copied ? '✅ 已複製！' : '📋 複製連結'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 品牌數量 */}
        {brands.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
            已載入 {brands.length} 個品牌
          </div>
        )}
      </div>
    </div>
  )
}

export default App
