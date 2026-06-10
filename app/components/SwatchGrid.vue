<script setup lang="ts" generic="T extends string">
import type { ChoiceOption } from '~/types/configurator'

const props = defineProps<{
  options: ChoiceOption<T>[]
  modelValue: T
}>()

const emit = defineEmits<{ 'update:modelValue': [id: T] }>()

const current = computed(() => props.options.find(o => o.id === props.modelValue))
</script>

<template>
  <div>
    <div class="swatches" role="radiogroup">
      <button
        v-for="option in options"
        :key="option.id"
        class="swatch"
        role="radio"
        :aria-checked="option.id === modelValue"
        :class="{ active: option.id === modelValue }"
        :style="{ '--swatch': option.swatch }"
        :title="option.label"
        @click="emit('update:modelValue', option.id)"
      />
    </div>
    <p v-if="current" class="caption">
      <span class="name">{{ current.label }}</span>
      <span v-if="current.hint" class="hint"> — {{ current.hint }}</span>
      <span class="price mono">{{ current.price > 0 ? `+${current.price}.– CHF` : 'inclus' }}</span>
    </p>
  </div>
</template>

<style scoped>
.swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.swatch {
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 50%;
  border: none;
  background: radial-gradient(circle at 35% 30%, rgb(255 255 255 / 0.25), transparent 55%), var(--swatch);
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.14), inset 0 -6px 8px rgb(0 0 0 / 0.18);
  outline: 2px solid transparent;
  outline-offset: 2.5px;
  cursor: pointer;
  transition: transform 0.15s, outline-color 0.15s;
}

.swatch:hover {
  transform: scale(1.08);
}

.swatch.active {
  outline-color: var(--accent);
}

.caption {
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
  margin: 0.7rem 0 0;
  font-size: 0.82rem;
}

.name {
  font-weight: 500;
}

.hint {
  color: var(--text-dim);
}

.price {
  margin-left: auto;
  font-size: 0.72rem;
  color: var(--text-dim);
  white-space: nowrap;
}
</style>
