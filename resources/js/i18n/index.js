import { usePage } from '@inertiajs/react';

import es from './es.json';
import en from './en.json';
import fr from './fr.json';

const MOJIBAKE_PATTERN = /Ã.|Â.|â.|ÔÇ|ƒ|ðŸ|â€™|â€œ|â€|â€¦|âœ|â†|â€“|�/;

const countMojibakeHits = (value) => {
  const matches = String(value).match(/Ã.|Â.|â.|ÔÇ|ƒ|ðŸ|â€™|â€œ|â€|â€¦|âœ|â†|â€“|�/g);
  return matches ? matches.length : 0;
};

const decodeUtf8FromLatin1 = (value) => {
  try {
    const bytes = Uint8Array.from(Array.from(String(value)), (char) => char.charCodeAt(0) & 0xff);
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return value;
  }
};

export const repairText = (value) => {
  if (typeof value !== 'string' || !MOJIBAKE_PATTERN.test(value)) {
    return value;
  }

  let current = value.normalize('NFC');

  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (!MOJIBAKE_PATTERN.test(current)) {
      break;
    }

    const decoded = decodeUtf8FromLatin1(current);

    if (decoded === current || decoded.includes('�') || countMojibakeHits(decoded) > countMojibakeHits(current)) {
      break;
    }

    current = decoded.normalize('NFC');
  }

  return current;
};

export const repairTextTree = (value) => {
  if (typeof value === 'string') {
    return repairText(value);
  }

  if (Array.isArray(value)) {
    return value.map(repairTextTree);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, repairTextTree(nestedValue)])
    );
  }

  return value;
};

const DICTS = {
  es: repairTextTree(es),
  en: repairTextTree(en),
  fr: repairTextTree(fr),
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
  return repairText(template.replace(/\{(\w+)\}/g, (match, key) => {
    if (params[key] === undefined || params[key] === null) return match;
    return repairText(String(params[key]));
  }));
};

export const translate = (locale, key, params) => {
  const lang = normalizeLocale(locale);
  const dict = DICTS[lang] || DICTS.es;
  const fallback = DICTS.es;

  const value = getByPath(dict, key) ?? getByPath(fallback, key) ?? String(key);
  return repairText(interpolate(value, params));
};

export const useI18n = () => {
  const { locale } = usePage().props;
  const lang = normalizeLocale(locale);

  return {
    locale: lang,
    t: (key, params) => translate(lang, key, params),
  };
};
