/**
 * Configuración centralizada del sitio (branding + textos).
 * Mantener acá los strings evita duplicación en componentes.
 */

const site = {
  brand: {
    name: 'Limoneo',
    logoSrc: '/images/logo.png',
    logoAlt: 'Limoneo',
  },
  promo: {
    label: 'Oferta del dia:',
    highlight: 'envios gratis',
    suffix: 'en compras mayores a $50',
  },
  support: {
    phoneDisplay: '+52 1 800 000 0000',
    phoneTel: '+521800000000',
    email: 'contacto@limoneo.com',
  },
  navigation: [
    { label: 'Inicio', href: '/' },
    { label: 'Acerca', href: '/about' },
    { label: 'Contacto', href: '/contact' },
    { label: 'Ayuda', href: '/faq' },
  ],
};

export default site;
