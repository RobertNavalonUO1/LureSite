export const COOKIE_CONSENT_KEY = "cookiesAccepted";
export const COOKIE_SETTINGS_KEY = "cookieSettings";

export const DEFAULT_COOKIE_SETTINGS = {
  functional: true,
  analytics: false,
  marketing: false,
};

export function readCookieSettings() {
  if (typeof window === "undefined") {
    return { ...DEFAULT_COOKIE_SETTINGS };
  }

  try {
    const raw = window.localStorage.getItem(COOKIE_SETTINGS_KEY);
    if (!raw) {
      return { ...DEFAULT_COOKIE_SETTINGS };
    }

    const parsed = JSON.parse(raw);
    return {
      functional: true,
      analytics: Boolean(parsed?.analytics),
      marketing: Boolean(parsed?.marketing),
    };
  } catch {
    return { ...DEFAULT_COOKIE_SETTINGS };
  }
}

export function hasSavedCookieConsent() {
  if (typeof window === "undefined") {
    return true;
  }

  return (
    window.localStorage.getItem(COOKIE_CONSENT_KEY) !== null
    || window.localStorage.getItem(COOKIE_SETTINGS_KEY) !== null
  );
}

export function saveCookieConsent(status, settings) {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = {
    functional: true,
    analytics: Boolean(settings?.analytics),
    marketing: Boolean(settings?.marketing),
  };

  window.localStorage.setItem(COOKIE_SETTINGS_KEY, JSON.stringify(normalized));
  window.localStorage.setItem(COOKIE_CONSENT_KEY, status);
}

export function acceptAllCookies() {
  saveCookieConsent("true", {
    functional: true,
    analytics: true,
    marketing: true,
  });
}

export function rejectOptionalCookies() {
  saveCookieConsent("false", DEFAULT_COOKIE_SETTINGS);
}

export function saveCustomCookieSelection(settings) {
  saveCookieConsent("custom", settings);
}