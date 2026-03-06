import { AudioData, TemplateId } from './types'

interface Particle {
  x: number
  y: number
  size: number
  opacity: number
  speed: number
}

interface DrawState {
  particles: Particle[]
  smoothedBars: number[]
  rotation: number
  pulseScale: number
  initialized: boolean
}

export function createDrawState(): DrawState {
  return {
    particles: [],
    smoothedBars: new Array(128).fill(0),
    rotation: 0,
    pulseScale: 1,
    initialized: false,
  }
}

function initParticles(w: number, h: number, count = 90): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    size: 1 + Math.random() * 1.8,
    opacity: 0.12 + Math.random() * 0.42,
    speed: 0.1 + Math.random() * 0.32,
  }))
}

function getFreqValue(freq: Uint8Array | undefined, i: number, n: number) {
  if (!freq || freq.length === 0) return 0
  const idx = Math.floor(Math.pow(i / n, 1.22) * freq.length)
  return (freq[Math.min(idx, freq.length - 1)] || 0) / 255
}

function smoothBars(state: DrawState, audioData: AudioData | null, n: number, attack = 0.58, release = 0.1) {
  for (let i = 0; i < n; i++) {
    const val = getFreqValue(audioData?.frequencyData, i, n)
    const cur = state.smoothedBars[i]
    state.smoothedBars[i] = val > cur ? cur * (1 - attack) + val * attack : cur * (1 - release) + val * release
  }
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  state: DrawState,
  options?: {
    boost?: number
    color?: [number, number, number]
    sizeScale?: number
    twinkle?: number
  },
) {
  const boost = options?.boost ?? 1
  const [cr, cg, cb] = options?.color ?? [255, 255, 255]
  const sizeScale = options?.sizeScale ?? 1
  const twinkle = options?.twinkle ?? 0.25

  for (const p of state.particles) {
    p.y -= p.speed * boost
    p.x += Math.sin(time * 0.5 + p.y * 0.013) * 0.12
    if (p.y < -8) {
      p.y = h + 8
      p.x = Math.random() * w
    }

    const t = 0.7 + Math.sin(time * 2.2 + p.x * 0.03 + p.y * 0.02) * twinkle
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * sizeScale, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${Math.max(0.03, p.opacity * t)})`
    ctx.fill()
  }
}

function drawCenterDisc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  options?: {
    fill?: string
    stroke?: string
    glow?: string
    glowBlur?: number
    lineWidth?: number
  },
) {
  const fill = options?.fill ?? 'rgba(12, 10, 18, 0.86)'
  const stroke = options?.stroke ?? 'rgba(255,255,255,0.45)'
  const glow = options?.glow ?? 'rgba(255,255,255,0.4)'
  const glowBlur = options?.glowBlur ?? 16
  const lineWidth = options?.lineWidth ?? 2.4

  ctx.shadowColor = glow
  ctx.shadowBlur = glowBlur
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()

  ctx.shadowColor = glow
  ctx.shadowBlur = glowBlur * 0.75
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.strokeStyle = stroke
  ctx.lineWidth = lineWidth
  ctx.stroke()
  ctx.shadowBlur = 0
}

/* ─── Helper: Draw tree silhouettes ─── */
function drawTreeSilhouettes(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = 'rgba(8,12,10,0.95)'
  const treeBase = h * 0.82
  // Draw ~20 trees of varying heights
  for (let i = 0; i < 22; i++) {
    const tx = (i / 21) * w * 1.1 - w * 0.05
    const th = 30 + Math.random() * 80 + Math.sin(i * 1.7) * 30
    const tw = 8 + Math.random() * 12
    ctx.beginPath()
    ctx.moveTo(tx - tw, treeBase)
    ctx.lineTo(tx, treeBase - th)
    ctx.lineTo(tx + tw, treeBase)
    ctx.closePath()
    ctx.fill()
  }
  // Ground bar
  ctx.fillRect(0, treeBase, w, h - treeBase)
}

/* ─── Helper: Draw cliff with figures ─── */
function drawCliffWithFigures(ctx: CanvasRenderingContext2D, w: number, h: number, xFrac: number, yFrac: number) {
  const cx = w * xFrac
  const cy = h * yFrac
  ctx.fillStyle = 'rgba(15,10,20,0.92)'
  ctx.beginPath()
  ctx.moveTo(cx - 80, cy + 40)
  ctx.bezierCurveTo(cx - 70, cy - 10, cx - 30, cy - 30, cx, cy - 35)
  ctx.bezierCurveTo(cx + 25, cy - 32, cx + 50, cy - 15, cx + 60, cy + 20)
  ctx.lineTo(cx + 70, cy + 60)
  ctx.lineTo(cx - 90, cy + 60)
  ctx.closePath()
  ctx.fill()
  // Two tiny figures on top
  const fy = cy - 38
  for (const fx of [cx - 8, cx + 8]) {
    ctx.fillStyle = 'rgba(10,5,15,0.9)'
    ctx.beginPath()
    ctx.arc(fx, fy - 6, 2.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(fx - 1.5, fy - 4, 3, 8)
  }
}

/* ─── Helper: Draw cyberpunk buildings ─── */
function drawCyberpunkCity(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  // Dark buildings
  const buildingData = [
    { x: 0, bw: w * 0.12, bh: h * 0.7 },
    { x: w * 0.1, bw: w * 0.08, bh: h * 0.55 },
    { x: w * 0.17, bw: w * 0.1, bh: h * 0.8 },
    { x: w * 0.26, bw: w * 0.07, bh: h * 0.5 },
    { x: w * 0.6, bw: w * 0.08, bh: h * 0.55 },
    { x: w * 0.68, bw: w * 0.11, bh: h * 0.75 },
    { x: w * 0.78, bw: w * 0.09, bh: h * 0.6 },
    { x: w * 0.86, bw: w * 0.14, bh: h * 0.85 },
  ]

  for (const b of buildingData) {
    const by = h - b.bh
    // Building body
    ctx.fillStyle = 'rgba(8,12,22,0.9)'
    ctx.fillRect(b.x, by, b.bw, b.bh)
    // Neon edge lines
    ctx.strokeStyle = `rgba(0,200,255,${0.15 + Math.sin(time + b.x) * 0.05})`
    ctx.lineWidth = 1
    ctx.strokeRect(b.x + 2, by + 2, b.bw - 4, b.bh - 4)
    // Window lights
    for (let wy = by + 10; wy < h - 10; wy += 12) {
      for (let wx = b.x + 4; wx < b.x + b.bw - 4; wx += 8) {
        if (Math.random() > 0.4) {
          ctx.fillStyle = `rgba(0,180,255,${0.1 + Math.random() * 0.15})`
          ctx.fillRect(wx, wy, 4, 3)
        }
      }
    }
  }

  // Pink neon beam on left
  const beamGrad = ctx.createLinearGradient(w * 0.15, 0, w * 0.15, h)
  beamGrad.addColorStop(0, 'rgba(255,0,120,0)')
  beamGrad.addColorStop(0.2, 'rgba(255,0,120,0.3)')
  beamGrad.addColorStop(0.5, 'rgba(255,0,120,0.5)')
  beamGrad.addColorStop(0.8, 'rgba(255,0,120,0.3)')
  beamGrad.addColorStop(1, 'rgba(255,0,120,0)')
  ctx.fillStyle = beamGrad
  ctx.fillRect(w * 0.14, 0, w * 0.03, h)
}

/* ═══════════════════════════════════════════════════════════════
   TEMPLATE 1: COUNTING STARS
   Pink gradient sky, 76 point dots, 4-way reflection, 7 layers
   ═══════════════════════════════════════════════════════════════ */
function drawCountingStars(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  audioData: AudioData | null,
  state: DrawState,
  time: number,
) {
  // Pink sunset cloud background
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#f8cbc8')
  bg.addColorStop(0.3, '#e8a6b4')
  bg.addColorStop(0.62, '#c889ae')
  bg.addColorStop(1, '#725b81')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  // Cloud layers
  const clouds = [
    { x: 0.5, y: 0.2, r: 0.5, c: 'rgba(255,230,214,0.46)' },
    { x: 0.18, y: 0.36, r: 0.35, c: 'rgba(255,211,191,0.3)' },
    { x: 0.78, y: 0.26, r: 0.32, c: 'rgba(255,194,217,0.3)' },
  ]
  for (const cl of clouds) {
    const g = ctx.createRadialGradient(w * cl.x, h * cl.y, 0, w * cl.x, h * cl.y, w * cl.r)
    g.addColorStop(0, cl.c)
    g.addColorStop(1, cl.c.replace(/[\d.]+\)$/, '0)'))
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }

  drawParticles(ctx, w, h, time, state, { boost: 1, color: [255, 244, 246], twinkle: 0.33 })

  const cx = w / 2
  const cy = h * 0.42
  const minDim = Math.min(w, h)
  const discR = minDim * 0.12
  const ringR = discR + minDim * 0.035
  const waveH = minDim * 0.122
  const pointR = minDim * 0.0072

  const pointCount = 76
  const quarter = pointCount / 4
  const layerCount = 7
  const separation = minDim * 0.0095

  const layerColors = [
    'rgba(255,248,250,0.95)',
    'rgba(255,229,235,0.9)',
    'rgba(255,205,216,0.84)',
    'rgba(255,177,193,0.8)',
    'rgba(255,154,169,0.76)',
    'rgba(255,127,134,0.72)',
    'rgba(228,86,137,0.64)',
  ]

  if (audioData?.beat) state.pulseScale = 1.04
  state.pulseScale += (1 - state.pulseScale) * 0.09
  state.rotation += 0.0016

  smoothBars(state, audioData, quarter, 0.62, 0.08)

  const values: number[] = []
  for (let q = 0; q < 4; q++) {
    for (let i = 0; i < quarter; i++) {
      const idx = q % 2 === 0 ? i : quarter - 1 - i
      values.push(state.smoothedBars[idx])
    }
  }

  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(state.pulseScale, state.pulseScale)
  ctx.rotate(state.rotation)

  for (let layer = layerCount - 1; layer >= 0; layer--) {
    const layerScale = 1 + layer * (separation / ringR)
    const layerColor = layerColors[layer]

    ctx.save()
    ctx.scale(layerScale, layerScale)
    ctx.globalCompositeOperation = layer > 2 ? 'lighter' : 'source-over'
    ctx.shadowColor = layerColor
    ctx.shadowBlur = 8 + layer * 3

    for (let i = 0; i < pointCount; i++) {
      const a = (i / pointCount) * Math.PI * 2
      const v = values[i]
      const flare = Math.pow(v, 1.22)
      const dist = ringR + v * waveH
      const x = Math.cos(a) * dist
      const y = Math.sin(a) * dist
      const r = pointR * (0.66 + flare * 0.86)

      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = layerColor
      ctx.fill()
    }

    ctx.restore()
  }
  ctx.globalCompositeOperation = 'source-over'
  ctx.restore()

  drawCenterDisc(ctx, cx, cy, discR, {
    fill: 'rgba(10,5,12,0.9)',
    stroke: 'rgba(255,255,255,0.46)',
    glow: 'rgba(255,214,226,0.62)',
    glowBlur: 20,
    lineWidth: 2.5,
  })
}

/* ═══════════════════════════════════════════════════════════════
   TEMPLATE 2: PINKY POP
   火焰日冕 + 雾森林
   ═══════════════════════════════════════════════════════════════ */
function drawPinkyPop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  audioData: AudioData | null,
  state: DrawState,
  time: number,
) {
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#31424c')
  bg.addColorStop(0.42, '#5f747f')
  bg.addColorStop(1, '#1f2a30')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  const skyFog = ctx.createRadialGradient(w * 0.5, h * 0.38, 0, w * 0.5, h * 0.38, w * 0.7)
  skyFog.addColorStop(0, 'rgba(210,225,235,0.2)')
  skyFog.addColorStop(1, 'rgba(210,225,235,0)')
  ctx.fillStyle = skyFog
  ctx.fillRect(0, 0, w, h)

  const treeBase = h * 0.76
  const treeCount = 24
  for (let i = 0; i < treeCount; i++) {
    const x = (i / (treeCount - 1)) * w
    const width = w * (0.018 + (i % 4) * 0.004)
    const height = h * (0.12 + ((Math.sin(i * 2.7) + 1) * 0.12))
    ctx.fillStyle = i % 3 === 0 ? 'rgba(8,14,12,0.95)' : 'rgba(11,18,16,0.93)'
    ctx.beginPath()
    ctx.moveTo(x - width, treeBase)
    ctx.lineTo(x, treeBase - height)
    ctx.lineTo(x + width, treeBase)
    ctx.closePath()
    ctx.fill()
  }
  ctx.fillStyle = 'rgba(7,12,10,0.96)'
  ctx.fillRect(0, treeBase, w, h - treeBase + 1)

  for (let i = 0; i < 3; i++) {
    const fog = ctx.createLinearGradient(0, h * (0.53 + i * 0.08), 0, h)
    fog.addColorStop(0, `rgba(175,190,198,${0.08 - i * 0.02})`)
    fog.addColorStop(1, 'rgba(175,190,198,0)')
    ctx.fillStyle = fog
    ctx.fillRect(0, 0, w, h)
  }

  const vignette = ctx.createRadialGradient(w * 0.5, h * 0.45, Math.min(w, h) * 0.2, w * 0.5, h * 0.45, Math.max(w, h) * 0.85)
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, 'rgba(0,0,0,0.36)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, w, h)

  drawParticles(ctx, w, h, time, state, { boost: 0.38, color: [255, 255, 255], sizeScale: 1.35, twinkle: 0.45 })

  const cx = w / 2
  const cy = h * 0.42
  const minDim = Math.min(w, h)
  const discR = minDim * 0.12
  const n = 160

  if (audioData?.beat) state.pulseScale = 1.06
  state.pulseScale += (1 - state.pulseScale) * 0.09
  state.rotation += 0.0014

  smoothBars(state, audioData, n, 0.58, 0.09)

  const bass = audioData?.bass ?? 0

  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(state.pulseScale, state.pulseScale)
  ctx.rotate(state.rotation)
  ctx.globalCompositeOperation = 'lighter'

  const coronaLayers = [
    { inner: discR + minDim * 0.025, wave: minDim * 0.042, noise: 0.14, color0: 'rgba(255,245,204,0.96)', color1: 'rgba(255,231,155,0.72)', shadow: 'rgba(255,240,180,0.95)', blur: 20 },
    { inner: discR + minDim * 0.048, wave: minDim * 0.065, noise: 0.2, color0: 'rgba(255,198,105,0.78)', color1: 'rgba(255,126,30,0.54)', shadow: 'rgba(255,150,46,0.82)', blur: 24 },
    { inner: discR + minDim * 0.074, wave: minDim * 0.082, noise: 0.26, color0: 'rgba(246,98,58,0.48)', color1: 'rgba(138,16,24,0.4)', shadow: 'rgba(220,42,20,0.72)', blur: 22 },
  ]

  for (const layer of coronaLayers.reverse()) {
    const pts: { x: number; y: number }[] = []
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const sample = state.smoothedBars[i] || 0
      const noise =
        Math.sin(a * 9 + time * 2.3) * layer.noise +
        Math.sin(a * 17 - time * 1.6) * (layer.noise * 0.55) +
        Math.cos(a * 29 + time * 2.9) * (layer.noise * 0.3)
      const flame = sample * layer.wave + bass * minDim * 0.03
      const dist = layer.inner + flame * (0.5 + 0.5 * Math.abs(Math.sin(a * 4.2 + time * 3.1))) + noise * minDim
      pts.push({ x: Math.cos(a) * dist, y: Math.sin(a) * dist })
    }

    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 0; i <= n; i++) {
      const cur = pts[i % n]
      const next = pts[(i + 1) % n]
      const midX = (cur.x + next.x) / 2
      const midY = (cur.y + next.y) / 2
      ctx.quadraticCurveTo(cur.x, cur.y, midX, midY)
    }
    ctx.closePath()

    const grad = ctx.createRadialGradient(0, 0, discR * 0.92, 0, 0, layer.inner + layer.wave * 1.55)
    grad.addColorStop(0, layer.color0)
    grad.addColorStop(1, layer.color1)
    ctx.fillStyle = grad
    ctx.shadowColor = layer.shadow
    ctx.shadowBlur = layer.blur
    ctx.fill()
  }

  ctx.globalCompositeOperation = 'source-over'
  ctx.restore()

  drawCenterDisc(ctx, cx, cy, discR, {
    fill: 'rgba(5,3,8,0.96)',
    stroke: 'rgba(255,220,160,0.36)',
    glow: 'rgba(255,180,70,0.5)',
    glowBlur: 12,
    lineWidth: 1.6,
  })
}

/* ═══════════════════════════════════════════════════════════════
   TEMPLATE 3: LUCKY CLOVER
   白蓝星爆 + 悬崖夕阳
   ═══════════════════════════════════════════════════════════════ */
function drawLuckyClover(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  audioData: AudioData | null,
  state: DrawState,
  time: number,
) {
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#1a274a')
  bg.addColorStop(0.4, '#56335d')
  bg.addColorStop(0.68, '#c36d3a')
  bg.addColorStop(1, '#f3be62')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  const horizonGlow = ctx.createRadialGradient(w * 0.52, h * 0.84, 0, w * 0.52, h * 0.84, w * 0.65)
  horizonGlow.addColorStop(0, 'rgba(255,202,94,0.3)')
  horizonGlow.addColorStop(1, 'rgba(255,202,94,0)')
  ctx.fillStyle = horizonGlow
  ctx.fillRect(0, 0, w, h)

  const distantRidge = ctx.createLinearGradient(0, h * 0.57, 0, h)
  distantRidge.addColorStop(0, 'rgba(28,24,52,0.18)')
  distantRidge.addColorStop(1, 'rgba(12,12,24,0.5)')
  ctx.fillStyle = distantRidge
  ctx.beginPath()
  ctx.moveTo(0, h * 0.66)
  ctx.bezierCurveTo(w * 0.18, h * 0.6, w * 0.34, h * 0.68, w * 0.5, h * 0.64)
  ctx.bezierCurveTo(w * 0.72, h * 0.58, w * 0.88, h * 0.7, w, h * 0.63)
  ctx.lineTo(w, h)
  ctx.lineTo(0, h)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = 'rgba(8,7,18,0.95)'
  ctx.beginPath()
  ctx.moveTo(w * 0.5, h)
  ctx.lineTo(w * 0.59, h * 0.68)
  ctx.lineTo(w * 0.65, h * 0.6)
  ctx.lineTo(w * 0.74, h * 0.56)
  ctx.lineTo(w * 0.81, h * 0.57)
  ctx.lineTo(w * 0.88, h * 0.55)
  ctx.lineTo(w * 0.96, h * 0.63)
  ctx.lineTo(w, h * 0.66)
  ctx.lineTo(w, h)
  ctx.closePath()
  ctx.fillStyle = 'rgba(8,7,18,0.95)'
  ctx.fill()

  const fy = h * 0.535
  for (const fx of [w * 0.74, w * 0.775]) {
    ctx.fillStyle = 'rgba(5,5,12,0.98)'
    ctx.beginPath()
    ctx.arc(fx, fy - 6, 2.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(fx - 1.5, fy - 4, 3, 8)
  }

  drawParticles(ctx, w, h, time, state, { boost: 0.5, color: [208, 226, 255], sizeScale: 1.03, twinkle: 0.33 })

  const cx = w / 2
  const cy = h * 0.4
  const minDim = Math.min(w, h)
  const discR = minDim * 0.12
  const spikeCount = 136

  if (audioData?.beat) state.pulseScale = 1.05
  state.pulseScale += (1 - state.pulseScale) * 0.09
  state.rotation += 0.0011

  smoothBars(state, audioData, spikeCount, 0.62, 0.09)

  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(state.pulseScale, state.pulseScale)
  ctx.rotate(state.rotation)
  ctx.globalCompositeOperation = 'lighter'

  const halo = ctx.createRadialGradient(0, 0, discR, 0, 0, discR + minDim * 0.19)
  halo.addColorStop(0, 'rgba(255,255,255,0.2)')
  halo.addColorStop(1, 'rgba(82,182,255,0)')
  ctx.fillStyle = halo
  ctx.beginPath()
  ctx.arc(0, 0, discR + minDim * 0.19, 0, Math.PI * 2)
  ctx.fill()

  for (let i = 0; i < spikeCount; i++) {
    const a = (i / spikeCount) * Math.PI * 2
    const sample = state.smoothedBars[i] || 0
    const spikeLen = discR + minDim * 0.024 + sample * minDim * 0.16
    const tipX = Math.cos(a) * spikeLen
    const tipY = Math.sin(a) * spikeLen
    const baseW = minDim * 0.0028
    const perpA = a + Math.PI / 2
    const bx = Math.cos(a) * (discR + 2)
    const by = Math.sin(a) * (discR + 2)

    ctx.beginPath()
    ctx.moveTo(bx + Math.cos(perpA) * baseW, by + Math.sin(perpA) * baseW)
    ctx.lineTo(tipX, tipY)
    ctx.lineTo(bx - Math.cos(perpA) * baseW, by - Math.sin(perpA) * baseW)
    ctx.closePath()

    const spikeGrad = ctx.createLinearGradient(bx, by, tipX, tipY)
    spikeGrad.addColorStop(0, 'rgba(255,255,255,0.98)')
    spikeGrad.addColorStop(0.6, 'rgba(216,240,255,0.78)')
    spikeGrad.addColorStop(1, 'rgba(86,186,255,0.64)')
    ctx.fillStyle = spikeGrad
    ctx.shadowColor = 'rgba(100,190,255,0.86)'
    ctx.shadowBlur = 18
    ctx.fill()
  }

  ctx.globalCompositeOperation = 'source-over'
  ctx.restore()

  drawCenterDisc(ctx, cx, cy, discR, {
    fill: 'rgba(5,5,10,0.95)',
    stroke: 'rgba(210,235,255,0.45)',
    glow: 'rgba(100,175,255,0.55)',
    glowBlur: 20,
    lineWidth: 2,
  })
}

/* ═══════════════════════════════════════════════════════════════
   TEMPLATE 4: PETAL DANCE
   紫色径向频谱条 + 浮岛奇幻
   ═══════════════════════════════════════════════════════════════ */
function drawPetalDance(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  audioData: AudioData | null,
  state: DrawState,
  time: number,
) {
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#21103f')
  bg.addColorStop(0.44, '#4c2f74')
  bg.addColorStop(0.74, '#b16842')
  bg.addColorStop(1, '#f1a357')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  for (let i = 0; i < 4; i++) {
    const cy2 = h * (0.17 + i * 0.11)
    const cg = ctx.createRadialGradient(w * (0.18 + i * 0.2), cy2, 0, w * (0.18 + i * 0.2), cy2, w * 0.3)
    cg.addColorStop(0, `rgba(210,170,220,${0.12 - i * 0.018})`)
    cg.addColorStop(1, 'rgba(210,170,220,0)')
    ctx.fillStyle = cg
    ctx.fillRect(0, 0, w, h)
  }

  ctx.fillStyle = 'rgba(13,9,24,0.96)'
  ctx.beginPath()
  ctx.moveTo(w * 0.12, h * 0.71)
  ctx.bezierCurveTo(w * 0.17, h * 0.61, w * 0.27, h * 0.57, w * 0.35, h * 0.59)
  ctx.bezierCurveTo(w * 0.43, h * 0.57, w * 0.51, h * 0.6, w * 0.53, h * 0.66)
  ctx.bezierCurveTo(w * 0.5, h * 0.74, w * 0.39, h * 0.79, w * 0.25, h * 0.77)
  ctx.bezierCurveTo(w * 0.19, h * 0.76, w * 0.14, h * 0.74, w * 0.12, h * 0.71)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = 'rgba(10,7,20,0.95)'
  ctx.beginPath()
  ctx.moveTo(w * 0.2, h * 0.77)
  ctx.lineTo(w * 0.29, h * 0.88)
  ctx.lineTo(w * 0.37, h * 0.77)
  ctx.closePath()
  ctx.fill()

  const fy2 = h * 0.555
  for (const fx of [w * 0.33, w * 0.38]) {
    ctx.fillStyle = 'rgba(8,6,16,0.98)'
    ctx.beginPath()
    ctx.arc(fx, fy2 - 6, 2.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(fx - 1.5, fy2 - 4, 3, 8)
  }

  drawParticles(ctx, w, h, time, state, { boost: 0.55, color: [252, 246, 255], sizeScale: 1.1, twinkle: 0.42 })

  const cx = w / 2
  const cy = h * 0.4
  const minDim = Math.min(w, h)
  const discR = minDim * 0.12
  const barCount = 64

  if (audioData?.beat) state.pulseScale = 1.05
  state.pulseScale += (1 - state.pulseScale) * 0.09
  state.rotation += 0.001

  smoothBars(state, audioData, barCount, 0.56, 0.1)

  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(state.pulseScale, state.pulseScale)
  ctx.rotate(state.rotation)
  ctx.globalCompositeOperation = 'lighter'

  const ringR = discR + minDim * 0.01
  const maxBarLen = minDim * 0.15

  for (let i = 0; i < barCount; i++) {
    const a = (i / barCount) * Math.PI * 2
    const sample = state.smoothedBars[i] || 0
    const barLen = sample * maxBarLen + minDim * 0.005
    const barWidth = (2 * Math.PI * ringR / barCount) * 0.7

    ctx.save()
    ctx.rotate(a)
    const barGrad = ctx.createLinearGradient(ringR, 0, ringR + barLen, 0)
    barGrad.addColorStop(0, 'rgba(170,84,246,0.9)')
    barGrad.addColorStop(1, 'rgba(236,112,255,0.58)')
    ctx.fillStyle = barGrad
    ctx.shadowColor = 'rgba(196,86,255,0.78)'
    ctx.shadowBlur = 14
    ctx.fillRect(ringR, -barWidth / 2, barLen, barWidth)
    ctx.restore()
  }

  ctx.globalCompositeOperation = 'source-over'
  ctx.restore()

  drawCenterDisc(ctx, cx, cy, discR, {
    fill: 'rgba(8,4,15,0.95)',
    stroke: 'rgba(212,170,255,0.45)',
    glow: 'rgba(178,78,255,0.56)',
    glowBlur: 18,
    lineWidth: 2,
  })
}

/* ═══════════════════════════════════════════════════════════════
   TEMPLATE 5: STARDUST SKY
   赛博朋克城市 + 脉冲光环
   ═══════════════════════════════════════════════════════════════ */
function drawStardustSky(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  audioData: AudioData | null,
  state: DrawState,
  time: number,
) {
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#060a18')
  bg.addColorStop(0.55, '#101732')
  bg.addColorStop(1, '#070d1f')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  const vanishX = w * 0.5
  const leftBuildings: { x: number; bw: number; bh: number; side: 'left' | 'right' }[] = [
    { x: 0, bw: w * 0.12, bh: h * 0.72, side: 'left' },
    { x: w * 0.1, bw: w * 0.09, bh: h * 0.58, side: 'left' },
    { x: w * 0.18, bw: w * 0.085, bh: h * 0.83, side: 'left' },
    { x: w * 0.25, bw: w * 0.065, bh: h * 0.5, side: 'left' },
  ]
  const rightBuildings: { x: number; bw: number; bh: number; side: 'left' | 'right' }[] = [
    { x: w * 0.64, bw: w * 0.07, bh: h * 0.57, side: 'right' },
    { x: w * 0.7, bw: w * 0.105, bh: h * 0.77, side: 'right' },
    { x: w * 0.79, bw: w * 0.09, bh: h * 0.61, side: 'right' },
    { x: w * 0.87, bw: w * 0.13, bh: h * 0.87, side: 'right' },
  ]
  const allBuildings = [...leftBuildings, ...rightBuildings]

  for (let bi = 0; bi < allBuildings.length; bi++) {
    const b = allBuildings[bi]
    const by = h - b.bh
    const nearEdge = b.side === 'left' ? b.x + b.bw : b.x
    const skew = ((vanishX - nearEdge) / w) * (h * 0.05)

    ctx.fillStyle = 'rgba(8,12,24,0.95)'
    ctx.beginPath()
    ctx.moveTo(b.x, h)
    ctx.lineTo(b.x + (b.side === 'left' ? skew : 0), by)
    ctx.lineTo(b.x + b.bw + (b.side === 'right' ? skew : 0), by)
    ctx.lineTo(b.x + b.bw, h)
    ctx.closePath()
    ctx.fill()

    for (let j = 0; j < 4; j++) {
      const ny = by + b.bh * (0.15 + j * 0.22)
      ctx.fillStyle = j % 2 === 0 ? 'rgba(0,232,255,0.55)' : 'rgba(255,70,186,0.48)'
      ctx.fillRect(b.x + 3, ny, b.bw - 6, 1.5)
    }

    for (let wy = by + 8; wy < h - 8; wy += 13) {
      for (let wx = b.x + 4; wx < b.x + b.bw - 4; wx += 8) {
        const seed = (bi * 1000 + wy * 31 + wx * 17) % 100
        if (seed > 42) {
          ctx.fillStyle = seed % 2 === 0 ? 'rgba(0,210,255,0.17)' : 'rgba(255,66,170,0.14)'
          ctx.fillRect(wx, wy, 3, 2.5)
        }
      }
    }
  }

  ctx.save()
  ctx.shadowColor = 'rgba(255,64,176,0.76)'
  ctx.shadowBlur = 26
  ctx.fillStyle = 'rgba(255,72,186,0.5)'
  ctx.fillRect(w * 0.14, h * 0.08, w * 0.016, h * 0.72)
  ctx.restore()

  const avenue = ctx.createLinearGradient(vanishX, h * 0.55, vanishX, h)
  avenue.addColorStop(0, 'rgba(0,0,0,0)')
  avenue.addColorStop(1, 'rgba(0,220,255,0.1)')
  ctx.beginPath()
  ctx.moveTo(w * 0.36, h)
  ctx.lineTo(w * 0.48, h * 0.56)
  ctx.lineTo(w * 0.52, h * 0.56)
  ctx.lineTo(w * 0.64, h)
  ctx.closePath()
  ctx.fillStyle = avenue
  ctx.fill()

  const haze = ctx.createRadialGradient(vanishX, h * 0.54, 0, vanishX, h * 0.54, w * 0.42)
  haze.addColorStop(0, 'rgba(126,196,255,0.16)')
  haze.addColorStop(1, 'rgba(126,196,255,0)')
  ctx.fillStyle = haze
  ctx.fillRect(0, 0, w, h)

  drawParticles(ctx, w, h, time, state, { boost: 0.5, color: [100, 200, 255], sizeScale: 0.8, twinkle: 0.5 })

  const cx = w / 2
  const cy = h * 0.42
  const minDim = Math.min(w, h)
  const discR = minDim * 0.14
  const n = 128

  if (audioData?.beat) state.pulseScale = 1.08
  state.pulseScale += (1 - state.pulseScale) * 0.09
  state.rotation += 0.001

  smoothBars(state, audioData, n, 0.5, 0.1)

  const bass = audioData?.bass ?? 0

  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(state.pulseScale, state.pulseScale)
  ctx.globalCompositeOperation = 'lighter'

  const ringR2 = discR + minDim * 0.022
  const ringWidth = minDim * 0.008 + bass * 9

  ctx.beginPath()
  ctx.arc(0, 0, ringR2, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(0,224,255,0.74)'
  ctx.lineWidth = ringWidth
  ctx.shadowColor = 'rgba(0,210,255,0.95)'
  ctx.shadowBlur = 22 + bass * 16
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(0, 0, ringR2 + minDim * 0.015, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,66,180,0.36)'
  ctx.lineWidth = minDim * 0.004
  ctx.shadowColor = 'rgba(255,64,176,0.62)'
  ctx.shadowBlur = 13
  ctx.stroke()

  ctx.globalCompositeOperation = 'source-over'
  ctx.restore()

  drawCenterDisc(ctx, cx, cy, discR, {
    fill: 'rgba(5,8,18,0.95)',
    stroke: 'rgba(0,180,255,0.5)',
    glow: 'rgba(0,150,255,0.4)',
    glowBlur: 16,
    lineWidth: 2,
  })
}

/* ═══════════════════════════════════════════════════════════════
   MAIN ENTRY POINT
   ═══════════════════════════════════════════════════════════════ */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  audioData: AudioData | null,
  state: DrawState,
  time: number,
  artistName: string,
  songTitle: string,
  template: TemplateId,
) {
  const targetParticles = template === 'stardust-sky' ? 150 : 90
  if (!state.initialized || state.particles.length !== targetParticles) {
    state.particles = initParticles(w, h, targetParticles)
    state.initialized = true
  }

  if (template === 'pinky-pop') drawPinkyPop(ctx, w, h, audioData, state, time)
  else if (template === 'lucky-clover') drawLuckyClover(ctx, w, h, audioData, state, time)
  else if (template === 'petal-dance') drawPetalDance(ctx, w, h, audioData, state, time)
  else if (template === 'stardust-sky') drawStardustSky(ctx, w, h, audioData, state, time)
  else drawCountingStars(ctx, w, h, audioData, state, time)

  // Text overlay
  const tcx = w / 2
  ctx.textAlign = 'center'
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 10
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = '600 12px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.letterSpacing = '2px'
  ctx.fillText(artistName.toUpperCase(), tcx, h * 0.76)

  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  ctx.font = '300 28px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.letterSpacing = '0px'
  ctx.shadowColor = 'rgba(0,0,0,0.2)'
  ctx.shadowBlur = 12
  ctx.fillText(songTitle, tcx, h * 0.76 + 36)
  ctx.shadowBlur = 0
}
