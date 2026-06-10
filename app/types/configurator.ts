/**
 * Modèle de données du configurateur.
 * Tout l'état configurable vit ici — le moteur Three.js ne fait
 * que *refléter* cet état (séparation données / rendu).
 */

/** Les parties cliquables / configurables du produit. */
export type PartId = 'fabric' | 'wood' | 'metal'

export type FabricId =
  | 'mango'
  | 'peacock'
  | 'creme'
  | 'ardoise'
  | 'sauge'
  | 'rose'
  | 'nuit'
export type WoodId = 'brown' | 'clair' | 'fonce' | 'black'
export type MetalId = 'steel' | 'black' | 'chrome' | 'brass' | 'copper'
export type EnvironmentId = 'galerie' | 'loft' | 'nuit'

export interface ConfiguratorState {
  fabric: FabricId
  wood: WoodId
  metal: MetalId
  environment: EnvironmentId
  autoRotate: boolean
  /** Partie actuellement sélectionnée (via clic 3D ou panneau). */
  selectedPart: PartId | null
}

export interface ChoiceOption<T extends string = string> {
  id: T
  label: string
  hint?: string
  price: number
  /** Couleur de la pastille dans l'UI. */
  swatch?: string
}

/** Description d'une teinte appliquée sur la texture désaturée. */
export interface TintSpec {
  /** Couleur multipliée sur la texture grisée. */
  tint: string
  /** Boost de luminosité appliqué à la désaturation (1 = neutre). */
  brightness?: number
}
