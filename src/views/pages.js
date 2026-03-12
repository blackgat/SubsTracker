// 页面模板 - 使用 text import 避免嵌套模板字面量问题
import themeResourcesHtml from './theme-resources.html';
import loginPageHtml from './loginPage.html';
import adminPageHtml from './adminPage.html';
import configPageHtml from './configPage.html';
import dashboardPageHtml from './dashboardPage.html';
import { injectI18n, detectLocale } from '../i18n/server.js';
import i18nBrowserScript from '../i18n/i18n-browser.js';

// themeResources 需要注入到每个页面模板中
function injectTheme(html) {
  return html.replace(/\$\{themeResources\}/g, themeResourcesHtml);
}

// 注入 i18n 支援（主題 + i18n 腳本）
function injectAll(html, request = null) {
  // 1. 注入主題
  html = injectTheme(html);
  
  // 2. 注入 i18n 瀏覽器腳本
  const i18nScript = `<script>${i18nBrowserScript}</script>`;
  html = html.replace('</head>', `${i18nScript}</head>`);
  
  // 3. 偵測並設定語言
  const locale = request ? detectLocale(request) : 'zh-CN';
  html = injectI18n(html, locale);
  
  return html;
}

function loginPage(request) {
  return injectAll(loginPageHtml, request);
}

function adminPage(request) {
  return injectAll(adminPageHtml, request);
}

function configPage(request) {
  return injectAll(configPageHtml, request);
}

function dashboardPage(request) {
  return injectAll(dashboardPageHtml, request);
}

export { loginPage, adminPage, configPage, dashboardPage };
