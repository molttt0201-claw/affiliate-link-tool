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
    localStorage.setItem('affiliate_api_key', apiKey.trim())
    setError('')
    await fetchBrands(apiKey.trim())
  }

  // 取得品牌列表
  const fetchBrands = async (key) => {
    setLoading(true)
    setStatus('正在取得品牌列表...')
    try {
      const response = await fetch(
        `${API_BASE}/affiliates/offers.json?api_key=${key}&approval_statuses=Active&per_page=500&locale=zh-TW`
      )
      
      if (!response.ok) {
        throw new Error('API 請求失敗，請檢查 API Key')
      }
      
      const data = await response.json()
      
      if (data.data && Array.isArray(data.data)) {
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
        setStatus(`已載入 ${data.data.length} 個品牌`)
      } else {
        setStatus('沒有找到已申請的品牌')
      }
    } catch (err) {
      setError(err.message || '取得品牌失敗')
      setStatus('')
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
      // 檢查是否有相似網域
      const similarDomains = Object.keys(brandDomains).filter(d => 
        d.includes(inputDomain) || inputDomain.includes(d)
      )
      
      if (similarDomains.length > 0) {
        setError(`未找到 "${inputDomain}" 的對應品牌`)
      } else {
        setError('此網站不在聯盟網支援的品牌列表中')
      }
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* 標題 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">🔗 聯盟網連結工具</h1>
          <p className="text-gray-600 mt-2">快速將網址轉換為追蹤連結</p>
        </div>

        {/* API Key 設定 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">API Key</h2>
            {apiKey && (
              <button
                onClick={handleClearApiKey}
                className="text-sm text-red-500 hover:text-red-700"
              >
                清除
              </button>
            )}
          </div>
          
          {!apiKey ? (
            <div className="space-y-3">
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="輸入您的 API Key"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <button
                onClick={handleApiKeySave}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? '儲存中...' : '儲存並取得品牌'}
              </button>
            </div>
          ) : (
            <div className="text-sm text-green-600 bg-green-50 px-4 py-3 rounded-lg">
              ✅ API Key 已設定 • {status}
            </div>
          )}
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6">
            ⚠️ {error}
          </div>
        )}

        {/* 轉換工具 */}
        {apiKey && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">網址轉換</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  貼上您想轉換的網址
                </label>
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://www.nike.com/tw/..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <button
                onClick={handleConvert}
                disabled={loading || !inputUrl}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading ? '轉換中...' : '轉換為追蹤連結'}
              </button>

              {/* 結果 */}
              {resultUrl && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <div className="text-sm font-medium text-green-800 mb-2">轉換結果：</div>
                  <div className="bg-white p-3 rounded border border-green-200 break-all text-sm text-gray-700 mb-3">
                    {resultUrl}
                  </div>
                  <button
                    onClick={handleCopy}
                    className={`w-full py-3 rounded-lg font-medium transition-colors ${
                      copied 
                        ? 'bg-green-600 text-white' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
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
          <div className="text-center mt-6 text-sm text-gray-500">
            已載入 {brands.length} 個品牌
          </div>
        )}
      </div>
    </div>
  )
}

export default App
