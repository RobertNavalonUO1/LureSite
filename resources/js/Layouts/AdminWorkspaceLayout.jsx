import HeaderNav from '@/Components/Admin/HeaderNav.jsx';

export default function AdminWorkspaceLayout({ title, description, actions, children }) {
    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.14),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.1),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)]">
            <HeaderNav />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
                    {(title || description || actions) && (
                        <header className="mb-8 flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl">
                                {title ? (
                                    <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                                        {title}
                                    </h1>
                                ) : null}
                                {description ? (
                                    <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
                                        {description}
                                    </p>
                                ) : null}
                            </div>
                            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
                        </header>
                    )}

                    {children}
                </div>
            </div>
        </div>
    );
}