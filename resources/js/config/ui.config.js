// src/config/ui.config.js

const UI_CONFIG = {
  loader: {
    // Duración simulada del loading artificial (en milisegundos)
    delay: 1200,
    // Cantidad de productos fantasma a mostrar mientras se cargan
    skeletonCount: 8,
  },

  product: {
    defaultRating: 4,
    defaultReviewCount: 12,
  },

  theme: {
    primaryColor: 'amber-600',
    accentColor: 'lime-600',
    cardShadow: 'shadow-lg',
    borderRadius: 'rounded-2xl',
  },

  cookies: {
    showConsentByDefault: true,
  },
};

export default UI_CONFIG;
