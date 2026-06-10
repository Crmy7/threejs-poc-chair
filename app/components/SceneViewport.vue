<script setup lang="ts">
import { ConfiguratorEngine } from '~/lib/three/engine'
import { PART_LABELS } from '~/lib/catalog'

/**
 * Le pont Vue ⇄ Three.js.
 *
 * - `onMounted`  : on instancie le moteur sur le <canvas>
 * - `watch`      : chaque changement d'état Vue → un appel d'API moteur
 * - `onUnmounted`: dispose() pour libérer la mémoire GPU
 *
 * Le canvas n'est PAS réactif : Three.js redessine 60 fois/s dans sa
 * propre boucle, indépendamment du cycle de rendu de Vue.
 */

const { state } = useConfigurator()
const canvasRef = ref<HTMLCanvasElement>()
const loading = ref(true)
let engine: ConfiguratorEngine | null = null

onMounted(async () => {
  engine = new ConfiguratorEngine(canvasRef.value!, (part) => {
    state.value.selectedPart = part
  })

  engine.setEnvironment(state.value.environment)
  engine.setAutoRotate(state.value.autoRotate)

  // Chargement des assets réels (modèle .glb + HDRI)
  await engine.init()
  loading.value = false

  // Applique la config initiale (ex. restaurée depuis l'URL)
  engine.setFabric(state.value.fabric)
  engine.setWood(state.value.wood)
  engine.setMetal(state.value.metal)
})

onUnmounted(() => {
  engine?.dispose()
  engine = null
})

watch(() => state.value.fabric, f => engine?.setFabric(f))
watch(() => state.value.wood, w => engine?.setWood(w))
watch(() => state.value.metal, m => engine?.setMetal(m))
watch(() => state.value.environment, e => engine?.setEnvironment(e))
watch(() => state.value.autoRotate, r => engine?.setAutoRotate(r))
watch(() => state.value.selectedPart, p => engine?.setHighlight(p))

function downloadScreenshot() {
  if (!engine) return
  const link = document.createElement('a')
  link.download = 'fauteuil-lounge.png'
  link.href = engine.screenshot()
  link.click()
}

defineExpose({ downloadScreenshot })
</script>

<template>
  <div class="viewport">
    <canvas ref="canvasRef" />

    <Transition name="fade">
      <div v-if="loading" class="loader">
        <span class="spinner" />
        Chargement du modèle…
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="state.selectedPart" class="selection-badge">
        <span class="dot" />
        {{ PART_LABELS[state.selectedPart] }}
        <button aria-label="Désélectionner" @click="state.selectedPart = null">✕</button>
      </div>
    </Transition>

    <p class="hint">Glissez pour pivoter · molette pour zoomer · cliquez une pièce pour la modifier</p>
  </div>
</template>

<style scoped>
.viewport {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
}

canvas:active {
  cursor: grabbing;
}

.loader {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  font-size: 0.82rem;
  color: var(--text-dim);
  background: var(--stage-bg);
}

.spinner {
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  border: 2px solid rgb(0 0 0 / 0.12);
  border-top-color: var(--text);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    rotate: 360deg;
  }
}

.selection-badge {
  position: absolute;
  top: 1.1rem;
  left: 50%;
  translate: -50% 0;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.42rem 0.6rem 0.42rem 0.85rem;
  border-radius: 0.4rem;
  border: 1px solid rgb(0 0 0 / 0.08);
  background: rgb(255 255 255 / 0.9);
  backdrop-filter: blur(8px);
  color: var(--text);
  font-size: 0.8rem;
  font-weight: 500;
}

.selection-badge .dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: var(--accent);
}

.selection-badge button {
  border: none;
  background: none;
  color: rgb(0 0 0 / 0.4);
  cursor: pointer;
  font-size: 0.75rem;
  padding: 0 0.1rem;
}

.hint {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  translate: -50% 0;
  margin: 0;
  font-size: 0.66rem;
  color: rgb(110 108 101 / 0.8);
  pointer-events: none;
  white-space: nowrap;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
