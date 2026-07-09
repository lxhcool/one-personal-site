import type { Config } from 'tailwindcss';

export default <Config>{
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.ts',
    './plugins/**/*.ts',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      fontSize: {
        xxs: '0.625rem',
      },
      backgroundImage: {
        chevron: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='0.75rem' height='0.75rem' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2329323D' stroke-width='1.25' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
