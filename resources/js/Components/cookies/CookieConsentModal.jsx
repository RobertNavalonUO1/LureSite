import React from "react";
import { ChartColumn, Cookie, Megaphone, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useI18n } from "@/i18n";
import { COOKIE_CATEGORIES } from "@/Components/cookies/cookieConsentContent.js";

const CookieConsentModal = ({ onAccept, onReject, onCustomize }) => {
  const { t } = useI18n();

  const categoryIcons = {
    shield: ShieldCheck,
    chart: ChartColumn,
    megaphone: Megaphone,
  };

  return (
    <div className="fixed inset-x-0 bottom-3 z-50 px-3 sm:bottom-5 sm:px-6">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-amber-200/70 bg-[linear-gradient(135deg,rgba(255,251,235,0.98),rgba(255,255,255,0.98))] shadow-[0_22px_70px_rgba(15,23,42,0.18)] backdrop-blur">
        <div className="flex flex-col gap-6 px-5 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-800">
                <Cookie className="h-3.5 w-3.5" />
                {t("cookies.banner.kicker")}
              </span>
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                {t("cookies.banner.privacy_note")}
              </span>
            </div>

            <div className="mt-4 max-w-3xl space-y-3">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                {t("cookies.banner.title")}
              </h2>
              <p className="text-sm leading-6 text-slate-700 sm:text-[15px]">
                {t("cookies.banner.description")}
              </p>
              <p className="text-sm text-slate-500">
                {t("cookies.banner.secondary")}
                <a href="/cookies" className="ml-1 font-semibold text-amber-700 underline decoration-amber-300 underline-offset-4 transition hover:text-amber-800">
                  {t("cookies.banner.policy_link")}
                </a>
              </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {COOKIE_CATEGORIES.map((category) => {
                const Icon = categoryIcons[category.icon] || ShieldCheck;
                return (
                  <div
                    key={category.key}
                    className="rounded-2xl border border-white/80 bg-white/80 p-3 shadow-[0_10px_25px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {t(`cookies.categories.${category.key}.label`)}
                          </p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${category.required ? "bg-slate-900 text-white" : "bg-amber-100 text-amber-800"}`}>
                            {category.required ? t("cookies.categories.required") : t("cookies.categories.optional")}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {t(`cookies.categories.${category.key}.summary`)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 lg:w-auto lg:min-w-[280px]">
            <button
              type="button"
              onClick={onAccept}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <ShieldCheck className="h-4.5 w-4.5" />
              {t("cookies.actions.accept_all")}
            </button>

            <button
              type="button"
              onClick={onCustomize}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-200"
            >
              <SlidersHorizontal className="h-4.5 w-4.5" />
              {t("cookies.actions.customize")}
            </button>

            <button
              type="button"
              onClick={onReject}
              className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              {t("cookies.actions.reject_optional")}
            </button>

            <p className="px-1 text-center text-xs leading-5 text-slate-500 lg:text-left">
              {t("cookies.banner.footer_note")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentModal;
