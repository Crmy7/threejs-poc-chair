import * as THREE from 'three'
import { GLTFLoader, type GLTFParser } from 'three/addons/loaders/GLTFLoader.js'
import { FABRIC_TINTS, WOOD_TINTS } from '~/lib/catalog'
import type { FabricId, PartId, WoodId } from '~/types/configurator'

/**
 * CONCEPT THREE.JS №4 — Charger un vrai modèle 3D (glTF)
 * --------------------------------------------------------
 * glTF (.glb) est « le JPEG de la 3D » : le format standard pour
 * livrer des modèles sur le web. Il embarque géométries, textures
 * PBR, et ici l'extension KHR_materials_variants : les variantes
 * de matériaux (velours mangue / paon, noyer / noir) ont été
 * authorées par un designer directement dans le fichier.
 *
 * Les AUTRES teintes du catalogue sont générées au chargement :
 * on désature la texture d'origine (canvas 2D), puis chaque option
 * multiplie sa couleur dessus (`material.color`). Relief, plis,
 * occlusion et effet velours (`sheen`) sont conservés — c'est la
 * technique classique des configurateurs e-commerce.
 *
 * Modèle : « SheenChair » — Khronos glTF Sample Assets (© Shopify,
 * CC BY 4.0), un fauteuil photoréaliste avec velours `sheen`.
 */

export interface ChairProduct {
  group: THREE.Group
  /** Meshes par partie, pour le raycasting et le highlight. */
  meshesByPart: Record<PartId, THREE.Mesh[]>
  /** Tous les matériaux sélectionnables, par partie puis par id d'option. */
  variants: {
    fabric: Record<FabricId, THREE.Material>
    wood: Record<WoodId, THREE.Material>
    metal: THREE.MeshStandardMaterial
  }
  /** Réassigne proprement un matériau de variante sur une partie. */
  applyVariant: (part: 'fabric' | 'wood', material: THREE.Material) => void
}

/** Retrouve l'index d'un matériau du glTF par son nom d'auteur. */
function materialIndex(parser: GLTFParser, name: string): number {
  const index = (parser.json.materials as { name: string }[]).findIndex(m => m.name === name)
  if (index === -1) throw new Error(`Matériau introuvable dans le glb : ${name}`)
  return index
}

/**
 * Copie désaturée (et éclaircie) de la texture couleur d'origine.
 * On garde le clone Three.js (repeat/offset/colorSpace identiques) et on
 * remplace seulement ses pixels par la version « noir et blanc ».
 */
function desaturate(source: THREE.Texture, brightness = 1.4): THREE.Texture {
  const image = source.image as ImageBitmap | HTMLImageElement
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext('2d')!
  ctx.filter = `saturate(0) brightness(${brightness})`
  ctx.drawImage(image, 0, 0)

  const texture = source.clone()
  texture.source = new THREE.Source(canvas)
  texture.needsUpdate = true
  return texture
}

/** Variante teintée : texture grisée partagée + couleur multipliée. */
function tinted(
  base: THREE.MeshPhysicalMaterial,
  grayMap: THREE.Texture,
  hex: string,
): THREE.MeshPhysicalMaterial {
  const material = base.clone() // partage normalMap, aoMap, sheen…
  material.map = grayMap
  material.color.set(hex)
  if (material.sheen > 0) material.sheenColor.set(hex) // reflet velours assorti
  return material
}

export async function loadChair(): Promise<ChairProduct> {
  const gltf = await new GLTFLoader().loadAsync('/models/chair.glb')
  const parser = gltf.parser

  const meshesByPart: Record<PartId, THREE.Mesh[]> = {
    fabric: [],
    wood: [],
    metal: [],
  }

  // Le nom des meshes vient du fichier (SheenChair_fabric, _wood…)
  gltf.scene.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return
    obj.castShadow = true
    obj.receiveShadow = true
    const part = (['fabric', 'wood', 'metal'] as const).find(p =>
      obj.name.toLowerCase().includes(p),
    )
    if (part) {
      obj.userData.partId = part
      meshesByPart[part].push(obj)
    }
  })

  // Les variantes ne sont pas instanciées par défaut : on demande au
  // parser de construire chaque matériau référencé par son nom.
  const [mango, peacock, brown, black] = (await Promise.all([
    parser.getDependency('material', materialIndex(parser, 'fabric Mystere Mango Velvet')),
    parser.getDependency('material', materialIndex(parser, 'fabric Mystere Peacock Velvet')),
    parser.getDependency('material', materialIndex(parser, 'wood Brown')),
    parser.getDependency('material', materialIndex(parser, 'wood Black')),
  ])) as [
    THREE.MeshPhysicalMaterial,
    THREE.MeshPhysicalMaterial,
    THREE.MeshPhysicalMaterial,
    THREE.MeshPhysicalMaterial,
  ]

  // --- Teintes générées : une texture grisée par famille, partagée -----
  const fabricGray = desaturate(mango.map!, 1.45)
  const woodGray = desaturate(brown.map!, 1.3)

  const fabric: Record<string, THREE.Material> = { mango, peacock }
  for (const [id, spec] of Object.entries(FABRIC_TINTS)) {
    fabric[id] = tinted(
      mango,
      spec.brightness && spec.brightness !== 1.45 ? desaturate(mango.map!, spec.brightness) : fabricGray,
      spec.tint,
    )
  }

  const wood: Record<string, THREE.Material> = { brown, black }
  for (const [id, spec] of Object.entries(WOOD_TINTS)) {
    wood[id] = tinted(
      brown,
      spec.brightness && spec.brightness !== 1.3 ? desaturate(brown.map!, spec.brightness) : woodGray,
      spec.tint,
    )
  }

  const applyVariant = (part: 'fabric' | 'wood', material: THREE.Material) => {
    for (const mesh of meshesByPart[part]) {
      mesh.material = material
      // Laisse GLTFLoader finaliser le matériau selon les attributs
      // de la géométrie (UV2 pour l'occlusion, tangentes…)
      parser.assignFinalMaterial(mesh)
    }
  }

  return {
    group: gltf.scene,
    meshesByPart,
    variants: {
      fabric,
      wood,
      metal: meshesByPart.metal[0]!.material as THREE.MeshStandardMaterial,
    },
    applyVariant,
  }
}
