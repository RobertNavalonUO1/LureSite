/**
 * Configuración centralizada del sitio (branding + textos).
 * Mantener acá los strings evita duplicación en componentes.
 */

const site = {
  brand: {
    name: 'Limoneo',
    shortName: 'Limoneo',
    logoSrc: '/storage/logo/logo1.png',
    logoAlt: 'Limoneo',
    faviconIco: '/favicon.ico',
    faviconSvg: '/favicon.svg',
    manifest: '/site.webmanifest',
    appleTouchIcon: '/images/logo.png',
  },
  theme: {
    themeColor: '#d97706',
    accentColor: '#65a30d',
  },
  promo: {
    labelKey: 'header.promo.label',
    highlightKey: 'header.promo.highlight',
    suffixKey: 'header.promo.suffix',
  },
  support: {
    primaryLabelKey: 'header.support.primary',
    primaryHref: '/faq',
    secondaryLabelKey: 'header.support.secondary',
    secondaryHref: '/contact',
  },
  navigation: [
    { labelKey: 'header.navigation.home', href: '/' },
    { labelKey: 'header.navigation.about', href: '/about' },
    { labelKey: 'header.navigation.contact', href: '/contact' },
    { labelKey: 'header.navigation.help', href: '/faq' },
  ],
};

export default site;
