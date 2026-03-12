# SubsTracker i18n 功能測試指南

## ✅ 完成項目

### 1. 同步上游
- ✅ Fork 已同步到 wangwangit/SubsTracker 最新版本 (d09210e)
- ✅ 推送更新到 origin/master

### 2. i18n 實作
- ✅ 建立語言檔：
  - `src/i18n/locales/zh-CN.json` - 簡體中文（從現有程式碼提取）
  - `src/i18n/locales/zh-TW.json` - 繁體中文
  - `src/i18n/locales/en.json` - 英文
  
- ✅ 建立 i18n 模組：
  - `src/i18n/index.js` - Node.js 核心模組
  - `src/i18n/i18n-browser.js` - 瀏覽器端腳本
  - `src/i18n/server.js` - Cloudflare Workers 伺服器端處理
  
- ✅ 整合到系統：
  - 修改 `src/views/pages.js` - 頁面模板注入 i18n
  - 修改 `src/api/admin.js` - 傳遞 request 物件給頁面
  - 修改 `src/index.js` - 整合語言偵測
  - 修改 `src/views/configPage.html` - 加入語言選擇器
  
- ✅ 文件：
  - `docs/I18N.md` - 完整 i18n 使用文件

### 3. Git 提交
- ✅ 建立 feature/i18n 分支
- ✅ 提交所有 i18n 相關變更
- ✅ 推送到 GitHub（**僅 feature/i18n 分支**，未推送到 main）

---

## 🧪 本地測試步驟

### 前置準備

確保已安裝 Wrangler CLI：

```bash
npm install -g wrangler
# 或
pnpm add -g wrangler
```

### 測試指令

```bash
# 1. 進入專案目錄
cd /tmp/SubsTracker

# 2. 確認在 feature/i18n 分支
git branch
# 應該顯示 * feature/i18n

# 3. 安裝依賴（如果尚未安裝）
npm install

# 4. 使用 Wrangler Dev 啟動本地測試（連接遠端 KV）
wrangler dev --remote

# 5. 開啟瀏覽器
# 訪問: http://localhost:8787
```

### 測試項目

#### 1. 語言偵測測試

**測試 A：瀏覽器語言偵測**
- 開啟 Chrome DevTools (F12)
- Console 執行：
  ```javascript
  navigator.language
  ```
- 觀察系統是否正確偵測並顯示對應語言

**測試 B：手動切換語言**
1. 登入系統
2. 進入「系統配置」頁面
3. 在「顯示設置」區塊找到「語言 / Language」下拉選單
4. 切換語言：簡體中文 ↔ 繁體中文 ↔ English
5. 確認頁面重新載入後顯示正確語言

#### 2. 語言持久化測試

1. 切換到繁體中文
2. 關閉瀏覽器分頁
3. 重新開啟 `http://localhost:8787`
4. **預期結果**：應該保持繁體中文（儲存在 localStorage）

檢查儲存狀態：
```javascript
// 在 Console 執行
localStorage.getItem('app_locale')
// 應該返回: "zh-TW"
```

#### 3. 多頁面測試

測試以下頁面是否正確顯示翻譯：
- ✅ 登入頁面 (`/`)
- ✅ 系統配置 (`/admin/config`)
- ✅ 儀表板 (`/admin/dashboard`) - 部分支援
- ✅ 訂閱列表 (`/admin`) - 部分支援

#### 4. API 測試

在 Console 測試 i18n API：

```javascript
// 取得翻譯
t('login.title')            // 應返回對應語言的標題
t('common.loading')         // 應返回「載入中...」或「加载中...」或「Loading...」

// 取得當前語言
i18n.getLocale()            // 返回 'zh-CN', 'zh-TW', 或 'en'

// 切換語言（會重新載入頁面）
i18n.setLocale('en')

// 取得支援的語言列表
i18n.getSupportedLocales()
// 返回: [
//   { code: 'zh-CN', name: '简体中文' },
//   { code: 'zh-TW', name: '繁體中文' },
//   { code: 'en', name: 'English' }
// ]
```

---

## 🐛 已知問題與限制

### 目前狀態
- ✅ 語言檔已建立（完整覆蓋主要文字）
- ✅ 核心 i18n 機制已實作
- ✅ 配置頁面已加入語言選擇器
- ⚠️ **HTML 頁面尚未全面加入 `data-i18n` 屬性**

### 需要後續處理的項目

#### 1. HTML 頁面翻譯標記
目前只有配置頁面的語言選擇器完成，其他硬編碼的文字尚未轉換。

**需要在以下文件加入 `data-i18n` 屬性：**
- `src/views/loginPage.html` - 登入頁面的標題、按鈕等
- `src/views/dashboardPage.html` - 儀表板的統計標題、按鈕等
- `src/views/adminPage.html` - 訂閱列表的表頭、按鈕等
- `src/views/configPage.html` - 配置頁面的其他區塊

**範例修改：**
```html
<!-- 修改前 -->
<h1>订阅管理系统</h1>
<button>登录</button>

<!-- 修改後 -->
<h1 data-i18n="login.title"></h1>
<button data-i18n="login.loginButton"></button>
```

#### 2. JavaScript 動態文字
部分動態產生的文字需要在 JavaScript 中使用 `t()` 函式：

```javascript
// 修改前
showToast('保存成功');

// 修改後
showToast(t('messages.saveSuccess'));
```

---

## 📋 測試檢查清單

- [ ] 瀏覽器語言偵測正常
- [ ] 手動切換語言功能正常
- [ ] localStorage 持久化正常
- [ ] 登入頁面文字顯示（部分）
- [ ] 系統配置頁面文字顯示（部分）
- [ ] 儀表板頁面文字顯示（部分）
- [ ] 訂閱列表頁面文字顯示（部分）
- [ ] i18n API 函式運作正常
- [ ] 頁面重新載入後語言保持

---

## 🚀 部署到 Cloudflare

**⚠️ 請先完成本地測試並確認無誤後再部署！**

```bash
# 1. 確認在 feature/i18n 分支
git branch

# 2. 部署到 Cloudflare（staging 環境建議先測試）
wrangler deploy --env staging

# 3. 測試 staging 環境
# 訪問你的 staging URL

# 4. 確認無誤後部署到 production
wrangler deploy --env production
```

---

## 📞 回報問題

測試時發現任何問題，請記錄：

1. **問題描述**
2. **重現步驟**
3. **預期行為**
4. **實際行為**
5. **瀏覽器 Console 錯誤訊息**（如有）
6. **截圖**（如有）

---

## 🔗 相關連結

- **GitHub 分支**: https://github.com/blackgat/SubsTracker/tree/feature/i18n
- **PR 建立**: https://github.com/blackgat/SubsTracker/pull/new/feature/i18n
- **i18n 文件**: docs/I18N.md

---

## 下一步

1. ✅ 本地測試基本功能
2. ⏳ 回報測試結果給 Sub-agent
3. ⏳ 根據反饋修正問題
4. ⏳ 補充 HTML `data-i18n` 屬性（選擇性）
5. ⏳ 部署到 Cloudflare
6. ⏳ 合併到 main 分支

---

**測試愉快！** 🎉
