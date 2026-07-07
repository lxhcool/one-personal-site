export default defineNuxtConfig({
  compatibilityDate: '2024-07-04',
  css: ['~/assets/styles/reset.css', '~/assets/styles/shadows.css', '~/assets/styles/theme.css'],
  runtimeConfig: {
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
