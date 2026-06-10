import type {
  ChoiceOption,
  EnvironmentId,
  FabricId,
  MetalId,
  TintSpec,
  WoodId,
} from '~/types/configurator'

/**
 * Catalogue produit : options, tarifs, presets d'ambiance.
 *
 * Deux familles d'options :
 * - les variantes AUTHORÉES dans le .glb (KHR_materials_variants) :
 *   velours Mangue/Paon, noyer/noir — telles que livrées par le designer ;
 * - les teintes GÉNÉRÉES : la texture d'origine est désaturée une fois
 *   au chargement, puis multipliée par une couleur — relief, capitonnage
 *   et effet velours sont conservés (voir lib/three/product.ts).
 */

export const BASE_PRICE = 1490

export const FABRICS: ChoiceOption<FabricId>[] = [
  { id: 'mango', label: 'Velours Mangue', hint: 'Teinte d\'origine · dorée', price: 0, swatch: '#c98a2e' },
  { id: 'peacock', label: 'Velours Paon', hint: 'Teinte d\'origine · bleu canard', price: 180, swatch: '#15555c' },
  { id: 'creme', label: 'Velours Crème', hint: 'Teinte atelier', price: 120, swatch: '#d8cdb9' },
  { id: 'ardoise', label: 'Velours Ardoise', hint: 'Teinte atelier', price: 120, swatch: '#5a6470' },
  { id: 'sauge', label: 'Velours Sauge', hint: 'Teinte atelier', price: 120, swatch: '#7d8c74' },
  { id: 'rose', label: 'Velours Rose poudré', hint: 'Teinte atelier', price: 120, swatch: '#c49aa0' },
  { id: 'nuit', label: 'Velours Bleu nuit', hint: 'Teinte atelier', price: 120, swatch: '#2c3a55' },
]

/** Teintes générées pour le velours (les ids absents = variantes du .glb). */
export const FABRIC_TINTS: Partial<Record<FabricId, TintSpec>> = {
  creme: { tint: '#e3d8c4', brightness: 1.5 },
  ardoise: { tint: '#5e6975', brightness: 1.45 },
  sauge: { tint: '#7f9077', brightness: 1.45 },
  rose: { tint: '#cda3a9', brightness: 1.45 },
  nuit: { tint: '#33425f', brightness: 1.4 },
}

export const WOODS: ChoiceOption<WoodId>[] = [
  { id: 'brown', label: 'Noyer huilé', hint: 'Veinage d\'origine', price: 0, swatch: '#5d4534' },
  { id: 'clair', label: 'Chêne clair', hint: 'Teinte atelier', price: 90, swatch: '#a8895e' },
  { id: 'fonce', label: 'Noyer fumé', hint: 'Teinte atelier', price: 110, swatch: '#3e2d22' },
  { id: 'black', label: 'Noir laqué', hint: 'Finition satinée', price: 120, swatch: '#1d1c1a' },
]

/** Teintes générées pour le bois. */
export const WOOD_TINTS: Partial<Record<WoodId, TintSpec>> = {
  clair: { tint: '#b08d5e', brightness: 1.35 },
  fonce: { tint: '#553e2e', brightness: 1.15 },
}

export const METALS: ChoiceOption<MetalId>[] = [
  { id: 'steel', label: 'Acier brossé', price: 0, swatch: '#8c8f94' },
  { id: 'black', label: 'Noir mat', price: 60, swatch: '#26262a' },
  { id: 'chrome', label: 'Chrome poli', price: 90, swatch: '#d8dadd' },
  { id: 'brass', label: 'Laiton', price: 140, swatch: '#c2913c' },
  { id: 'copper', label: 'Cuivre brossé', price: 140, swatch: '#b87349' },
]

export const ENVIRONMENTS: ChoiceOption<EnvironmentId>[] = [
  { id: 'galerie', label: 'Galerie', price: 0 },
  { id: 'loft', label: 'Loft', price: 0 },
  { id: 'nuit', label: 'Nuit', price: 0 },
]

export const PART_LABELS: Record<string, string> = {
  fabric: 'Revêtement',
  wood: 'Structure bois',
  metal: 'Piètement',
}
