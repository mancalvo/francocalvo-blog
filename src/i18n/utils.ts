import { ui, defaultLang } from './ui';

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function extractPathAfterLanguage(url: URL): string {
  const pathname = url.pathname;
  return pathname.replace(/^\/en(?:\/|$)/, '/');
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof typeof ui[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  }
}

export function getUrlFromLangAndTarget(lang: keyof typeof ui, tg: String) {
  let ret = (ui[lang] == ui['en']) ? '/en/' + tg : '/' + tg;
  return ret;
}
