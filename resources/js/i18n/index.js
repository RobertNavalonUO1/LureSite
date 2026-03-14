import { usePage } from '@inertiajs/react';

import es from './es.json';
import en from './en.json';
import fr from './fr.json';

const MOJIBAKE_PATTERN = /Ã|Â|ƒ|ÔÇ|â€œ|â€|â€¦|âœ|â†|â€“|â€™/;

const normalizePotentialMojibake = (value) => {
  if (typeof value !== 'string' || !MOJIBAKE_PATTERN.test(value)) {
    return value;
  }

  let current = value;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (!MOJIBAKE_PATTERN.test(current)) {
      break;
    }

    try {
      const decoded = decodeURIComponent(escape(current));

      if (decoded === current) {
        break;
      }

      current = decoded;
    } catch {
      break;
    }
  }

  return current;
};

const sanitizeDictionary = (value) => {
  if (typeof value === 'string') {
    return normalizePotentialMojibake(value);
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeDictionary);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, sanitizeDictionary(nestedValue)])
    );
  }

  return value;
};

const DICTS = {
  es: sanitizeDictionary(es),
  en: sanitizeDictionary(en),
  fr: sanitizeDictionary(fr),
};

const normalizeLocale = (value) => {
  const raw = String(value || '').toLowerCase();
  if (raw.startsWith('es')) return 'es';
  if (raw.startsWith('en')) return 'en';
  if (raw.startsWith('fr')) return 'fr';
  return 'es';
};

const getByPath = (obj, path) => {
  if (!obj) return undefined;
  return String(path)
    .split('.')
    .filter(Boolean)
    .reduce((acc, key) => (acc && Object.prototype.hasOwnProperty.call(acc, key) ? acc[key] : undefined), obj);
};

const interpolate = (template, params) => {
  if (typeof template !== 'string') return template;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    if (params[key] === undefined || params[key] === null) return match;
    return String(params[key]);
  });
};

export const translate = (locale, key, params) => {
  const lang = normalizeLocale(locale);
  const dict = DICTS[lang] || DICTS.es;
  const fallback = DICTS.es;

  const value = getByPath(dict, key) ?? getByPath(fallback, key) ?? String(key);
  return interpolate(value, params);
};

export const useI18n = () => {
  const { locale } = usePage().props;
  const lang = normalizeLocale(locale);

  return {
    locale: lang,
    t: (key, params) => translate(lang, key, params),
  };
};
