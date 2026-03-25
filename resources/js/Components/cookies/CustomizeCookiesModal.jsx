import React from "react";
import { ChartColumn, Cookie, Megaphone, ShieldCheck, X } from "lucide-react";
import { useI18n } from "@/i18n";
import { COOKIE_CATEGORIES } from "@/Components/cookies/cookieConsentContent.js";
import {
  DEFAULT_COOKIE_SETTINGS,
  readCookieSettings,
  rejectOptionalCookies,
} from "@/utils/cookieConsent";

const CustomizeCookiesModal = ({ isOpen, onClose, onSave }) => {
  const { t } = useI18n();
  const [settings, setSettings] = React.useState(DEFAULT_COOKIE_SETTINGS);

  React.useEffect(() => {
    if (!isOpen) return;
    setSettings(readCookieSettings());
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const iconByKey = {
    functional: ShieldCheck,
    analytics: ChartColumn,
    marketing: Megaphone,
  };

  const handleChange = (e) => {
    const { name, checked } = e.target;
    setSettings((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSave = () => {
    onSave(settings);
  };

  const handleRejectOptional = () => {
    rejectOptionalCookies();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end bg-slate-950/55 backdrop-blur-sm sm:items-center sm:justify-center" onClick={onClose}>
      <div
        className="w-full overflow-hidden rounded-t-[2rem] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.35)] sm:max-w-3xl sm:rounded-[2rem]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-customize-title"
      >
        <div className="relative overflow-hidden border-b border-slate-100 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_45%),linear-gradient(180deg,#fff7ed_0%,#ffffff_78%)] px-6 pb-6 pt-6 sm:px-8">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full border border-white/70 bg-white/90 p-2 text-slate-500 shadow-sm transition hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-200"
            aria-label={t("cookies.actions.close_customizer")}
          >
            <X className="h-4 w-4" />
          </button>

          <span className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
            <Cookie className="h-3.5 w-3.5" />
            {t("cookies.customize.kicker")}
          </span>
          <h2 id="cookie-customize-title" className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            {t("cookies.customize.title")}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
            {t("cookies.customize.description")}
          </p>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-6 sm:px-8">
          <div className="space-y-4">
            {COOKIE_CATEGORIES.map((category) => {
              const Icon = iconByKey[category.key] || ShieldCheck;
              const isRequired = category.required;
              const checked = category.key === "functional" ? true : Boolean(settings[category.key]);

              return (
                <label
                  key={category.key}
                  className={`flex cursor-pointer items-start gap-4 rounded-3xl border p-4 transition ${isRequired ? "border-slate-200 bg-slate-50/80" : checked ? "border-amber-300 bg-amber-50/70 shadow-[0_10px_24px_rgba(251,191,36,0.12)]" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`}
                >
                  <span className={`inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${isRequired ? "bg-slate-900 text-white" : checked ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"}`}>
                    <Icon className="h-5 w-5" />
                  </span>

                  <span className="flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold text-slate-900">
                        {t(`cookies.categories.${category.key}.label`)}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${isRequired ? "bg-slate-900 text-white" : checked ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"}`}>
                        {isRequired ? t("cookies.categories.required") : checked ? t("cookies.categories.enabled") : t("cookies.categories.disabled")}
                      </span>
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-600">
                      {t(`cookies.categories.${category.key}.description`)}
                    </span>
                  </span>

                  <span className="relative mt-1 inline-flex items-center">
                    <input
                      type="checkbox"
                      name={category.key}
                      checked={checked}
                      disabled={isRequired}
                      onChange={handleChange}
                      className="peer sr-only"
                    />
                    <span className={`flex h-7 w-12 items-center rounded-full transition ${checked ? "bg-slate-900" : "bg-slate-200"}`}>
                      <span className={`mx-1 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "translate-x-5" : "translate-x-0"}`} />
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm leading-6 text-emerald-900">
            <p className="font-semibold">{t("cookies.customize.info_title")}</p>
            <p className="mt-1">{t("cookies.customize.info_body")}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-5 sm:flex-row sm:justify-between sm:px-8">
          <button
            type="button"
            onClick={handleRejectOptional}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            {t("cookies.actions.only_essential")}
          </button>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              {t("cookies.actions.cancel")}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              {t("cookies.actions.save_preferences")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizeCookiesModal;
