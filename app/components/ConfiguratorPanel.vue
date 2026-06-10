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
      <p class="ref mono">SC-04 · Édition 2026</p>
      <h1>Fauteuil lounge</h1>
      <p class="subtitle">Velours, noyer massif et piètement métal, assemblés en Suisse.</p>
    </header>

    <div class="sections">
      <section :ref="sectionRefs.fabric" :class="{ highlighted: state.selectedPart === 'fabric' }">
        <h2><span class="idx mono">01</span> Revêtement</h2>
        <SwatchGrid v-model="state.fabric" :options="FABRICS" />
      </section>

      <section :ref="sectionRefs.wood" :class="{ highlighted: state.selectedPart === 'wood' }">
        <h2><span class="idx mono">02</span> Structure bois</h2>
        <SwatchGrid v-model="state.wood" :options="WOODS" />
      </section>

      <section :ref="sectionRefs.metal" :class="{ highlighted: state.selectedPart === 'metal' }">
        <h2><span class="idx mono">03</span> Piètement</h2>
        <SwatchGrid v-model="state.metal" :options="METALS" />
      </section>

      <section>
        <h2><span class="idx mono">04</span> Mise en scène</h2>
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
        <div class="price-meta">
          <span>Prix total</span>
          <span class="lead mono">Livraison 4 à 6 semaines</span>
        </div>
        <strong class="mono">{{ totalPrice.toLocaleString('fr-CH') }}.&ndash; CHF</strong>
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
  padding: 1.5rem 1.6rem 1.3rem;
  border-bottom: 1px solid var(--line);
}

.ref {
  margin: 0 0 0.6rem;
  font-size: 0.7rem;
  color: var(--text-dim);
}

h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.025em;
}

.subtitle {
  margin: 0.4rem 0 0;
  max-width: 26ch;
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--text-dim);
}

.sections {
  flex: 1;
  overflow-y: auto;
  padding: 0.3rem 1.6rem 1rem;
}

section {
  padding: 1.25rem 0.6rem;
  margin: 0 -0.6rem;
  border-bottom: 1px solid var(--line);
  transition: background 0.3s, box-shadow 0.3s;
}

section:last-child {
  border-bottom: none;
}

section.highlighted {
  background: #f6f4ee;
  box-shadow: inset 2px 0 0 var(--accent);
}

h2 {
  display: flex;
  align-items: baseline;
  gap: 0.55rem;
  margin: 0 0 0.85rem;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.idx {
  font-size: 0.7rem;
  font-weight: 400;
  color: var(--text-dim);
}

.env-tabs {
  display: flex;
  gap: 0.4rem;
}

.env-tabs button {
  flex: 1;
  padding: 0.5rem 0;
  border: 1px solid var(--line);
  border-radius: 0.4rem;
  background: var(--surface);
  color: var(--text-dim);
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.env-tabs button:hover {
  border-color: #cfcabd;
}

.env-tabs button.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-top: 1rem;
  font-size: 0.82rem;
  color: var(--text-dim);
  cursor: pointer;
}

.toggle input {
  accent-color: var(--accent);
}

.panel-footer {
  padding: 1.2rem 1.6rem 1.4rem;
  border-top: 1px solid var(--line);
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 1rem;
}

.price-meta {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  font-size: 0.82rem;
  color: var(--text);
}

.price-meta .lead {
  font-size: 0.68rem;
  color: var(--text-dim);
}

.price-row strong {
  font-size: 1.2rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.btn {
  width: 100%;
  padding: 0.8rem 1rem;
  border-radius: 0.45rem;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
  font-size: 0.85rem;
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
  opacity: 0.86;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

.btn.ghost {
  border: none;
  background: none;
  color: var(--text-dim);
  font-size: 0.78rem;
  padding: 0.5rem 0.4rem;
}

.btn.ghost:hover {
  color: var(--text);
}
</style>
