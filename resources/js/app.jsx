import '../css/app.css';
import './bootstrap';
import 'font-awesome/css/font-awesome.min.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import React from 'react';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        const AppWithHtmlLang = (appProps) => {
            const locale = appProps?.initialPage?.props?.locale;

            React.useEffect(() => {
                if (typeof document === 'undefined') return;
                const lang = String(locale || 'es').slice(0, 2).toLowerCase();
                document.documentElement.lang = lang;
            }, [locale]);

            return <App {...appProps} />;
        };

        root.render(<AppWithHtmlLang {...props} />);
    },
    progress: {
        color: '#d97706',
    },
});
