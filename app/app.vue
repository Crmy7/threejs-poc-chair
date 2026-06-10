<script setup lang="ts">
/**
 * Layout : viewport 3D à gauche, panneau de configuration à droite.
 * Tout le Three.js est encapsulé dans <SceneViewport> ;
 * le reste de l'app est du Vue/Nuxt parfaitement classique.
 */
const viewportRef = ref<{ downloadScreenshot: () => void }>()
const conceptsOpen = ref(false)
</script>

<template>
  <div class="layout">
    <main class="stage">
      <ClientOnly>
        <SceneViewport ref="viewportRef" />
        <template #fallback>
          <div class="loading">Chargement de la scène 3D…</div>
        </template>
      </ClientOnly>

      <div class="stage-actions">
        <button class="chip" @click="conceptsOpen = true">
          Comment ça marche
        </button>
        <button class="chip" @click="viewportRef?.downloadScreenshot()">
          Exporter l'image
        </button>
      </div>
    </main>

    <ConfiguratorPanel />

    <ConceptsModal :open="conceptsOpen" @close="conceptsOpen = false" />
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 1fr minmax(21rem, 26rem);
  height: 100dvh;
}

.stage {
  position: relative;
  min-width: 0;
  background: var(--stage-bg);
}

.loading {
  display: grid;
  place-items: center;
  height: 100%;
  color: var(--text-dim);
  font-size: 0.85rem;
}

.stage-actions {
  position: absolute;
  top: 1.1rem;
  left: 1.1rem;
  display: flex;
  gap: 0.45rem;
}

.chip {
  padding: 0.5rem 0.9rem;
  border-radius: 0.4rem;
  border: 1px solid rgb(0 0 0 / 0.1);
  background: rgb(255 255 255 / 0.82);
  backdrop-filter: blur(8px);
  color: var(--text);
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.chip:hover {
  background: rgb(255 255 255 / 0.98);
  border-color: rgb(0 0 0 / 0.2);
}

@media (max-width: 56rem) {
  .layout {
    grid-template-columns: 1fr;
    grid-template-rows: 52dvh 1fr;
  }

  .panel {
    border-left: none;
  }
}
</style>
