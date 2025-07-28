import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import aspectRatio from '@tailwindcss/aspect-ratio';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
    './storage/framework/views/*.php',
    './resources/views/**/*.blade.php',
    './resources/js/**/*.jsx',
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', 'Inter', ...defaultTheme.fontFamily.sans],
        display: ['Playfair Display', 'serif'],
        mono: ['Fira Code', ...defaultTheme.fontFamily.mono],
      },

      colors: {
        primary: {
          DEFAULT: '#0ea5e9',     // azul principal (sky-500)
          dark: '#0369a1',        // sky-700
          light: '#e0f2fe',       // sky-100
        },
        secondary: {
          DEFAULT: '#06b6d4',     // cyan-500
          dark: '#155e75',        // cyan-800
          light: '#cffafe',       // cyan-100
        },
        accent: {
          DEFAULT: '#d946ef',     // fuchsia-500
          light: '#fae8ff',       // fuchsia-100
        },
        neutral: {
          DEFAULT: '#334155',     // zinc-700
          light: '#f1f5f9',       // zinc-100
          lighter: '#f8fafc',     // zinc-50
        },
        success: {
          DEFAULT: '#22c55e',     // verde éxito (lime-500)
          light: '#dcfce7',       // lime-100
        },
        error: {
          DEFAULT: '#ef4444',     // rojo error
          light: '#fee2e2',       // red-100
        },
      },

      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '4xl': '2rem',
      },

      boxShadow: {
        soft: '0 4px 20px rgba(0, 0, 0, 0.05)',
        glow: '0 0 8px rgba(14, 165, 233, 0.5)',
      },

      spacing: {
        'header-height': '4.5rem',
      },

      zIndex: {
        60: '60',
        70: '70',
        80: '80',
        90: '90',
      },

      animation: {
        'fade-in-up': 'fadeInUp 0.4s ease-out',
      },

      keyframes: {
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },

  plugins: [
    forms,
    typography,
    aspectRatio,
  ],
};
