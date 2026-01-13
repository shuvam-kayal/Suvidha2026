/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            // ===========================================
            // KIOSK-OPTIMIZED TOUCH TARGETS
            // Minimum 48px for WCAG 2.1 AA Compliance
            // ===========================================
            spacing: {
                'touch': '48px',        // Minimum touch target
                'touch-lg': '56px',     // Comfortable touch target
                'touch-xl': '64px',     // Large prominent buttons
            },

            // ===========================================
            // HIGH CONTRAST COLOR PALETTE
            // Meets WCAG AA 4.5:1 contrast ratio
            // ===========================================
            colors: {
                // Primary - Deep Blue (Trustworthy, Government)
                primary: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#2563eb',  // Main
                    600: '#1d4ed8',
                    700: '#1e40af',
                    800: '#1e3a8a',
                    900: '#172554',
                },
                // Secondary - Emerald (Growth, Success)
                secondary: {
                    50: '#ecfdf5',
                    100: '#d1fae5',
                    200: '#a7f3d0',
                    300: '#6ee7b7',
                    400: '#34d399',
                    500: '#10b981',  // Main
                    600: '#059669',
                    700: '#047857',
                    800: '#065f46',
                    900: '#064e3b',
                },
                // Accent - Amber (Attention, Alerts)
                accent: {
                    50: '#fffbeb',
                    100: '#fef3c7',
                    200: '#fde68a',
                    300: '#fcd34d',
                    400: '#fbbf24',
                    500: '#f59e0b',  // Main
                    600: '#d97706',
                    700: '#b45309',
                    800: '#92400e',
                    900: '#78350f',
                },
                // Status Colors
                success: '#059669',
                warning: '#d97706',
                error: '#dc2626',
                info: '#2563eb',

                // Kiosk Specific
                kiosk: {
                    bg: '#0f172a',         // Dark background
                    card: '#1e293b',       // Card background
                    border: '#334155',     // Border color
                    text: '#f8fafc',       // High contrast text
                    muted: '#94a3b8',      // Secondary text
                },
            },

            // ===========================================
            // TYPOGRAPHY FOR ACCESSIBILITY
            // ===========================================
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'Inter', 'sans-serif'],
            },
            fontSize: {
                'kiosk-sm': ['1rem', { lineHeight: '1.5' }],
                'kiosk-base': ['1.25rem', { lineHeight: '1.5' }],
                'kiosk-lg': ['1.5rem', { lineHeight: '1.4' }],
                'kiosk-xl': ['2rem', { lineHeight: '1.3' }],
                'kiosk-2xl': ['2.5rem', { lineHeight: '1.2' }],
                'kiosk-3xl': ['3rem', { lineHeight: '1.1' }],
            },

            // ===========================================
            // ANIMATIONS
            // ===========================================
            animation: {
                'button-press': 'buttonPress 0.15s ease-out',
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
            },
            keyframes: {
                buttonPress: {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(0.97)' },
                    '100%': { transform: 'scale(1)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                pulseSubtle: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.8' },
                },
            },

            // ===========================================
            // BORDER RADIUS FOR TOUCH
            // ===========================================
            borderRadius: {
                'kiosk': '12px',
                'kiosk-lg': '16px',
                'kiosk-xl': '24px',
            },

            // ===========================================
            // BOX SHADOWS
            // ===========================================
            boxShadow: {
                'kiosk': '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.2)',
                'kiosk-lg': '0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.2)',
                'kiosk-glow': '0 0 20px rgb(37 99 235 / 0.3)',
            },
        },
    },
    plugins: [],
};
