import { Camera, Sparkles } from 'lucide-react';
import ProfileAvatar from '@/Components/avatar/ProfileAvatar.jsx';
import { useI18n } from '@/i18n';

export default function AvatarPicker({ avatar, onOpen }) {
  const { t } = useI18n();

  return (
    <div className="rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_40%),linear-gradient(135deg,_#0f172a,_#1e293b_48%,_#334155)] p-6 text-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.8)] sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 sm:gap-5">
          <ProfileAvatar
            src={avatar}
            alt={t('profile.modern.user_avatar_alt')}
            className="h-20 w-20 rounded-full border-4 border-white/30 object-cover shadow-lg sm:h-24 sm:w-24"
          />
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-sky-100">
              <Sparkles className="h-3.5 w-3.5" />
              {t('profile.modern.hero_badge')}
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{t('profile.modern.hero_title')}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-200">
              {t('profile.modern.hero_subtitle')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          <Camera className="h-4 w-4" />
          {t('profile.change_avatar')}
        </button>
      </div>
    </div>
  );
}
