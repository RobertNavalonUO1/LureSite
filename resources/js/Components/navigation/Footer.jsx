import React from 'react';
import { Link } from '@inertiajs/react';
import { FileText, Headset, House, Info, Mail, ShieldCheck, Sparkles } from 'lucide-react';

import site from '@/config/site';
import { useI18n } from '@/i18n';

const Footer = () => {
  const { t } = useI18n();

  return (
    <footer className="relative z-10 mt-16 overflow-hidden border-t border-amber-100 bg-[linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(30,41,59,0.98)_46%,_rgba(120,53,15,0.98)_100%)] text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">

        <div>
          <div className="mb-4 flex items-center gap-3">
            <img src={site.brand.logoSrc} alt={site.brand.logoAlt} className="h-12 w-12 rounded-full border border-white/15 bg-white/95 object-cover p-1" />
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">{site.brand.name}</h2>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300">{t('footer.brand_kicker')}</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-slate-300">
            {t('footer.description')}
          </p>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold">{t('footer.explore_title')}</h2>
          <ul className="space-y-3 text-sm text-slate-300">
            <li><Link href="/" className="inline-flex items-center gap-2 transition hover:text-white"><House className="h-4 w-4" />{t('common.home')}</Link></li>
            <li><Link href="/search" className="inline-flex items-center gap-2 transition hover:text-white"><Sparkles className="h-4 w-4" />{t('footer.catalog')}</Link></li>
            <li><Link href="/about" className="inline-flex items-center gap-2 transition hover:text-white"><Info className="h-4 w-4" />{t('header.navigation.about')}</Link></li>
            <li><Link href="/contact" className="inline-flex items-center gap-2 transition hover:text-white"><Mail className="h-4 w-4" />{t('common.contact')}</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold">{t('footer.legal_title')}</h2>
          <ul className="space-y-3 text-sm text-slate-300">
            <li><Link href="/privacy" className="inline-flex items-center gap-2 transition hover:text-white"><ShieldCheck className="h-4 w-4" />{t('footer.privacy')}</Link></li>
            <li><Link href="/terms" className="inline-flex items-center gap-2 transition hover:text-white"><FileText className="h-4 w-4" />{t('footer.terms')}</Link></li>
            <li><Link href="/cookies" className="inline-flex items-center gap-2 transition hover:text-white"><Sparkles className="h-4 w-4" />{t('footer.cookies')}</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold">{t('footer.help_title')}</h2>
          <div className="space-y-3 text-sm text-slate-300">
            <p>
              {t('footer.help_body')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/faq" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 font-semibold text-white transition hover:bg-white/20"><Headset className="h-4 w-4" />{t('footer.help_cta')}</Link>
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 font-semibold text-white transition hover:bg-white/10"><Mail className="h-4 w-4" />{t('footer.contact_cta')}</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-white/10 px-6 py-6 text-center text-sm text-slate-400">
        &copy; {new Date().getFullYear()} {site.brand.name}. {t('footer.rights')}
      </div>

      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-gradient-to-tr from-amber-500/25 to-transparent blur-3xl" />
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-gradient-to-br from-lime-400/15 to-transparent blur-2xl" />
      </div>
    </footer>
  );
};

export default Footer;
