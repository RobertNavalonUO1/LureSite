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
    primaryColor: 'blue-600',
    accentColor: 'green-600',
    cardShadow: 'shadow-md',
    borderRadius: 'rounded-lg',
  },

  cookies: {
    showConsentByDefault: true,
  },
};

export default UI_CONFIG;
