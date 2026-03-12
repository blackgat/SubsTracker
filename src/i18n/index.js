/**
 * i18n 多語言支援模組
 * 支援繁體中文 (zh-TW)、簡體中文 (zh-CN)、英文 (en)
 */

import zhCN from './locales/zh-CN.json';
import zhTW from './locales/zh-TW.json';
import en from './locales/en.json';

const translations = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'en': en
};

const SUPPORTED_LOCALES = ['zh-CN', 'zh-TW', 'en'];
const DEFAULT_LOCALE = 'zh-CN';
const STORAGE_KEY = 'app_locale';

class I18n {
  constructor() {
    this.currentLocale = DEFAULT_LOCALE;
    this.translations = translations;
  }

  /**
   * 初始化語言設定
   * 優先級：localStorage > 瀏覽器語言 > 預設語言
   */
  init() {
    const savedLocale = this.getSavedLocale();
    const browserLocale = this.getBrowserLocale();
    
    this.currentLocale = savedLocale || browserLocale || DEFAULT_LOCALE;
    return this.currentLocale;
  }

  /**
   * 從 localStorage 讀取儲存的語言設定
   */
  getSavedLocale() {
    if (typeof localStorage === 'undefined') return null;
    const saved = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED_LOCALES.includes(saved) ? saved : null;
  }

  /**
   * 偵測瀏覽器語言
   */
  getBrowserLocale() {
    if (typeof navigator === 'undefined') return null;
    
    const browserLang = navigator.language || navigator.userLanguage;
    
    // 精確匹配
    if (SUPPORTED_LOCALES.includes(browserLang)) {
      return browserLang;
    }
    
    // 模糊匹配（例如 zh-Hant-TW -> zh-TW）
    if (browserLang.startsWith('zh')) {
      // 繁體中文的各種變體
      if (browserLang.includes('TW') || browserLang.includes('HK') || 
          browserLang.includes('Hant') || browserLang.includes('MO')) {
        return 'zh-TW';
      }
      // 簡體中文（預設）
      return 'zh-CN';
    }
    
    if (browserLang.startsWith('en')) {
      return 'en';
    }
    
    return null;
  }

  /**
   * 設定語言
   * @param {string} locale - 語言代碼
   */
  setLocale(locale) {
    if (!SUPPORTED_LOCALES.includes(locale)) {
      console.warn(`Unsupported locale: ${locale}, falling back to ${DEFAULT_LOCALE}`);
      locale = DEFAULT_LOCALE;
    }
    
    this.currentLocale = locale;
    
    // 儲存到 localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, locale);
    }
    
    return this.currentLocale;
  }

  /**
   * 取得當前語言
   */
  getLocale() {
    return this.currentLocale;
  }

  /**
   * 翻譯文字
   * @param {string} key - 翻譯鍵值，支援點號分隔 (例如: 'login.title')
   * @param {object} params - 替換參數 (可選)
   * @returns {string} 翻譯後的文字
   */
  t(key, params = {}) {
    const keys = key.split('.');
    let value = this.translations[this.currentLocale];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key} for locale ${this.currentLocale}`);
        return key;
      }
    }
    
    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${key}`);
      return key;
    }
    
    // 替換參數 (例如: "Hello {name}" + {name: "World"} -> "Hello World")
    return this.interpolate(value, params);
  }

  /**
   * 插值替換
   */
  interpolate(text, params) {
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return params.hasOwnProperty(key) ? params[key] : match;
    });
  }

  /**
   * 取得所有支援的語言
   */
  getSupportedLocales() {
    return SUPPORTED_LOCALES.map(locale => ({
      code: locale,
      name: this.getLocaleName(locale)
    }));
  }

  /**
   * 取得語言的顯示名稱
   */
  getLocaleName(locale) {
    const names = {
      'zh-CN': '简体中文',
      'zh-TW': '繁體中文',
      'en': 'English'
    };
    return names[locale] || locale;
  }
}

// 建立全域實例
const i18n = new I18n();

// 瀏覽器環境：掛載到 window
if (typeof window !== 'undefined') {
  window.i18n = i18n;
  window.t = (key, params) => i18n.t(key, params);
}

export default i18n;
