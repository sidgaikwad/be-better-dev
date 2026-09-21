"use client"

import { site } from "@packages/config/site"
import * as React from "react"
import * as THREE from "three"

// The hero book, rendered for real: extruded covers with bevelled edges, a block
// of paper between them, a key light from the upper left and a brand rim from
// the right, all turning slowly under the pointer.
//
// Imperative three rather than react-three-fiber. r3f would be the obvious
// choice for a scene graph that changes, and this one does not: it is built
// once per theme and then only animated. It also augments React's global
// JSX.IntrinsicElements with an entry per three export, including the numeric
// constants, whose props type is `never`; that collides with the index signature
// on mdx/types' MDXComponents and breaks the docs types across the whole app.
// Not worth a cast in unrelated code for a scene this static.
//
// Loaded only in the browser and only once a WebGL2 context is known to exist
// (see book.tsx). The CSS book underneath is what a reader sees until this is
// ready, and what they keep if it never is.

// Metres, and the only place any of them are written down. The proportions are a
// trade paperback: a little taller than 4:3, a spine you can read.
const WIDTH = 2
const HEIGHT = 2.8
const DEPTH = 0.44
const COVER = 0.036
const PAGES = DEPTH - COVER * 2

// Where the book rests, matching the pose of the CSS book underneath so the
// cross-fade between them is invisible.
const REST_X = 0.16
const REST_Y = -0.54
const REST_Z = -0.03

// A renderer needs a concrete colour: WebGL has no cascade to resolve
// var(--brand) through, and three's Color cannot parse oklch. These mirror the
// tokens in globals.css by hand and have to move with them, which is the same
// bargain the OG images make. Two sets, because the scene is lit differently in
// each theme: the dark one leans on the rim light, the light one on the key.
const PALETTE = {
  dark: {
    ambient: 0.4,
    cover: "#5b4ae8",
    glow: "#8f6bff",
    key: 2.1,
    pages: "#e9e7e0",
    rim: "#3fc8d8",
    spine: "#6d5ef5",
  },
  light: {
    ambient: 0.75,
    cover: "#4b32d6",
    glow: "#7a5cf0",
    key: 2.4,
    pages: "#fbfaf6",
    rim: "#2ea8bb",
    spine: "#5a3fe0",
  },
} as const

type Theme = keyof typeof PALETTE

// A rounded rectangle centred on the origin, which ExtrudeGeometry turns into a
// cover with a bevelled edge. Drawn by hand rather than pulled from three's
// addons so this depends on nothing outside the core package.
function coverShape(width: number, height: number, radius: number) {
  const shape = new THREE.Shape()
  const x = width / 2
  const y = height / 2
  shape.moveTo(-x + radius, -y)
  shape.lineTo(x - radius, -y)
  shape.quadraticCurveTo(x, -y, x, -y + radius)
  shape.lineTo(x, y - radius)
  shape.quadraticCurveTo(x, y, x - radius, y)
  shape.lineTo(-x + radius, y)
  shape.quadraticCurveTo(-x, y, -x, y - radius)
  shape.lineTo(-x, -y + radius)
  shape.quadraticCurveTo(-x, -y, -x + radius, -y)
  return shape
}

// The cut edges of the paper. A flat cream fill reads as a solid block at any
// distance, so the pages get a fine striation drawn once into a canvas and
// repeated along the block.
function paperTexture(colour: string) {
  const canvas = document.createElement("canvas")
  canvas.width = 64
  canvas.height = 4
  const context = canvas.getContext("2d")
  if (!context) return null
  context.fillStyle = colour
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = "rgba(0, 0, 0, 0.18)"
  for (let x = 0; x < canvas.width; x += 3) context.fillRect(x, 0, 1, canvas.height)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(8, 1)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

// The cover art, drawn into a canvas and hung on the front board as its own
// plane. Type is the one thing geometry cannot do, and a texture keeps it crisp
// at any angle. It reads the page's own font variables, so the cover is set in
// the same faces as everything around it.
function coverArtTexture() {
  const canvas = document.createElement("canvas")
  canvas.width = 512
  canvas.height = 716
  const context = canvas.getContext("2d")
  if (!context) return null

  const style = getComputedStyle(document.documentElement)
  const sans = `${style.getPropertyValue("--font-dm-sans").trim()}, system-ui, sans-serif`
  const mono = `${style.getPropertyValue("--font-jetbrains-mono").trim()}, ui-monospace, monospace`

  context.fillStyle = "rgba(255, 255, 255, 0.72)"
  context.font = `600 20px ${sans}`
  context.letterSpacing = "4px"
  context.fillText(site.name.toUpperCase(), 48, 80)

  context.letterSpacing = "0px"
  context.fillStyle = "rgba(255, 255, 255, 0.96)"
  context.font = `700 60px ${sans}`
  context.fillText("Rust:", 48, 486)
  context.fillText("Zero to", 48, 552)
  context.fillText("Production", 48, 618)

  context.fillStyle = "rgba(255, 255, 255, 0.45)"
  context.fillRect(48, 650, 64, 2)

  context.fillStyle = "rgba(255, 255, 255, 0.72)"
  context.font = `400 19px ${mono}`
  context.fillText("256 lessons, read aloud", 48, 688)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

// The floor the book sits on. A shadow map at this size is all noise and
// tuning, so the contact shadow is a radial gradient on a plane: cheap,
// deterministic, and the same shape the CSS book casts.
function shadowTexture() {
  const canvas = document.createElement("canvas")
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext("2d")
  if (!context) return null
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, "rgba(0, 0, 0, 0.5)")
  gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.2)")
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)")
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(canvas)
}

type Scene = {
  book: THREE.Group
  camera: THREE.PerspectiveCamera
  dispose: () => void
  render: () => void
  resize: (width: number, height: number) => void
}

function buildScene(host: HTMLElement, theme: Theme): Scene | null {
  const palette = PALETTE[theme]

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.domElement.style.width = "100%"
  renderer.domElement.style.height = "100%"
  renderer.domElement.style.display = "block"
  host.append(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
  camera.position.set(0, 0, 7.8)

  scene.add(new THREE.AmbientLight(0xffffff, palette.ambient))

  const key = new THREE.DirectionalLight(0xffffff, palette.key)
  key.position.set(-5, 6, 6)
  scene.add(key)

  const glow = new THREE.PointLight(palette.glow, 26, 16)
  glow.position.set(3.4, -0.6, 3)
  scene.add(glow)

  const rim = new THREE.DirectionalLight(palette.rim, 0.9)
  rim.position.set(4, 2.5, -5)
  scene.add(rim)

  const shape = coverShape(WIDTH, HEIGHT, 0.06)
  const coverGeometry = new THREE.ExtrudeGeometry(shape, {
    bevelSegments: 2,
    bevelSize: 0.012,
    bevelThickness: 0.012,
    curveSegments: 12,
    depth: COVER,
  })
  const coverMaterial = new THREE.MeshStandardMaterial({
    color: palette.cover,
    metalness: 0.08,
    roughness: 0.44,
  })

  const book = new THREE.Group()
  book.rotation.set(REST_X, REST_Y, REST_Z)

  const front = new THREE.Mesh(coverGeometry, coverMaterial)
  front.position.z = PAGES / 2
  book.add(front)

  const back = new THREE.Mesh(coverGeometry, coverMaterial)
  back.position.z = -(PAGES / 2 + COVER)
  book.add(back)

  const paper = paperTexture(palette.pages)
  const pages = new THREE.Mesh(
    new THREE.BoxGeometry(WIDTH - 0.05, HEIGHT - 0.05, PAGES),
    new THREE.MeshStandardMaterial({
      color: palette.pages,
      map: paper ?? undefined,
      roughness: 0.94,
    }),
  )
  book.add(pages)

  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(0.075, HEIGHT, DEPTH),
    new THREE.MeshStandardMaterial({ color: palette.spine, metalness: 0.12, roughness: 0.38 }),
  )
  spine.position.x = -(WIDTH / 2) + 0.03
  book.add(spine)

  const art = coverArtTexture()
  if (art) {
    const artMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(WIDTH, HEIGHT),
      new THREE.MeshBasicMaterial({ map: art, toneMapped: false, transparent: true }),
    )
    artMesh.position.z = PAGES / 2 + COVER + 0.016
    book.add(artMesh)
  }

  scene.add(book)

  const shadowMap = shadowTexture()
  if (shadowMap) {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 2),
      new THREE.MeshBasicMaterial({
        depthWrite: false,
        map: shadowMap,
        opacity: 0.8,
        transparent: true,
      }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.set(0.12, -HEIGHT / 2 - 0.32, 0)
    scene.add(floor)
  }

  return {
    book,
    camera,
    dispose() {
      art?.dispose()
      paper?.dispose()
      shadowMap?.dispose()
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return
        object.geometry.dispose()
        const material = object.material
        if (Array.isArray(material)) material.forEach((entry) => entry.dispose())
        else material.dispose()
      })
      renderer.dispose()
      renderer.domElement.remove()
    },
    render() {
      renderer.render(scene, camera)
    },
    resize(width, height) {
      if (width === 0 || height === 0) return
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    },
  }
}

export function BookWebgl({
  onLost,
  onReady,
  still = false,
  theme,
}: {
  /** The context went away (a tab switch on a laptop GPU, a driver reset). */
  onLost: () => void
  onReady: () => void
  /** Hold the rest pose: the reader paused the page, or this is off screen. */
  still?: boolean
  theme: Theme
}) {
  const host = React.useRef<HTMLDivElement>(null)
  const sceneRef = React.useRef<Scene | null>(null)
  // Read inside the frame loop, which is built once and must not be torn down
  // and rebuilt every time the reader hits pause or scrolls past.
  const stillRef = React.useRef(still)
  const pointer = React.useRef({ x: 0, y: 0 })

  React.useEffect(() => {
    const element = host.current
    if (!element) return

    const scene = buildScene(element, theme)
    if (!scene) return
    sceneRef.current = scene

    scene.resize(element.clientWidth, element.clientHeight)
    scene.render()

    const observer = new ResizeObserver(() => {
      scene.resize(element.clientWidth, element.clientHeight)
      scene.render()
    })
    observer.observe(element)

    const onPointerMove = (event: PointerEvent) => {
      pointer.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: (event.clientY / window.innerHeight) * 2 - 1,
      }
    }
    window.addEventListener("pointermove", onPointerMove, { passive: true })

    const onContextLost = (event: Event) => {
      event.preventDefault()
      onLost()
    }
    const canvas = element.querySelector("canvas")
    canvas?.addEventListener("webglcontextlost", onContextLost)

    const start = performance.now()
    let frame = requestAnimationFrame(function tick() {
      frame = requestAnimationFrame(tick)
      if (stillRef.current) return
      const t = (performance.now() - start) / 1000
      const book = scene.book
      // Damped towards the target rather than set to it, so the book settles
      // when the pointer stops instead of snapping to wherever it last was.
      const targetY = REST_Y + Math.sin(t * 0.24) * 0.13 + pointer.current.x * 0.18
      const targetX = REST_X + Math.sin(t * 0.31) * 0.05 - pointer.current.y * 0.1
      book.rotation.y += (targetY - book.rotation.y) * 0.045
      book.rotation.x += (targetX - book.rotation.x) * 0.045
      book.position.y = Math.sin(t * 0.42) * 0.07
      scene.render()
    })

    const ready = requestAnimationFrame(() => onReady())

    return () => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(ready)
      observer.disconnect()
      window.removeEventListener("pointermove", onPointerMove)
      canvas?.removeEventListener("webglcontextlost", onContextLost)
      scene.dispose()
      sceneRef.current = null
    }
  }, [onLost, onReady, theme])

  // Going still snaps to the rest pose and draws it once; the loop then idles
  // without touching the GPU until it is let go again.
  React.useEffect(() => {
    stillRef.current = still
    const scene = sceneRef.current
    if (!scene || !still) return
    scene.book.rotation.set(REST_X, REST_Y, REST_Z)
    scene.book.position.y = 0
    scene.render()
  }, [still])

  return <div className="size-full" ref={host} />
}
