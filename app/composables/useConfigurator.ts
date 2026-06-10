import { BASE_PRICE, FABRICS, METALS, WOODS } from '~/lib/catalog'
import type { ConfiguratorState } from '~/types/configurator'

/**
 * État global du configurateur (côté Vue).
 *
 * `useState` de Nuxt = un ref partagé entre tous les composants.
 * Le moteur Three.js ne connaît pas cet état : c'est SceneViewport
 * qui `watch` ces valeurs et appelle l'API du moteur.
 */

const DEFAULT_STATE: ConfiguratorState = {
  fabric: 'mango',
  wood: 'brown',
  metal: 'steel',
  environment: 'galerie',
  autoRotate: true,
  selectedPart: null,
}

export function useConfigurator() {
  const state = useState<ConfiguratorState>('configurator', () => ({
    ...DEFAULT_STATE,
    ...readStateFromUrl(),
  }))

  // Partage de configuration : l'état est sérialisé dans le hash de
  // l'URL → copier le lien suffit à partager sa config.
  if (import.meta.client) {
    watch(
      state,
      (s) => {
        const { selectedPart, ...shareable } = s
        history.replaceState(null, '', `#${btoa(JSON.stringify(shareable))}`)
      },
      { deep: true },
    )
  }

  const totalPrice = computed(() => {
    const s = state.value
    return (
      BASE_PRICE +
      (FABRICS.find(f => f.id === s.fabric)?.price ?? 0) +
      (WOODS.find(w => w.id === s.wood)?.price ?? 0) +
      (METALS.find(m => m.id === s.metal)?.price ?? 0)
    )
  })

  const reset = () => {
    state.value = { ...DEFAULT_STATE }
  }

  return { state, totalPrice, reset }
}

function readStateFromUrl(): Partial<ConfiguratorState> {
  if (!import.meta.client || !location.hash.slice(1)) return {}
  try {
    return JSON.parse(atob(location.hash.slice(1)))
  } catch {
    return {}
  }
}
