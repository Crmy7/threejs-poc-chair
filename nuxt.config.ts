export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  // App 100 % client : la scène 3D ne peut pas être rendue côté serveur,
  // et la config est restaurée depuis le hash de l'URL au chargement.
  ssr: false,

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'Fauteuil lounge — Configurateur 3D · Three.js',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'POC : configurateur produit 3D temps réel avec Three.js et Nuxt.',
        },
      ],
    },
  },

  vite: {
    optimizeDeps: {
      include: ['three'],
    },
  },
})
