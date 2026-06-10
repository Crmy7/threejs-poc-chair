<script setup lang="ts">
import { ENVIRONMENTS, FABRICS, METALS, WOODS } from '~/lib/catalog'

const { state, totalPrice, reset } = useConfigurator()

/**
 * Le panneau « écoute » aussi la 3D : quand on clique une partie
 * du fauteuil (raycasting), la section correspondante est mise en
 * avant et défile en vue — la communication marche dans les deux sens.
 */
const sectionRefs = {
  fabric: ref<HTMLElement>(),
  wood: ref<HTMLElement>(),
  metal: ref<HTMLElement>(),
}

watch(() => state.value.selectedPart, (part) => {
  if (!part) return
  sectionRefs[part].value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
})

const copied = ref(false)

function shareLink() {
  navigator.clipboard.writeText(location.href)
  copied.value = true
  setTimeout(() => (copied.value = false), 1800)
}
</script>

<template>
  <aside class="panel">
    <header class="panel-header">
      <h1>Fauteuil lounge</h1>
      <p class="subtitle">Velours, noyer massif et piètement métal.</p>
    </header>

    <div class="sections">
      <section :ref="sectionRefs.fabric" :class="{ highlighted: state.selectedPart === 'fabric' }">
        <h2>Revêtement</h2>
        <SwatchGrid v-model="state.fabric" :options="FABRICS" />
      </section>

      <section :ref="sectionRefs.wood" :class="{ highlighted: state.selectedPart === 'wood' }">
        <h2>Structure bois</h2>
        <SwatchGrid v-model="state.wood" :options="WOODS" />
      </section>

      <section :ref="sectionRefs.metal" :class="{ highlighted: state.selectedPart === 'metal' }">
        <h2>Piètement</h2>
        <SwatchGrid v-model="state.metal" :options="METALS" />
      </section>

      <section>
        <h2>Ambiance</h2>
        <div class="env-tabs" role="radiogroup">
          <button
            v-for="env in ENVIRONMENTS"
            :key="env.id"
            role="radio"
            :aria-checked="state.environment === env.id"
            :class="{ active: state.environment === env.id }"
            @click="state.environment = env.id"
          >
            {{ env.label }}
          </button>
        </div>
        <label class="toggle">
          <input v-model="state.autoRotate" type="checkbox">
          <span>Faire pivoter le modèle</span>
        </label>
      </section>
    </div>

    <footer class="panel-footer">
      <div class="price-row">
        <span class="price-label">Total</span>
        <strong>{{ totalPrice.toLocaleString('fr-CH') }} CHF</strong>
      </div>
      <button class="btn primary">Ajouter au panier</button>
      <div class="actions">
        <button class="btn ghost" @click="shareLink">
          {{ copied ? 'Lien copié' : 'Copier le lien' }}
        </button>
        <button class="btn ghost" @click="reset">Réinitialiser</button>
      </div>
    </footer>
  </aside>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--surface);
  border-left: 1px solid var(--line);
}

.panel-header {
  padding: 1.6rem 1.7rem 1.4rem;
  border-bottom: 1px solid var(--line);
}

h1 {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.subtitle {
  margin: 0.35rem 0 0;
  font-size: 0.88rem;
  color: var(--text-dim);
}

.sections {
  flex: 1;
  overflow-y: auto;
  padding: 0.4rem 1.7rem 1rem;
}

section {
  padding: 1.4rem 0.7rem;
  margin: 0 -0.7rem;
  border-bottom: 1px solid var(--line);
  transition: background 0.3s, box-shadow 0.3s;
}

section:last-child {
  border-bottom: none;
}

section.highlighted {
  background: #f7f5f0;
  box-shadow: inset 2px 0 0 var(--accent);
}

h2 {
  margin: 0 0 0.95rem;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.env-tabs {
  display: flex;
  gap: 0.45rem;
}

.env-tabs button {
  flex: 1;
  padding: 0.55rem 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text-dim);
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.env-tabs button:hover {
  border-color: #d4cfc4;
  color: var(--text);
}

.env-tabs button.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 1.1rem;
  font-size: 0.88rem;
  color: var(--text-dim);
  cursor: pointer;
}

.toggle input {
  accent-color: var(--accent);
  width: 0.95rem;
  height: 0.95rem;
}

.panel-footer {
  padding: 1.3rem 1.7rem 1.5rem;
  border-top: 1px solid var(--line);
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 1.1rem;
}

.price-label {
  font-size: 0.9rem;
  color: var(--text-dim);
}

.price-row strong {
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.btn {
  width: 100%;
  padding: 0.85rem 1rem;
  border-radius: 9px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}

.btn.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.btn.primary:hover {
  opacity: 0.88;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.45rem;
  margin-top: 0.55rem;
}

.btn.ghost {
  border: none;
  background: none;
  color: var(--text-dim);
  font-size: 0.83rem;
  padding: 0.55rem 0.4rem;
}

.btn.ghost:hover {
  color: var(--text);
}
</style>
