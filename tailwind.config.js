import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.{tsx,ts,jsx,js}',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'Segoe UI', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                alcaldia: {
                    green: '#1B6B35',
                    'green-dark': '#134D27',
                    'green-light': '#22883F',
                    yellow: '#F5A623',
                    'yellow-dark': '#D97706',
                    blue: '#1A4A7A',
                    charcoal: '#2D3748',
                },
            },
        },
    },

    plugins: [forms],
};
