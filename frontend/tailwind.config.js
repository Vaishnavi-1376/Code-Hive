/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Your existing custom colors using CSS variables
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        danger: 'var(--color-danger)',
        success: 'var(--color-success)',
      },
      // --- Keyframes for animations ---
      keyframes: {
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-slow': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pop-in': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '70%': { transform: 'scale(1.05)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slow-blob': {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(20px, -30px) scale(1.05)' },
          '66%': { transform: 'translate(-10px, 15px) scale(0.95)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
      },
      // --- Animation definitions ---
      animation: {
        'fade-in-down': 'fade-in-down 0.7s ease-out forwards',
        'pop-in': 'pop-in 0.6s ease-out forwards 1.2s',
        'fade-in-slow': 'fade-in-slow 1.5s ease-out forwards 0.5s',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'slow-blob': 'slow-blob 10s infinite ease-in-out',
      },
      // --- Custom animation delays (if not using arbitrary values like delay-[2000ms]) ---
      animationDelay: {
        '2000': '2000ms',
        '4000': '4000ms',
      },
    },
  },
  plugins: [
    // REMOVE THIS LINE:
    // require('@tailwindcss/line-clamp'),
    // No other plugins are explicitly listed in your provided config, so this array will be empty.
  ],
}