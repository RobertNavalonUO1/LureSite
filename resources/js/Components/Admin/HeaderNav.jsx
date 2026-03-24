import { Link, usePage } from '@inertiajs/react';

const NAV_ITEMS = [
    {
        label: 'Dashboard',
        href: '/admin/dashboard',
        match: (url) => url.startsWith('/admin/dashboard'),
    },
    {
        label: 'Link Aggregator',
        href: '/agregador-enlaces',
        match: (url) => url.startsWith('/agregador-enlaces') || url.startsWith('/link-aggregator'),
    },
    {
        label: 'Gestion de Productos',
        href: '/admin/products',
        match: (url) => url.startsWith('/admin/products'),
    },
    {
        label: 'Agregar Producto',
        href: '/products/add',
        match: (url) => url.startsWith('/products/add'),
    },
    {
        label: 'Migrar',
        href: '/migrate-products',
        match: (url) => url.startsWith('/migrate-products'),
    },
];

export default function HeaderNav() {
    const page = usePage();
    const currentUrl = page.url || '';

    return (
        <nav className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                            Admin Workspace
                        </p>
                        <p className="text-sm text-slate-600">
                            Navegacion rapida entre extraccion, gestion y migracion.
                        </p>
                    </div>
                    <Link
                        href="/"
                        className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                        Ver tienda
                    </Link>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                    {NAV_ITEMS.map((item) => {
                        const active = item.match(currentUrl);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={[
                                    'whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition',
                                    active
                                        ? 'border-amber-300 bg-amber-100 text-amber-950 shadow-sm'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900',
                                ].join(' ')}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}