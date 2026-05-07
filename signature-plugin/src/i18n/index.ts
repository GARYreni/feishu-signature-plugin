/**
 * 国际化初始化模块
 * 支持中文(zh)、英文(en)、日文(ja)
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationZH from './zh.json';
import translationEN from './en.json';
import translationJA from './ja.json';

// 支持的语言列表
export const SUPPORTED_LANGUAGES = ['zh', 'en', 'ja'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * 初始化 i18n
 * @param lang 当前语言代码
 */
export function initI18n(lang: SupportedLanguage = 'zh'): void {
  i18n.use(initReactI18next).init({
    resources: {
      zh: { translation: translationZH },
      en: { translation: translationEN },
      ja: { translation: translationJA },
    },
    lng: lang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React 已经处理了 XSS 防护
    },
    // 简化，不使用key分隔符
    keySeparator: false,
  });
}

export default i18n;
