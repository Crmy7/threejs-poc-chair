# Fauteuil Mystère — Configurateur 3D (POC Three.js + Nuxt)

POC d'un configurateur produit 3D temps réel autour d'un **vrai modèle 3D
photoréaliste** : un fauteuil en velours dont on configure le revêtement,
la structure bois et le piètement métal, avec prix dynamique, partage par
URL et export PNG.

```bash
npm install
npm run dev   # → http://localhost:3000
```

Assets réels inclus dans `public/` :

- `models/chair.glb` — « SheenChair », Khronos glTF Sample Assets
  (© Shopify, licence CC BY 4.0) : fauteuil photoréaliste avec velours
  `sheen` et **variantes de matériaux authorées dans le fichier**
  (KHR_materials_variants)
- `hdri/studio.hdr` — HDRI de studio (Poly Haven, CC0) pour l'éclairage
  par image (IBL)

---

## Three.js, c'est quoi ?

Three.js est une bibliothèque JavaScript qui rend la 3D accessible dans le
navigateur. Elle s'appuie sur **WebGL** (l'API bas niveau qui parle au GPU),
mais l'abstrait derrière des notions intuitives : une *scène*, une *caméra*,
des *objets*, des *lumières*. Sans Three.js, afficher un simple cube en WebGL
demande ~200 lignes de shaders et de gestion de buffers ; avec, 10 lignes.

### Les 9 concepts clés (balisés `CONCEPT №x` dans le code)

| № | Concept | En une phrase | Fichier |
|---|---------|---------------|---------|
| 1 | **Scene** | Le « monde » : un arbre qui contient objets, lumières, caméras | `app/lib/three/engine.ts` |
| 2 | **Camera** | Le point de vue — `PerspectiveCamera` imite l'œil humain | `app/lib/three/engine.ts` |
| 3 | **Renderer** | Le peintre : dessine scène + caméra dans un `<canvas>` via WebGL | `app/lib/three/engine.ts` |
| 4 | **Assets glTF** | « Le JPEG de la 3D » : géométries, textures PBR, variantes de matériaux | `app/lib/three/product.ts` |
| 5 | **Lights & IBL** | Une vraie HDRI éclaire le modèle par image + une key light pour l'ombre | `app/lib/three/engine.ts` |
| 6 | **Controls** | `OrbitControls` : orbiter/zoomer autour du produit, avec inertie | `app/lib/three/engine.ts` |
| 7 | **Animation loop** | `requestAnimationFrame` : update + render ~60×/s | `app/lib/three/engine.ts` |
| 8 | **Raycasting** | Un rayon caméra → pixel cliqué pour détecter l'objet touché | `app/lib/three/engine.ts` |
| 9 | **Cycle de vie & perfs** | `dispose()`, `ResizeObserver`, pixel ratio borné | `app/lib/three/engine.ts` |

Le triangle minimal de toute app Three.js :

```js
const scene = new THREE.Scene()                            // 1. le monde
const camera = new THREE.PerspectiveCamera(35, w / h)      // 2. l'œil
const renderer = new THREE.WebGLRenderer({ canvas })       // 3. le peintre

function tick() {
  requestAnimationFrame(tick)
  renderer.render(scene, camera)                           // une frame
}
tick()
```

Tout le reste (modèles, lumières, contrôles, raycasting) vient se brancher
sur ce triangle.

## Le point clé « réalisme » : assets réels, pas de 3D codée à la main

Ce POC reflète le **workflow de production réel** d'un configurateur :

1. Le designer 3D livre un `.glb` avec les **variantes de matériaux
   authorées** (ici : velours Mangue/Paon, noyer/noir — extension
   `KHR_materials_variants`). Le code ne crée aucun matériau de tissu ou
   de bois : il ne fait qu'**activer** les variantes du fichier
   (`parser.getDependency('material', …)` dans `product.ts`).
2. L'éclairage vient d'une **HDRI** (image haute dynamique d'un vrai
   studio photo) convertie en environment map : c'est elle qui rend le
   velours et les métaux crédibles — pas des lampes placées à la main.
3. Les **teintes « atelier »** supplémentaires (velours crème, sauge,
   bleu nuit… / chêne clair, noyer fumé) sont générées au chargement :
   la texture d'origine est désaturée une fois (canvas 2D), puis chaque
   option multiplie sa couleur dessus (`material.color`). Relief,
   capitonnage, occlusion et effet velours (`sheen`) sont conservés —
   la technique classique des configurateurs e-commerce.
4. Les finitions *métal* sont des réglages PBR programmatiques
   (couleur/rugosité), fiables pour un métal.

## Architecture : intégrer Three.js dans Nuxt

Le pattern central — **Vue gère l'état, Three gère les pixels** :

```
app/
├── lib/three/
│   ├── engine.ts        ← ConfiguratorEngine : TOUT le Three.js, isolé de Vue
│   └── product.ts       ← Chargement du .glb + extraction des variantes
├── lib/catalog.ts       ← Options, prix (viendrait d'une API en prod)
├── composables/
│   └── useConfigurator.ts  ← État réactif partagé + prix + sync URL
├── components/
│   ├── SceneViewport.vue   ← LE pont Vue ⇄ Three (onMounted / watch / dispose)
│   ├── ConfiguratorPanel.vue
│   ├── OptionList.vue
│   └── ConceptsModal.vue   ← Support de présentation intégré
└── app.vue
```

Pourquoi cette séparation ?

1. **Le canvas n'est pas réactif.** Three.js redessine 60×/s dans sa propre
   boucle ; le faire piloter par la réactivité de Vue serait contre-productif
   (et lent). Le moteur expose une petite API impérative
   (`setFabric`, `setEnvironment`…) et des `watch` Vue l'appellent.
2. **Client-only.** WebGL n'existe pas côté serveur → `ssr: false` +
   `<ClientOnly>` + instanciation dans `onMounted`.
3. **Cleanup obligatoire.** Géométries, matériaux et textures vivent en
   mémoire GPU : `onUnmounted → engine.dispose()`, sinon fuite mémoire à
   chaque navigation.
4. **Communication bidirectionnelle.** Panneau → 3D via `watch`, mais aussi
   3D → panneau : un clic sur une partie du fauteuil (raycasting) sélectionne
   la section correspondante dans l'UI.

## Fonctionnalités à montrer en démo

- **Rendu photoréaliste** : modèle glTF pro, velours `sheen`, HDRI/IBL,
  tone mapping ACES, ombres douces (`PCFSoftShadowMap`)
- **Variantes de matériaux** activées depuis le fichier (workflow designer)
- **Sélection 3D** : cliquer le velours / le bois / le métal ouvre la
  bonne section du panneau (raycasting + `userData`)
- **Transitions douces** : fond et exposition interpolés dans la boucle
- **Partage par URL** : config sérialisée en base64 dans le hash
- **Export PNG** : capture du canvas (`toDataURL`)
- **Perfs** : pixel ratio borné à 2, une seule lumière à ombre, `dispose()`

## Aller plus loin

- Compression du modèle (Draco / Meshopt via `gltf-transform`)
- Post-processing (`EffectComposer` : bloom, SSAO)
- Variante déclarative : [TresJS](https://tresjs.org/) (l'équivalent Vue de
  react-three-fiber) — pertinent quand la scène devient très dynamique
- AR : export `USDZ`/`model-viewer` pour voir le fauteuil chez soi
