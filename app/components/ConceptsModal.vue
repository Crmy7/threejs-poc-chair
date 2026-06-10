<script setup lang="ts">
defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

/** Support de présentation : les briques de Three.js, mappées au code du POC. */
const concepts = [
  {
    n: 1,
    title: 'Scene — le monde',
    code: 'new THREE.Scene()',
    text: 'Un arbre (scene graph) qui contient tous les objets, lumières et caméras. On y ajoute/retire des éléments comme dans un DOM.',
    file: 'lib/three/engine.ts',
  },
  {
    n: 2,
    title: 'Camera — l\'œil',
    code: 'new THREE.PerspectiveCamera(fov, aspect, near, far)',
    text: 'Le point de vue. La perspective imite l\'œil humain ; near/far délimitent ce qui est visible.',
    file: 'lib/three/engine.ts',
  },
  {
    n: 3,
    title: 'Renderer — le peintre',
    code: 'new THREE.WebGLRenderer({ canvas })',
    text: 'Dessine la scène vue par la caméra dans un <canvas> via WebGL (GPU). Tone mapping ACES pour un rendu photo.',
    file: 'lib/three/engine.ts',
  },
  {
    n: 4,
    title: 'Assets réels — glTF',
    code: 'new GLTFLoader().loadAsync(\'/models/chair.glb\')',
    text: 'glTF est « le JPEG de la 3D » : géométries, textures PBR et variantes de matériaux authorées par le designer (KHR_materials_variants). Le code ne fait que les activer.',
    file: 'lib/three/product.ts',
  },
  {
    n: 5,
    title: 'Lumières & environnement (IBL)',
    code: 'RGBELoader + PMREMGenerator',
    text: 'Une vraie HDRI de studio éclaire le modèle par image (Image-Based Lighting) : c\'est elle qui rend le velours et les métaux crédibles. Une seule lumière directionnelle s\'ajoute pour l\'ombre portée.',
    file: 'lib/three/engine.ts',
  },
  {
    n: 6,
    title: 'Controls — l\'interaction caméra',
    code: 'new OrbitControls(camera, canvas)',
    text: 'Orbiter / zoomer autour d\'une cible, avec inertie (damping). Un addon officiel, pas le cœur de la lib.',
    file: 'lib/three/engine.ts',
  },
  {
    n: 7,
    title: 'Animation loop',
    code: 'requestAnimationFrame(tick)',
    text: '~60×/s : mise à jour (contrôles, transitions d\'exposition) puis rendu d\'une frame. Indépendant du rendu Vue.',
    file: 'lib/three/engine.ts',
  },
  {
    n: 8,
    title: 'Raycasting — cliquer la 3D',
    code: 'raycaster.setFromCamera(pointer, camera)',
    text: 'Un rayon part de la caméra à travers le pixel cliqué ; les intersections donnent l\'objet touché → on remonte l\'info à Vue.',
    file: 'lib/three/engine.ts',
  },
  {
    n: 9,
    title: 'Cycle de vie & perfs',
    code: 'dispose() / ResizeObserver / setPixelRatio',
    text: 'Libérer la mémoire GPU au démontage (géométries, matériaux, textures), suivre la taille du conteneur, borner le pixel ratio sur Retina.',
    file: 'lib/three/engine.ts',
  },
]
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="overlay" @click.self="emit('close')">
        <div class="modal">
          <header>
            <h2>Three.js en 9 concepts</h2>
            <p>Chaque concept est balisé <code>CONCEPT №x</code> dans le code source.</p>
            <button class="close" aria-label="Fermer" @click="emit('close')">✕</button>
          </header>
          <ol class="concepts">
            <li v-for="c in concepts" :key="c.n">
              <span class="num">{{ c.n }}</span>
              <div>
                <h3>{{ c.title }}</h3>
                <code class="snippet">{{ c.code }}</code>
                <p>{{ c.text }}</p>
                <span class="file">{{ c.file }}</span>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 2rem;
  background: rgb(20 18 14 / 0.4);
  backdrop-filter: blur(6px);
}

.modal {
  position: relative;
  width: min(46rem, 100%);
  max-height: 85vh;
  overflow-y: auto;
  border-radius: 0.9rem;
  border: 1px solid var(--line);
  background: var(--surface);
  padding: 1.8rem 2rem;
}

header h2 {
  margin: 0;
  font-size: 1.4rem;
}

header p {
  margin: 0.3rem 0 0;
  font-size: 0.82rem;
  color: var(--text-dim);
}

.close {
  position: absolute;
  top: 1.2rem;
  right: 1.3rem;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  cursor: pointer;
}

.concepts {
  list-style: none;
  margin: 1.4rem 0 0;
  padding: 0;
  display: grid;
  gap: 0.7rem;
}

.concepts li {
  display: flex;
  gap: 1rem;
  padding: 0.9rem 1rem;
  border-radius: 0.6rem;
  border: 1px solid var(--line);
  background: #fbfaf8;
}

.num {
  flex: none;
  width: 1.8rem;
  height: 1.8rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  font-weight: 700;
  font-size: 0.8rem;
}

.concepts h3 {
  margin: 0.15rem 0 0.35rem;
  font-size: 0.95rem;
}

.snippet {
  display: inline-block;
  margin-bottom: 0.35rem;
  padding: 0.18rem 0.5rem;
  border-radius: 0.35rem;
  background: #211f1b;
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.72rem;
  color: #ffd9a0;
}

.concepts p {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.55;
  color: var(--text-dim);
}

.file {
  display: inline-block;
  margin-top: 0.4rem;
  font-size: 0.72rem;
  color: var(--text-dim);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
