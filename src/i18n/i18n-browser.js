/**
 * 瀏覽器端 i18n 腳本
 * 導出為字串，用於嵌入 HTML
 */

const i18nBrowserScript = `(function() {
  'use strict';

  const SUPPORTED_LOCALES = ['zh-CN', 'zh-TW', 'en'];
  const DEFAULT_LOCALE = 'zh-CN';
  const STORAGE_KEY = 'app_locale';

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
      document.documentElement.setAttribute('lang', this.currentLocale);
      // 同步到 Cookie，讓伺服器端能讀取
      this.syncLocaleToCookie(this.currentLocale);
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
      if (SUPPORTED_LOCALES.includes(browserLang)) return browserLang;
      if (browserLang.startsWith('zh')) {
        if (browserLang.includes('TW') || browserLang.includes('HK') || 
            browserLang.includes('Hant') || browserLang.includes('MO')) return 'zh-TW';
        return 'zh-CN';
      }
      if (browserLang.startsWith('en')) return 'en';
      return null;
    }

    setLocale(locale) {
      if (!SUPPORTED_LOCALES.includes(locale)) locale = DEFAULT_LOCALE;
      this.currentLocale = locale;
      document.documentElement.setAttribute('lang', locale);
      try { localStorage.setItem(STORAGE_KEY, locale); } catch (e) {}
      // 同步到 Cookie，讓伺服器端能讀取
      this.syncLocaleToCookie(locale);
      window.dispatchEvent(new CustomEvent('localechange', { detail: { locale } }));
      return this.currentLocale;
    }

    syncLocaleToCookie(locale) {
      try {
        // 設定 Cookie，path=/ 全站可用，max-age=1年
        document.cookie = 'app_locale=' + locale + '; path=/; max-age=31536000';
      } catch (e) {
        console.warn('Failed to sync locale to cookie:', e);
      }
    }

    getLocale() { return this.currentLocale; }

    t(key, params = {}) {
      const keys = key.split('.');
      let value = this.translations[this.currentLocale];
      for (const k of keys) {
        if (value && typeof value === 'object') value = value[k];
        else return key;
      }
      if (typeof value !== 'string') return key;
      return this.interpolate(value, params);
    }

    interpolate(text, params) {
      return text.replace(/\\{(\\w+)\\}/g, (match, key) => params.hasOwnProperty(key) ? params[key] : match);
    }

    getSupportedLocales() {
      return SUPPORTED_LOCALES.map(locale => ({ code: locale, name: this.getLocaleName(locale) }));
    }

    getLocaleName(locale) {
      const names = { 'zh-CN': '简体中文', 'zh-TW': '繁體中文', 'en': 'English' };
      return names[locale] || locale;
    }

    updatePageContent() {
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translated = this.t(key);
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          if (el.hasAttribute('placeholder')) el.setAttribute('placeholder', translated);
          else el.value = translated;
        } else el.textContent = translated;
      });
      document.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.setAttribute('title', this.t(el.getAttribute('data-i18n-title')));
      });
      document.querySelectorAll('[data-i18n-aria]').forEach(el => {
        el.setAttribute('aria-label', this.t(el.getAttribute('data-i18n-aria')));
      });
    }
  }

  window.i18n = new I18n();
  window.t = (key, params) => window.i18n.t(key, params);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.i18n.updatePageContent());
  } else {
    window.i18n.updatePageContent();
  }

  window.addEventListener('localechange', () => window.location.reload());
})();`;

export default i18nBrowserScript;
