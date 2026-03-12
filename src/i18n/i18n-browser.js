/**
 * 瀏覽器端 i18n 腳本
 * 可直接嵌入 HTML <script> 標籤
 */

(function() {
  'use strict';

  const SUPPORTED_LOCALES = ['zh-CN', 'zh-TW', 'en'];
  const DEFAULT_LOCALE = 'zh-CN';
  const STORAGE_KEY = 'app_locale';

  // 語言資料將由後端注入
  const translations = window.__I18N_DATA__ || {};

  class I18n {
    constructor() {
      this.currentLocale = DEFAULT_LOCALE;
      this.translations = translations;
      this.init();
    }

    init() {
      const savedLocale = this.getSavedLocale();
      const browserLocale = this.getBrowserLocale();
      this.currentLocale = savedLocale || browserLocale || DEFAULT_LOCALE;
      
      // 更新 HTML lang 屬性
      document.documentElement.setAttribute('lang', this.currentLocale);
      
      return this.currentLocale;
    }

    getSavedLocale() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return SUPPORTED_LOCALES.includes(saved) ? saved : null;
      } catch (e) {
        return null;
      }
    }

    getBrowserLocale() {
      const browserLang = navigator.language || navigator.userLanguage;
      
      if (SUPPORTED_LOCALES.includes(browserLang)) {
        return browserLang;
      }
      
      if (browserLang.startsWith('zh')) {
        if (browserLang.includes('TW') || browserLang.includes('HK') || 
            browserLang.includes('Hant') || browserLang.includes('MO')) {
          return 'zh-TW';
        }
        return 'zh-CN';
      }
      
      if (browserLang.startsWith('en')) {
        return 'en';
      }
      
      return null;
    }

    setLocale(locale) {
      if (!SUPPORTED_LOCALES.includes(locale)) {
        console.warn(`Unsupported locale: ${locale}`);
        locale = DEFAULT_LOCALE;
      }
      
      this.currentLocale = locale;
      document.documentElement.setAttribute('lang', locale);
      
      try {
        localStorage.setItem(STORAGE_KEY, locale);
      } catch (e) {
        console.warn('Failed to save locale to localStorage');
      }
      
      // 觸發語言變更事件
      window.dispatchEvent(new CustomEvent('localechange', { detail: { locale } }));
      
      return this.currentLocale;
    }

    getLocale() {
      return this.currentLocale;
    }

    t(key, params = {}) {
      const keys = key.split('.');
      let value = this.translations[this.currentLocale];
      
      for (const k of keys) {
        if (value && typeof value === 'object') {
          value = value[k];
        } else {
          console.warn(`Translation key not found: ${key}`);
          return key;
        }
      }
      
      if (typeof value !== 'string') {
        return key;
      }
      
      return this.interpolate(value, params);
    }

    interpolate(text, params) {
      return text.replace(/\{(\w+)\}/g, (match, key) => {
        return params.hasOwnProperty(key) ? params[key] : match;
      });
    }

    getSupportedLocales() {
      return SUPPORTED_LOCALES.map(locale => ({
        code: locale,
        name: this.getLocaleName(locale)
      }));
    }

    getLocaleName(locale) {
      const names = {
        'zh-CN': '简体中文',
        'zh-TW': '繁體中文',
        'en': 'English'
      };
      return names[locale] || locale;
    }

    /**
     * 更新頁面上所有帶有 data-i18n 屬性的元素
     */
    updatePageContent() {
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translated = this.t(key);
        
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          if (el.hasAttribute('placeholder')) {
            el.setAttribute('placeholder', translated);
          } else {
            el.value = translated;
          }
        } else {
          el.textContent = translated;
        }
      });

      // 更新 title 屬性
      document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        el.setAttribute('title', this.t(key));
      });

      // 更新 aria-label
      document.querySelectorAll('[data-i18n-aria]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria');
        el.setAttribute('aria-label', this.t(key));
      });
    }
  }

  // 建立全域實例
  window.i18n = new I18n();
  window.t = (key, params) => window.i18n.t(key, params);

  // 頁面載入完成後更新內容
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.i18n.updatePageContent();
    });
  } else {
    window.i18n.updatePageContent();
  }

  // 語言切換時重新載入頁面（簡化處理）
  window.addEventListener('localechange', () => {
    window.location.reload();
  });
})();
