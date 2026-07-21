export default defineNuxtConfig({
  compatibilityDate: '2024-07-04',
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/styles/reset.css', '~/assets/styles/shadows.css', '~/assets/styles/theme.css'],
  app: {
    head: {
      script: [
        {
          innerHTML: `(function () {
            try {
              var savedTheme = localStorage.getItem('site-theme');
              var theme = savedTheme === 'dark' ? 'dark' : 'light';
              document.documentElement.dataset.theme = theme;
              document.documentElement.style.colorScheme = theme;
            } catch (_) {}
          })();`,
        },
      ],
    },
  },
  runtimeConfig: {
    apiBaseUrl: process.env.NUXT_API_BASE_URL,
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL,
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL,
      adminUrl: process.env.NUXT_PUBLIC_ADMIN_URL,
    },
  },
  typescript: {
    strict: true,
    typeCheck: true,
  },
});
