import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import type { EnvironmentId, FabricId, MetalId, PartId, WoodId } from '~/types/configurator'
import { loadChair, type ChairProduct } from './product'

/**
 * ConfiguratorEngine — tout le Three.js vit ici, isolé de Vue.
 *
 * C'est LE pattern à retenir pour intégrer Three.js dans un
 * framework : une classe impérative avec une petite API
 * (setFabric, setEnvironment, dispose…), et côté Vue de simples
 * `watch` qui appellent ces méthodes. Vue gère l'état, Three
 * gère les pixels — jamais l'inverse.
 *
 * Les commentaires « CONCEPT №x » balisent les briques
 * fondamentales de Three.js, dans l'ordre où on les explique.
 */

interface EnvironmentPreset {
  background: number
  exposure: number
  keyIntensity: number
  keyColor: number
}

const ENV_PRESETS: Record<EnvironmentId, EnvironmentPreset> = {
  galerie: { background: 0xefedea, exposure: 1.0, keyIntensity: 1.6, keyColor: 0xffffff },
  loft: { background: 0xe6d8c4, exposure: 1.12, keyIntensity: 1.4, keyColor: 0xffd9ae },
  nuit: { background: 0x17181b, exposure: 0.72, keyIntensity: 1.1, keyColor: 0xaebdff },
}

const METAL_FINISHES: Record<MetalId, { color: number, roughness: number, metalness: number }> = {
  steel: { color: 0x9a9da3, roughness: 0.42, metalness: 1 },
  black: { color: 0x222226, roughness: 0.6, metalness: 0.9 },
  chrome: { color: 0xf2f2f2, roughness: 0.1, metalness: 1 },
  brass: { color: 0xc99a45, roughness: 0.28, metalness: 1 },
  copper: { color: 0xb87349, roughness: 0.32, metalness: 1 },
}

export class ConfiguratorEngine {
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls
  private keyLight: THREE.DirectionalLight
  private product: ChairProduct | null = null

  private bgCurrent = new THREE.Color(ENV_PRESETS.galerie.background)
  private bgTarget = new THREE.Color(ENV_PRESETS.galerie.background)
  private exposureTarget = ENV_PRESETS.galerie.exposure

  // Raycasting (clic sur une partie du produit)
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private pointerDownAt = 0

  private highlighted: PartId | null = null
  private clock = new THREE.Clock()
  private frameId = 0
  private resizeObserver: ResizeObserver

  constructor(
    private canvas: HTMLCanvasElement,
    private onSelectPart: (part: PartId | null) => void,
  ) {
    const { clientWidth: w, clientHeight: h } = canvas.parentElement!

    // ------------------------------------------------------------------
    // CONCEPT №1 — LA SCÈNE : le « monde » qui contient tous les objets,
    // lumières et caméras, organisés en arbre (scene graph).
    // ------------------------------------------------------------------
    this.scene = new THREE.Scene()
    this.scene.background = this.bgCurrent

    // ------------------------------------------------------------------
    // CONCEPT №2 — LA CAMÉRA : le point de vue. PerspectiveCamera imite
    // l'œil humain (fov en degrés, ratio, plans near/far de clipping).
    // ------------------------------------------------------------------
    this.camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 50)
    this.camera.position.set(1.15, 0.72, 1.35)

    // ------------------------------------------------------------------
    // CONCEPT №3 — LE RENDERER : il dessine la scène vue par la caméra
    // dans un <canvas>, via WebGL. Tone mapping + couleurs sRGB pour un
    // rendu « photo » plutôt que brut.
    // ------------------------------------------------------------------
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setSize(w, h)
    // On borne le pixel ratio : sur écran Retina, x3 coûte très cher
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // Lumière directionnelle « key light » : la seule à projeter une ombre
    // (l'éclairage principal vient de la HDRI, chargée dans init()).
    this.keyLight = new THREE.DirectionalLight(0xffffff, 1.6)
    this.keyLight.position.set(1.8, 2.6, 1.4)
    this.keyLight.castShadow = true
    this.keyLight.shadow.mapSize.set(2048, 2048)
    this.keyLight.shadow.camera.near = 0.5
    this.keyLight.shadow.camera.far = 8
    this.keyLight.shadow.camera.left = -1.5
    this.keyLight.shadow.camera.right = 1.5
    this.keyLight.shadow.camera.top = 1.5
    this.keyLight.shadow.camera.bottom = -1.5
    this.keyLight.shadow.radius = 8
    this.keyLight.shadow.bias = -0.0003
    this.scene.add(this.keyLight)

    // Sol : un disque qui ne fait QUE recevoir l'ombre (ShadowMaterial)
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(4, 64),
      new THREE.ShadowMaterial({ opacity: 0.18 }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    this.scene.add(floor)

    // ------------------------------------------------------------------
    // CONCEPT №6 — LES CONTRÔLES : OrbitControls fait tourner la caméra
    // autour d'une cible (souris / tactile), avec inertie (damping).
    // ------------------------------------------------------------------
    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.target.set(0, 0.32, 0)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.06
    this.controls.minDistance = 0.8
    this.controls.maxDistance = 3.5
    this.controls.maxPolarAngle = Math.PI / 2 - 0.03 // jamais sous le sol
    this.controls.autoRotateSpeed = 1.0

    // ------------------------------------------------------------------
    // CONCEPT №8 — RAYCASTING : pour savoir ce que l'utilisateur a
    // cliqué, on lance un rayon depuis la caméra à travers le pixel
    // cliqué et on teste les intersections avec les meshes.
    // ------------------------------------------------------------------
    canvas.addEventListener('pointerdown', this.onPointerDown)
    canvas.addEventListener('pointerup', this.onPointerUp)

    // ------------------------------------------------------------------
    // CONCEPT №9 — RESPONSIVE & CYCLE DE VIE : adapter caméra + renderer
    // à la taille du conteneur, et tout libérer au démontage (dispose).
    // ------------------------------------------------------------------
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(canvas.parentElement!)

    // ------------------------------------------------------------------
    // CONCEPT №7 — LA BOUCLE D'ANIMATION : ~60 fois par seconde, on met
    // à jour (contrôles, interpolations) puis on rend une frame.
    // requestAnimationFrame se cale sur le rafraîchissement de l'écran.
    // ------------------------------------------------------------------
    this.tick()
  }

  /**
   * Chargement des assets réels, en parallèle :
   * - HDRI (image d'environnement haute dynamique) → éclairage IBL
   * - modèle glTF du fauteuil
   */
  async init(): Promise<void> {
    const [envTexture, product] = await Promise.all([
      new RGBELoader().loadAsync('/hdri/studio.hdr'),
      loadChair(),
    ])

    // ------------------------------------------------------------------
    // CONCEPT №5 — LUMIÈRES & ENVIRONNEMENT : les matériaux PBR tirent
    // l'essentiel de leur éclairage d'une image d'environnement (IBL).
    // Une vraie HDRI de studio photo = reflets et velours crédibles.
    // ------------------------------------------------------------------
    const pmrem = new THREE.PMREMGenerator(this.renderer)
    this.scene.environment = pmrem.fromEquirectangular(envTexture).texture
    envTexture.dispose()
    pmrem.dispose()

    this.product = product
    this.scene.add(product.group)
  }

  // ===================== API publique (appelée par Vue) ==============

  setFabric(fabric: FabricId) {
    if (!this.product) return
    this.clearEmissive('fabric') // pas de pulse résiduel sur l'ancienne variante
    this.product.applyVariant('fabric', this.product.variants.fabric[fabric])
  }

  setWood(wood: WoodId) {
    if (!this.product) return
    this.clearEmissive('wood')
    this.product.applyVariant('wood', this.product.variants.wood[wood])
  }

  setMetal(finish: MetalId) {
    if (!this.product) return
    const preset = METAL_FINISHES[finish]
    const m = this.product.variants.metal
    m.color.set(preset.color)
    m.roughness = preset.roughness
    m.metalness = preset.metalness
  }

  setEnvironment(env: EnvironmentId) {
    const p = ENV_PRESETS[env]
    this.bgTarget.set(p.background)
    this.exposureTarget = p.exposure
    this.keyLight.intensity = p.keyIntensity
    this.keyLight.color.set(p.keyColor)
  }

  setAutoRotate(on: boolean) {
    this.controls.autoRotate = on
  }

  /** Pulse d'emissive discret sur la partie sélectionnée (géré dans tick). */
  setHighlight(part: PartId | null) {
    if (this.highlighted && this.highlighted !== part) {
      this.clearEmissive(this.highlighted)
    }
    this.highlighted = part
    if (!part) return
  }

  /** Rend une frame puis capture le canvas en PNG. */
  screenshot(): string {
    this.renderer.render(this.scene, this.camera)
    return this.canvas.toDataURL('image/png')
  }

  dispose() {
    cancelAnimationFrame(this.frameId)
    this.resizeObserver.disconnect()
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
    this.canvas.removeEventListener('pointerup', this.onPointerUp)
    this.controls.dispose()
    // Libère la mémoire GPU : géométries, matériaux, textures, contexte
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        for (const m of mats) {
          for (const value of Object.values(m)) {
            if (value instanceof THREE.Texture) value.dispose()
          }
          m.dispose()
        }
      }
    })
    // Les variantes non montées dans la scène doivent aussi être libérées
    if (this.product) {
      for (const m of Object.values(this.product.variants.fabric)) m.dispose()
      for (const m of Object.values(this.product.variants.wood)) m.dispose()
    }
    this.scene.environment?.dispose()
    this.renderer.dispose()
  }

  // ===================== Interne =====================================

  private emissiveMaterialsOf(part: PartId): THREE.MeshStandardMaterial[] {
    if (!this.product) return []
    return this.product.meshesByPart[part]
      .map(mesh => mesh.material)
      .filter((m): m is THREE.MeshStandardMaterial => m instanceof THREE.MeshStandardMaterial)
  }

  private clearEmissive(part: PartId) {
    for (const m of this.emissiveMaterialsOf(part)) {
      m.emissive.set(0x000000)
      m.emissiveIntensity = 0
    }
  }

  private onPointerDown = () => {
    this.pointerDownAt = performance.now()
  }

  /**
   * Au relâchement : si ce n'était pas un drag (rotation caméra),
   * on raycast pour trouver la partie cliquée.
   */
  private onPointerUp = (e: PointerEvent) => {
    if (!this.product) return
    if (performance.now() - this.pointerDownAt > 250) return // c'était un drag

    // Coordonnées du clic normalisées en [-1, 1] (repère NDC)
    const rect = this.canvas.getBoundingClientRect()
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.pointer, this.camera)
    const hits = this.raycaster.intersectObjects(this.product.group.children, true)

    const part = (hits[0]?.object.userData.partId as PartId | undefined) ?? null
    this.onSelectPart(part)
  }

  private resize() {
    const parent = this.canvas.parentElement!
    const { clientWidth: w, clientHeight: h } = parent
    this.camera.aspect = w / h
    // Après tout changement de paramètre caméra, recalculer la projection
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  private tick = () => {
    this.frameId = requestAnimationFrame(this.tick)
    const t = this.clock.getElapsedTime()

    // Transitions douces : fond et exposition interpolés à chaque frame
    this.bgCurrent.lerp(this.bgTarget, 0.06)
    this.renderer.toneMappingExposure = THREE.MathUtils.lerp(
      this.renderer.toneMappingExposure,
      this.exposureTarget,
      0.06,
    )

    // Pulse lumineux discret sur la partie sélectionnée
    if (this.highlighted) {
      for (const m of this.emissiveMaterialsOf(this.highlighted)) {
        m.emissive.set(0xffffff)
        m.emissiveIntensity = 0.05 + Math.sin(t * 4) * 0.035
      }
    }

    this.controls.update() // requis pour damping + autoRotate
    this.renderer.render(this.scene, this.camera)
  }
}
