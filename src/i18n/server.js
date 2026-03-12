/**
 * 伺服器端 i18n 處理模組
 * 用於 Cloudflare Workers 環境
 */

// 直接引入語言檔內容
const zhCN = {
  "common": {"appName": "订阅管理系统", "loading": "加载中...", "confirm": "确认", "cancel": "取消", "save": "保存", "delete": "删除", "edit": "编辑", "add": "添加", "search": "搜索", "filter": "筛选", "export": "导出", "import": "导入", "refresh": "刷新", "close": "关闭", "submit": "提交", "reset": "重置", "back": "返回", "next": "下一步", "previous": "上一步", "actions": "操作", "status": "状态", "success": "成功", "error": "错误", "warning": "警告", "info": "信息"},
  "login": {"title": "订阅管理系统", "subtitle": "登录管理您的订阅提醒", "username": "用户名", "password": "密码", "loginButton": "登录", "loggingIn": "登录中...", "loginError": "用户名或密码错误", "networkError": "发生错误，请稍后再试"},
  "nav": {"dashboard": "仪表盘", "subscriptionList": "订阅列表", "systemConfig": "系统配置", "logout": "退出登录", "toggleMenu": "切换导航菜单"},
  "dashboard": {"title": "仪表盘", "overview": "概览", "totalSubscriptions": "订阅总数", "activeSubscriptions": "活跃订阅", "totalSpending": "总支出", "avgMonthlySpending": "月均支出", "upcomingRenewals": "即将续费", "recentActivity": "最近活动", "topSpending": "支出排行", "subscriptionsItem": "个订阅", "viewAll": "查看全部", "noData": "暂无数据", "noUpcomingRenewals": "暂无即将续费的订阅", "noRecentActivity": "暂无最近活动", "daysLeft": "天后到期", "renewalDate": "续费日期", "amount": "金额", "cycle": "周期", "category": "分类"},
  "subscriptions": {"title": "订阅管理", "addNew": "添加订阅", "searchPlaceholder": "搜索订阅名称...", "filterByCategory": "按分类筛选", "allCategories": "全部分类", "name": "名称", "amount": "金额", "cycle": "周期", "nextRenewal": "下次续费", "category": "分类", "actions": "操作", "edit": "编辑", "delete": "删除", "deleteConfirm": "确定要删除这个订阅吗？", "noSubscriptions": "暂无订阅数据", "addFirstSubscription": "添加第一个订阅开始管理", "cycles": {"daily": "每天", "weekly": "每周", "monthly": "每月", "quarterly": "每季度", "yearly": "每年", "custom": "自定义"}, "categories": {"streaming": "流媒体", "software": "软件", "cloud": "云服务", "gaming": "游戏", "education": "教育", "fitness": "健身", "music": "音乐", "news": "新闻", "productivity": "生产力", "other": "其他"}},
  "subscriptionForm": {"addTitle": "添加订阅", "editTitle": "编辑订阅", "name": "订阅名称", "namePlaceholder": "例如: Netflix", "amount": "金额", "amountPlaceholder": "例如: 50", "currency": "货币", "cycle": "周期", "startDate": "开始日期", "nextRenewal": "下次续费", "category": "分类", "description": "备注", "descriptionPlaceholder": "添加备注信息（可选）", "notificationEnabled": "启用提醒", "notificationDays": "提前提醒天数", "save": "保存", "cancel": "取消", "saving": "保存中...", "saveSuccess": "保存成功", "saveError": "保存失败"},
  "config": {"title": "系统配置", "general": "通用设置", "notifications": "通知设置", "appearance": "外观设置", "data": "数据管理", "about": "关于", "language": "语言", "languageDesc": "选择系统显示语言", "timezone": "时区", "timezoneDesc": "设置您的时区", "currency": "默认货币", "currencyDesc": "新订阅的默认货币", "theme": "主题", "themeLight": "浅色", "themeDark": "深色", "themeAuto": "跟随系统", "notificationChannels": "通知渠道", "email": "邮件通知", "telegram": "Telegram 通知", "webhook": "Webhook", "bark": "Bark", "wechat": "企业微信", "notifyx": "NotifyX", "gotify": "Gotify", "enableNotification": "启用", "testNotification": "测试通知", "exportData": "导出数据", "exportDesc": "导出所有订阅数据为 JSON 格式", "importData": "导入数据", "importDesc": "从 JSON 文件导入订阅数据", "clearData": "清空数据", "clearDataDesc": "删除所有订阅数据（不可恢复）", "clearDataConfirm": "确定要清空所有数据吗？此操作不可恢复！", "version": "版本", "repository": "代码仓库", "documentation": "使用文档", "saveSuccess": "设置已保存", "saveError": "保存失败", "testSuccess": "测试通知已发送", "testError": "发送失败"},
  "errors": {"networkError": "网络错误，请检查连接", "serverError": "服务器错误，请稍后再试", "unauthorized": "未授权，请重新登录", "notFound": "请求的资源不存在", "validationError": "数据验证失败", "unknownError": "未知错误"},
  "messages": {"saveSuccess": "保存成功", "deleteSuccess": "删除成功", "updateSuccess": "更新成功", "operationSuccess": "操作成功", "operationFailed": "操作失败"}
};

const zhTW = {
  "common": {"appName": "訂閱管理系統", "loading": "載入中...", "confirm": "確認", "cancel": "取消", "save": "儲存", "delete": "刪除", "edit": "編輯", "add": "新增", "search": "搜尋", "filter": "篩選", "export": "匯出", "import": "匯入", "refresh": "重新整理", "close": "關閉", "submit": "送出", "reset": "重設", "back": "返回", "next": "下一步", "previous": "上一步", "actions": "操作", "status": "狀態", "success": "成功", "error": "錯誤", "warning": "警告", "info": "資訊"},
  "login": {"title": "訂閱管理系統", "subtitle": "登入管理您的訂閱提醒", "username": "使用者名稱", "password": "密碼", "loginButton": "登入", "loggingIn": "登入中...", "loginError": "使用者名稱或密碼錯誤", "networkError": "發生錯誤,請稍後再試"},
  "nav": {"dashboard": "儀表板", "subscriptionList": "訂閱列表", "systemConfig": "系統設定", "logout": "登出", "toggleMenu": "切換導覽選單"},
  "dashboard": {"title": "儀表板", "overview": "總覽", "totalSubscriptions": "訂閱總數", "activeSubscriptions": "活躍訂閱", "totalSpending": "總支出", "avgMonthlySpending": "月均支出", "upcomingRenewals": "即將續費", "recentActivity": "最近活動", "topSpending": "支出排行", "subscriptionsItem": "個訂閱", "viewAll": "檢視全部", "noData": "暫無資料", "noUpcomingRenewals": "暫無即將續費的訂閱", "noRecentActivity": "暫無最近活動", "daysLeft": "天後到期", "renewalDate": "續費日期", "amount": "金額", "cycle": "週期", "category": "分類"},
  "subscriptions": {"title": "訂閱管理", "addNew": "新增訂閱", "searchPlaceholder": "搜尋訂閱名稱...", "filterByCategory": "按分類篩選", "allCategories": "全部分類", "name": "名稱", "amount": "金額", "cycle": "週期", "nextRenewal": "下次續費", "category": "分類", "actions": "操作", "edit": "編輯", "delete": "刪除", "deleteConfirm": "確定要刪除這個訂閱嗎？", "noSubscriptions": "暫無訂閱資料", "addFirstSubscription": "新增第一個訂閱開始管理", "cycles": {"daily": "每天", "weekly": "每週", "monthly": "每月", "quarterly": "每季", "yearly": "每年", "custom": "自訂"}, "categories": {"streaming": "串流媒體", "software": "軟體", "cloud": "雲端服務", "gaming": "遊戲", "education": "教育", "fitness": "健身", "music": "音樂", "news": "新聞", "productivity": "生產力", "other": "其他"}},
  "subscriptionForm": {"addTitle": "新增訂閱", "editTitle": "編輯訂閱", "name": "訂閱名稱", "namePlaceholder": "例如：Netflix", "amount": "金額", "amountPlaceholder": "例如：50", "currency": "貨幣", "cycle": "週期", "startDate": "開始日期", "nextRenewal": "下次續費", "category": "分類", "description": "備註", "descriptionPlaceholder": "新增備註資訊（選填）", "notificationEnabled": "啟用提醒", "notificationDays": "提前提醒天數", "save": "儲存", "cancel": "取消", "saving": "儲存中...", "saveSuccess": "儲存成功", "saveError": "儲存失敗"},
  "config": {"title": "系統設定", "general": "一般設定", "notifications": "通知設定", "appearance": "外觀設定", "data": "資料管理", "about": "關於", "language": "語言", "languageDesc": "選擇系統顯示語言", "timezone": "時區", "timezoneDesc": "設定您的時區", "currency": "預設貨幣", "currencyDesc": "新訂閱的預設貨幣", "theme": "主題", "themeLight": "淺色", "themeDark": "深色", "themeAuto": "跟隨系統", "notificationChannels": "通知管道", "email": "電子郵件通知", "telegram": "Telegram 通知", "webhook": "Webhook", "bark": "Bark", "wechat": "企業微信", "notifyx": "NotifyX", "gotify": "Gotify", "enableNotification": "啟用", "testNotification": "測試通知", "exportData": "匯出資料", "exportDesc": "匯出所有訂閱資料為 JSON 格式", "importData": "匯入資料", "importDesc": "從 JSON 檔案匯入訂閱資料", "clearData": "清空資料", "clearDataDesc": "刪除所有訂閱資料（無法復原）", "clearDataConfirm": "確定要清空所有資料嗎？此操作無法復原！", "version": "版本", "repository": "程式碼倉庫", "documentation": "使用文件", "saveSuccess": "設定已儲存", "saveError": "儲存失敗", "testSuccess": "測試通知已發送", "testError": "發送失敗"},
  "errors": {"networkError": "網路錯誤，請檢查連線", "serverError": "伺服器錯誤，請稍後再試", "unauthorized": "未授權，請重新登入", "notFound": "請求的資源不存在", "validationError": "資料驗證失敗", "unknownError": "未知錯誤"},
  "messages": {"saveSuccess": "儲存成功", "deleteSuccess": "刪除成功", "updateSuccess": "更新成功", "operationSuccess": "操作成功", "operationFailed": "操作失敗"}
};

const en = {
  "common": {"appName": "Subscription Tracker", "loading": "Loading...", "confirm": "Confirm", "cancel": "Cancel", "save": "Save", "delete": "Delete", "edit": "Edit", "add": "Add", "search": "Search", "filter": "Filter", "export": "Export", "import": "Import", "refresh": "Refresh", "close": "Close", "submit": "Submit", "reset": "Reset", "back": "Back", "next": "Next", "previous": "Previous", "actions": "Actions", "status": "Status", "success": "Success", "error": "Error", "warning": "Warning", "info": "Info"},
  "login": {"title": "Subscription Tracker", "subtitle": "Login to manage your subscription reminders", "username": "Username", "password": "Password", "loginButton": "Login", "loggingIn": "Logging in...", "loginError": "Invalid username or password", "networkError": "An error occurred, please try again later"},
  "nav": {"dashboard": "Dashboard", "subscriptionList": "Subscriptions", "systemConfig": "Settings", "logout": "Logout", "toggleMenu": "Toggle navigation menu"},
  "dashboard": {"title": "Dashboard", "overview": "Overview", "totalSubscriptions": "Total Subscriptions", "activeSubscriptions": "Active Subscriptions", "totalSpending": "Total Spending", "avgMonthlySpending": "Avg. Monthly", "upcomingRenewals": "Upcoming Renewals", "recentActivity": "Recent Activity", "topSpending": "Top Spending", "subscriptionsItem": "subscriptions", "viewAll": "View All", "noData": "No data available", "noUpcomingRenewals": "No upcoming renewals", "noRecentActivity": "No recent activity", "daysLeft": "days left", "renewalDate": "Renewal Date", "amount": "Amount", "cycle": "Cycle", "category": "Category"},
  "subscriptions": {"title": "Subscription Management", "addNew": "Add Subscription", "searchPlaceholder": "Search subscription name...", "filterByCategory": "Filter by category", "allCategories": "All Categories", "name": "Name", "amount": "Amount", "cycle": "Cycle", "nextRenewal": "Next Renewal", "category": "Category", "actions": "Actions", "edit": "Edit", "delete": "Delete", "deleteConfirm": "Are you sure you want to delete this subscription?", "noSubscriptions": "No subscriptions yet", "addFirstSubscription": "Add your first subscription to get started", "cycles": {"daily": "Daily", "weekly": "Weekly", "monthly": "Monthly", "quarterly": "Quarterly", "yearly": "Yearly", "custom": "Custom"}, "categories": {"streaming": "Streaming", "software": "Software", "cloud": "Cloud Services", "gaming": "Gaming", "education": "Education", "fitness": "Fitness", "music": "Music", "news": "News", "productivity": "Productivity", "other": "Other"}},
  "subscriptionForm": {"addTitle": "Add Subscription", "editTitle": "Edit Subscription", "name": "Subscription Name", "namePlaceholder": "e.g. Netflix", "amount": "Amount", "amountPlaceholder": "e.g. 50", "currency": "Currency", "cycle": "Cycle", "startDate": "Start Date", "nextRenewal": "Next Renewal", "category": "Category", "description": "Notes", "descriptionPlaceholder": "Add notes (optional)", "notificationEnabled": "Enable Reminder", "notificationDays": "Remind Days Before", "save": "Save", "cancel": "Cancel", "saving": "Saving...", "saveSuccess": "Saved successfully", "saveError": "Failed to save"},
  "config": {"title": "System Settings", "general": "General", "notifications": "Notifications", "appearance": "Appearance", "data": "Data Management", "about": "About", "language": "Language", "languageDesc": "Select system display language", "timezone": "Timezone", "timezoneDesc": "Set your timezone", "currency": "Default Currency", "currencyDesc": "Default currency for new subscriptions", "theme": "Theme", "themeLight": "Light", "themeDark": "Dark", "themeAuto": "Auto", "notificationChannels": "Notification Channels", "email": "Email", "telegram": "Telegram", "webhook": "Webhook", "bark": "Bark", "wechat": "WeChat Work", "notifyx": "NotifyX", "gotify": "Gotify", "enableNotification": "Enable", "testNotification": "Test Notification", "exportData": "Export Data", "exportDesc": "Export all subscriptions as JSON", "importData": "Import Data", "importDesc": "Import subscriptions from JSON file", "clearData": "Clear Data", "clearDataDesc": "Delete all subscriptions (cannot be undone)", "clearDataConfirm": "Are you sure you want to clear all data? This cannot be undone!", "version": "Version", "repository": "Repository", "documentation": "Documentation", "saveSuccess": "Settings saved", "saveError": "Failed to save", "testSuccess": "Test notification sent", "testError": "Failed to send"},
  "errors": {"networkError": "Network error, please check your connection", "serverError": "Server error, please try again later", "unauthorized": "Unauthorized, please login again", "notFound": "Requested resource not found", "validationError": "Data validation failed", "unknownError": "Unknown error"},
  "messages": {"saveSuccess": "Saved successfully", "deleteSuccess": "Deleted successfully", "updateSuccess": "Updated successfully", "operationSuccess": "Operation successful", "operationFailed": "Operation failed"}
};

const translations = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'en': en
};

/**
 * 生成 i18n 資料注入腳本
 * @param {string} locale - 當前語言（可選，用於預載特定語言）
 * @returns {string} 注入腳本
 */
export function getI18nDataScript(locale = null) {
  // 如果指定語言，只注入該語言資料
  const data = locale ? { [locale]: translations[locale] } : translations;
  
  return `<script>window.__I18N_DATA__ = ${JSON.stringify(data)};</script>`;
}

/**
 * 取得 i18n 瀏覽器腳本
 * @returns {string} i18n 腳本內容
 */
export function getI18nBrowserScript() {
  // 這裡應該讀取 i18n-browser.js 的內容
  // 為了簡化，先返回 inline 版本
  return `<script src="/assets/i18n.js"></script>`;
}

/**
 * 從 Cookie 或 Accept-Language 偵測語言
 */
export function detectLocale(request) {
  // 1. 檢查 Cookie
  const cookie = request.headers.get('Cookie');
  if (cookie) {
    const match = cookie.match(/app_locale=([^;]+)/);
    if (match && ['zh-CN', 'zh-TW', 'en'].includes(match[1])) {
      return match[1];
    }
  }
  
  // 2. 檢查 Accept-Language header
  const acceptLang = request.headers.get('Accept-Language');
  if (acceptLang) {
    const langs = acceptLang.split(',').map(l => l.split(';')[0].trim());
    
    for (const lang of langs) {
      if (lang === 'zh-TW' || lang === 'zh-Hant' || lang.startsWith('zh-Hant')) {
        return 'zh-TW';
      }
      if (lang === 'zh-CN' || lang === 'zh-Hans' || lang.startsWith('zh-Hans') || lang === 'zh') {
        return 'zh-CN';
      }
      if (lang.startsWith('en')) {
        return 'en';
      }
    }
  }
  
  // 3. 預設簡體中文
  return 'zh-CN';
}

/**
 * 在 HTML 中注入 i18n 支援並替換佔位符
 */
export function injectI18n(html, locale = 'zh-CN') {
  const t = translations[locale] || translations['zh-CN'];
  
  // 注入語言資料
  const dataScript = getI18nDataScript();
  html = html.replace('</head>', `${dataScript}</head>`);
  
  // 設定 lang 屬性
  html = html.replace(/<html>/g, `<html lang="${locale}">`);
  html = html.replace(/<html lang="zh-CN">/g, `<html lang="${locale}">`);
  
  // 佔位符替換：{{section.key}} → 對應翻譯
  html = html.replace(/\{\{([a-zA-Z_]+)\.([a-zA-Z_]+)\}\}/g, (match, section, key) => {
    if (t[section] && t[section][key]) {
      return t[section][key];
    }
    console.warn(`Missing translation: ${section}.${key}`);
    return match; // 找不到就保留原樣
  });
  
  return html;
}

export { translations };
