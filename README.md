# 🔗 聯盟網連結工具

快速將一般網址轉換為聯盟網追蹤連結的 PWA 應用程式。

## 功能

✅ **API Key 設定** - 輸入聯盟網 API Key 即可使用  
✅ **自動取得品牌** - 取得您已申請推廣的品牌  
✅ **網址轉換** - 貼上網址，自動偵測並轉換為追蹤連結  
✅ **一鍵複製** - 複製轉換後的連結  
✅ **PWA 可安裝** - 可安裝為手機 App 使用

## 使用方式

### 方法一：本地開發
```bash
npm install
npm run dev
```

### 方法二：靜態部署
```bash
npm run build
# 將 dist 資料夾部署到任何靜態網頁伺服器
```

## 技術細節

- **API Rate Limit**: 10 分鐘內 2 次請求
- **資料快取**: 品牌列表會儲存供離線比對網域使用
- **隱私**: API Key 儲存在瀏覽器本地端，不會傳送至第三方伺服器

## 開發

```bash
# 開發模式
npm run dev

# 建構 production 版本
npm run build

# 預覽 production 版本
npm run preview
```
