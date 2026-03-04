import { usePage } from '@inertiajs/react';

import es from './es.json';
import en from './en.json';
import fr from './fr.json';

const DICTS = { es, en, fr };

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
