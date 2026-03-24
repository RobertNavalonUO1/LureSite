export default function StatsCard({ label, value, helper, tone = 'slate' }) {
    const toneClass = {
        slate: 'from-slate-900 to-slate-700 text-white',
        amber: 'from-amber-300 to-amber-500 text-amber-950',
        emerald: 'from-emerald-300 to-emerald-500 text-emerald-950',
        rose: 'from-rose-300 to-rose-500 text-rose-950',
    }[tone] || 'from-slate-900 to-slate-700 text-white';

    return (
        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className={`bg-gradient-to-br px-5 py-4 ${toneClass}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-75">
                    {label}
                </p>
                <p className="mt-3 text-3xl font-semibold leading-none">{value}</p>
            </div>
            <div className="px-5 py-4 text-sm text-slate-600">{helper}</div>
        </article>
    );
}