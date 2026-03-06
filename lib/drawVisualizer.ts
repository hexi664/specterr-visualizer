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
   Misty forest + fire corona around disc (solar eclipse look)
   ═══════════════════════════════════════════════════════════════ */
function drawPinkyPop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  audioData: AudioData | null,
  state: DrawState,
  time: number,
) {
  // Cool blue-gray misty sky
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#5a6d7a')
  bg.addColorStop(0.25, '#6b7f8c')
  bg.addColorStop(0.5, '#8a9da8')
  bg.addColorStop(0.7, '#b0c0c8')
  bg.addColorStop(1, '#3a4a4f')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  // Fog layers
  for (let i = 0; i < 4; i++) {
    const fy = h * (0.4 + i * 0.12)
    const fg = ctx.createRadialGradient(w * (0.3 + i * 0.15), fy, 0, w * (0.3 + i * 0.15), fy, w * 0.5)
    fg.addColorStop(0, `rgba(200,215,225,${0.2 - i * 0.03})`)
    fg.addColorStop(1, 'rgba(200,215,225,0)')
    ctx.fillStyle = fg
    ctx.fillRect(0, 0, w, h)
  }

  // Tree silhouettes
  drawTreeSilhouettes(ctx, w, h)

  // Particles (white bokeh/snow)
  drawParticles(ctx, w, h, time, state, { boost: 0.6, color: [220, 230, 240], sizeScale: 1.2, twinkle: 0.4 })

  const cx = w / 2
  const cy = h * 0.42
  const minDim = Math.min(w, h)
  const discR = minDim * 0.13
  const n = 128

  if (audioData?.beat) state.pulseScale = 1.06
  state.pulseScale += (1 - state.pulseScale) * 0.1
  state.rotation += 0.002

  smoothBars(state, audioData, n, 0.55, 0.1)

  const bass = audioData?.bass ?? 0
  const volume = audioData?.volume ?? 0

  // Fire corona effect - irregular flame spikes radiating from disc
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(state.pulseScale, state.pulseScale)

  const spikeCount = 180
  // Draw multiple layers: outer red → mid orange → inner yellow-white
  const coronaLayers = [
    { maxLen: minDim * 0.16, color1: [180, 30, 10], color2: [120, 10, 5], alpha: 0.5, blur: 25 },
    { maxLen: minDim * 0.12, color1: [255, 140, 20], color2: [220, 80, 10], alpha: 0.7, blur: 18 },
    { maxLen: minDim * 0.08, color1: [255, 220, 80], color2: [255, 180, 40], alpha: 0.85, blur: 12 },
    { maxLen: minDim * 0.04, color1: [255, 255, 200], color2: [255, 240, 160], alpha: 0.95, blur: 6 },
  ]

  for (const layer of coronaLayers) {
    ctx.beginPath()
    for (let i = 0; i <= spikeCount; i++) {
      const a = (i / spikeCount) * Math.PI * 2
      const freqIdx = Math.floor((i / spikeCount) * n) % n
      const sample = state.smoothedBars[freqIdx]
      // Organic flame noise
      const noise1 = Math.sin(a * 7 + time * 3.5) * 0.3
      const noise2 = Math.cos(a * 13 - time * 2.1) * 0.2
      const noise3 = Math.sin(a * 23 + time * 5.2) * 0.15
      const flicker = 1 + noise1 + noise2 + noise3
      const spikeLen = discR + (layer.maxLen * (0.3 + sample * 0.7 + bass * 0.3) * flicker)
      const x = Math.cos(a) * spikeLen
      const y = Math.sin(a) * spikeLen
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()

    const grad = ctx.createRadialGradient(0, 0, discR, 0, 0, discR + layer.maxLen)
    grad.addColorStop(0, `rgba(${layer.color1.join(',')},${layer.alpha})`)
    grad.addColorStop(0.6, `rgba(${layer.color2.join(',')},${layer.alpha * 0.6})`)
    grad.addColorStop(1, `rgba(${layer.color2.join(',')},0)`)
    ctx.fillStyle = grad
    ctx.globalCompositeOperation = 'lighter'
    ctx.shadowColor = `rgba(${layer.color1.join(',')},0.8)`
    ctx.shadowBlur = layer.blur
    ctx.fill()
  }

  // Inner bright glow around disc edge
  const innerGlow = ctx.createRadialGradient(0, 0, discR * 0.8, 0, 0, discR * 1.3)
  innerGlow.addColorStop(0, 'rgba(255,255,220,0)')
  innerGlow.addColorStop(0.5, `rgba(255,200,100,${0.3 + volume * 0.3})`)
  innerGlow.addColorStop(1, 'rgba(255,100,20,0)')
  ctx.fillStyle = innerGlow
  ctx.globalCompositeOperation = 'lighter'
  ctx.beginPath()
  ctx.arc(0, 0, discR * 1.5, 0, Math.PI * 2)
  ctx.fill()

  ctx.globalCompositeOperation = 'source-over'
  ctx.restore()

  drawCenterDisc(ctx, cx, cy, discR, {
    fill: 'rgba(5,3,8,0.95)',
    stroke: 'rgba(255,200,100,0.3)',
    glow: 'rgba(255,150,50,0.4)',
    glowBlur: 10,
    lineWidth: 1.5,
  })
}

/* ═══════════════════════════════════════════════════════════════
   TEMPLATE 3: LUCKY CLOVER
   Fantasy cliff sunset + white-cyan starburst spikes
   ═══════════════════════════════════════════════════════════════ */
function drawLuckyClover(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  audioData: AudioData | null,
  state: DrawState,
  time: number,
) {
  // Golden/amber sunset sky
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#1a1535')
  bg.addColorStop(0.3, '#2d2255')
  bg.addColorStop(0.55, '#6a3a50')
  bg.addColorStop(0.75, '#c87040')
  bg.addColorStop(0.9, '#e8a050')
  bg.addColorStop(1, '#1a1020')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  // Sunset glow at horizon
  const sunGlow = ctx.createRadialGradient(w * 0.5, h * 0.78, 0, w * 0.5, h * 0.78, w * 0.5)
  sunGlow.addColorStop(0, 'rgba(255,200,100,0.4)')
  sunGlow.addColorStop(0.5, 'rgba(255,150,60,0.15)')
  sunGlow.addColorStop(1, 'rgba(255,150,60,0)')
  ctx.fillStyle = sunGlow
  ctx.fillRect(0, 0, w, h)

  // Cliff with figures
  drawCliffWithFigures(ctx, w, h, 0.3, 0.65)

  // Dark ground
  ctx.fillStyle = 'rgba(10,8,18,0.85)'
  ctx.fillRect(0, h * 0.85, w, h * 0.15)

  drawParticles(ctx, w, h, time, state, { boost: 0.8, color: [200, 220, 255], sizeScale: 1.0, twinkle: 0.35 })

  const cx = w / 2
  const cy = h * 0.4
  const minDim = Math.min(w, h)
  const discR = minDim * 0.12
  const n = 128

  if (audioData?.beat) state.pulseScale = 1.05
  state.pulseScale += (1 - state.pulseScale) * 0.1
  state.rotation += 0.0012

  smoothBars(state, audioData, n, 0.6, 0.09)

  const volume = audioData?.volume ?? 0

  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(state.pulseScale, state.pulseScale)
  ctx.rotate(state.rotation)

  // Starburst spikes - white core to cyan/blue edges
  const spikeCount = 128

  // Outer blue glow halo
  const haloGrad = ctx.createRadialGradient(0, 0, discR, 0, 0, discR + minDim * 0.2)
  haloGrad.addColorStop(0, `rgba(80,180,255,${0.15 + volume * 0.2})`)
  haloGrad.addColorStop(0.5, `rgba(50,120,255,${0.08 + volume * 0.1})`)
  haloGrad.addColorStop(1, 'rgba(30,80,255,0)')
  ctx.fillStyle = haloGrad
  ctx.globalCompositeOperation = 'lighter'
  ctx.beginPath()
  ctx.arc(0, 0, discR + minDim * 0.2, 0, Math.PI * 2)
  ctx.fill()

  // Draw spikes
  for (let i = 0; i < spikeCount; i++) {
    const a = (i / spikeCount) * Math.PI * 2
    const sample = state.smoothedBars[i % n]
    const spikeLen = discR + minDim * 0.03 + sample * minDim * 0.15 + volume * minDim * 0.03
    const tipX = Math.cos(a) * spikeLen
    const tipY = Math.sin(a) * spikeLen
    const baseW = minDim * 0.004
    const perpA = a + Math.PI / 2

    ctx.beginPath()
    ctx.moveTo(Math.cos(a) * (discR + 2), Math.sin(a) * (discR + 2))
    ctx.lineTo(
      Math.cos(a) * (discR + 2) + Math.cos(perpA) * baseW,
      Math.sin(a) * (discR + 2) + Math.sin(perpA) * baseW,
    )
    ctx.lineTo(tipX, tipY)
    ctx.lineTo(
      Math.cos(a) * (discR + 2) - Math.cos(perpA) * baseW,
      Math.sin(a) * (discR + 2) - Math.sin(perpA) * baseW,
    )
    ctx.closePath()

    const spikeGrad = ctx.createLinearGradient(
      Math.cos(a) * discR, Math.sin(a) * discR,
      tipX, tipY,
    )
    spikeGrad.addColorStop(0, `rgba(255,255,255,${0.7 + sample * 0.3})`)
    spikeGrad.addColorStop(0.4, `rgba(150,220,255,${0.5 + sample * 0.3})`)
    spikeGrad.addColorStop(1, `rgba(60,150,255,${0.1 + sample * 0.2})`)
    ctx.fillStyle = spikeGrad
    ctx.shadowColor = 'rgba(100,180,255,0.6)'
    ctx.shadowBlur = 8 + sample * 12
    ctx.fill()
  }

  ctx.globalCompositeOperation = 'source-over'
  ctx.restore()

  drawCenterDisc(ctx, cx, cy, discR, {
    fill: 'rgba(5,5,10,0.95)',
    stroke: 'rgba(180,220,255,0.4)',
    glow: 'rgba(80,160,255,0.5)',
    glowBlur: 18,
    lineWidth: 2,
  })
}

/* ═══════════════════════════════════════════════════════════════
   TEMPLATE 4: PETAL DANCE
   Fantasy floating island + purple radial frequency bars
   ═══════════════════════════════════════════════════════════════ */
function drawPetalDance(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  audioData: AudioData | null,
  state: DrawState,
  time: number,
) {
  // Purple-orange gradient sky
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#1a0a2e')
  bg.addColorStop(0.25, '#2d1555')
  bg.addColorStop(0.5, '#5a2060')
  bg.addColorStop(0.7, '#8a4040')
  bg.addColorStop(0.85, '#c87030')
  bg.addColorStop(1, '#1a0a15')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  // Warm horizon glow
  const horizonGlow = ctx.createRadialGradient(w * 0.5, h * 0.75, 0, w * 0.5, h * 0.75, w * 0.5)
  horizonGlow.addColorStop(0, 'rgba(255,180,80,0.35)')
  horizonGlow.addColorStop(0.5, 'rgba(200,100,60,0.1)')
  horizonGlow.addColorStop(1, 'rgba(200,100,60,0)')
  ctx.fillStyle = horizonGlow
  ctx.fillRect(0, 0, w, h)

  // Cloud wisps
  for (let i = 0; i < 3; i++) {
    const cy2 = h * (0.3 + i * 0.15)
    const cg = ctx.createRadialGradient(w * (0.3 + i * 0.2), cy2, 0, w * (0.3 + i * 0.2), cy2, w * 0.3)
    cg.addColorStop(0, `rgba(120,60,100,${0.15 - i * 0.03})`)
    cg.addColorStop(1, 'rgba(120,60,100,0)')
    ctx.fillStyle = cg
    ctx.fillRect(0, 0, w, h)
  }

  // Floating island with figures
  drawCliffWithFigures(ctx, w, h, 0.35, 0.68)

  drawParticles(ctx, w, h, time, state, { boost: 0.7, color: [220, 200, 255], sizeScale: 1.1, twinkle: 0.4 })

  const cx = w / 2
  const cy = h * 0.4
  const minDim = Math.min(w, h)
  const discR = minDim * 0.12
  const n = 128

  if (audioData?.beat) state.pulseScale = 1.05
  state.pulseScale += (1 - state.pulseScale) * 0.1
  state.rotation += 0.0008

  smoothBars(state, audioData, n, 0.55, 0.1)

  const volume = audioData?.volume ?? 0

  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(state.pulseScale, state.pulseScale)
  ctx.rotate(state.rotation)

  // Purple radial glow
  const purpleGlow = ctx.createRadialGradient(0, 0, discR, 0, 0, discR + minDim * 0.18)
  purpleGlow.addColorStop(0, `rgba(180,80,255,${0.2 + volume * 0.15})`)
  purpleGlow.addColorStop(0.5, `rgba(140,40,200,${0.08 + volume * 0.08})`)
  purpleGlow.addColorStop(1, 'rgba(100,20,180,0)')
  ctx.fillStyle = purpleGlow
  ctx.globalCompositeOperation = 'lighter'
  ctx.beginPath()
  ctx.arc(0, 0, discR + minDim * 0.18, 0, Math.PI * 2)
  ctx.fill()

  // Radial frequency bars
  const barCount = 96
  const barWidth = (Math.PI * 2 * (discR + 4)) / barCount * 0.55
  const maxBarLen = minDim * 0.14

  for (let i = 0; i < barCount; i++) {
    const a = (i / barCount) * Math.PI * 2
    const freqIdx = Math.floor((i / barCount) * n) % n
    const sample = state.smoothedBars[freqIdx]
    const barLen = minDim * 0.01 + sample * maxBarLen

    const innerR = discR + 4
    const outerR = innerR + barLen

    const x1 = Math.cos(a) * innerR
    const y1 = Math.sin(a) * innerR
    const x2 = Math.cos(a) * outerR
    const y2 = Math.sin(a) * outerR

    const barGrad = ctx.createLinearGradient(x1, y1, x2, y2)
    barGrad.addColorStop(0, `rgba(200,120,255,${0.7 + sample * 0.3})`)
    barGrad.addColorStop(0.5, `rgba(160,60,220,${0.5 + sample * 0.3})`)
    barGrad.addColorStop(1, `rgba(120,30,180,${0.2 + sample * 0.2})`)

    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.strokeStyle = barGrad
    ctx.lineWidth = barWidth
    ctx.lineCap = 'round'
    ctx.shadowColor = `rgba(180,80,255,${0.5 + sample * 0.5})`
    ctx.shadowBlur = 6 + sample * 10
    ctx.stroke()
  }

  ctx.globalCompositeOperation = 'source-over'
  ctx.restore()

  drawCenterDisc(ctx, cx, cy, discR, {
    fill: 'rgba(8,4,15,0.95)',
    stroke: 'rgba(200,160,255,0.4)',
    glow: 'rgba(160,80,255,0.5)',
    glowBlur: 16,
    lineWidth: 2,
  })
}

/* ═══════════════════════════════════════════════════════════════
   TEMPLATE 5: STARDUST SKY
   Cyberpunk cityscape + pulsing glow ring on disc
   ═══════════════════════════════════════════════════════════════ */
function drawStardustSky(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  audioData: AudioData | null,
  state: DrawState,
  time: number,
) {
  // Deep blue-navy cyberpunk sky
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#050a1a')
  bg.addColorStop(0.3, '#0a1530')
  bg.addColorStop(0.6, '#0d1a3a')
  bg.addColorStop(1, '#080e20')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  // Atmospheric haze
  const haze = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.6)
  haze.addColorStop(0, 'rgba(0,100,150,0.12)')
  haze.addColorStop(1, 'rgba(0,50,100,0)')
  ctx.fillStyle = haze
  ctx.fillRect(0, 0, w, h)

  // Cyberpunk buildings
  drawCyberpunkCity(ctx, w, h, time)

  // Particles (small sparkles)
  drawParticles(ctx, w, h, time, state, { boost: 0.5, color: [100, 200, 255], sizeScale: 0.8, twinkle: 0.5 })

  const cx = w / 2
  const cy = h * 0.42
  const minDim = Math.min(w, h)
  const discR = minDim * 0.13
  const n = 128

  if (audioData?.beat) state.pulseScale = 1.04
  state.pulseScale += (1 - state.pulseScale) * 0.1
  state.rotation += 0.001

  smoothBars(state, audioData, n, 0.5, 0.1)

  const volume = audioData?.volume ?? 0
  const bass = audioData?.bass ?? 0

  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(state.pulseScale, state.pulseScale)

  // Pulsing cyan ring around disc
  const ringWidth = minDim * 0.008 + bass * minDim * 0.015
  const ringR2 = discR + minDim * 0.02 + volume * minDim * 0.02

  // Outer glow
  const outerGlow = ctx.createRadialGradient(0, 0, discR, 0, 0, discR + minDim * 0.12)
  outerGlow.addColorStop(0, `rgba(0,200,255,${0.15 + volume * 0.2})`)
  outerGlow.addColorStop(0.4, `rgba(0,120,200,${0.06 + volume * 0.08})`)
  outerGlow.addColorStop(1, 'rgba(0,80,160,0)')
  ctx.fillStyle = outerGlow
  ctx.globalCompositeOperation = 'lighter'
  ctx.beginPath()
  ctx.arc(0, 0, discR + minDim * 0.12, 0, Math.PI * 2)
  ctx.fill()

  // Subtle radial spikes (less prominent than other templates)
  const spikeCount = 64
  for (let i = 0; i < spikeCount; i++) {
    const a = (i / spikeCount) * Math.PI * 2
    const freqIdx = Math.floor((i / spikeCount) * n) % n
    const sample = state.smoothedBars[freqIdx]
    const sLen = discR + minDim * 0.015 + sample * minDim * 0.06

    ctx.beginPath()
    ctx.moveTo(Math.cos(a) * (discR + 2), Math.sin(a) * (discR + 2))
    ctx.lineTo(Math.cos(a) * sLen, Math.sin(a) * sLen)
    ctx.strokeStyle = `rgba(0,200,255,${0.2 + sample * 0.5})`
    ctx.lineWidth = minDim * 0.003
    ctx.shadowColor = 'rgba(0,180,255,0.6)'
    ctx.shadowBlur = 6 + sample * 8
    ctx.stroke()
  }

  // Bright ring
  ctx.beginPath()
  ctx.arc(0, 0, ringR2, 0, Math.PI * 2)
  ctx.strokeStyle = `rgba(0,220,255,${0.5 + bass * 0.4})`
  ctx.lineWidth = ringWidth
  ctx.shadowColor = 'rgba(0,200,255,0.8)'
  ctx.shadowBlur = 15 + bass * 15
  ctx.stroke()

  // Pink accent ring
  ctx.beginPath()
  ctx.arc(0, 0, ringR2 + minDim * 0.008, 0, Math.PI * 2)
  ctx.strokeStyle = `rgba(255,0,120,${0.15 + volume * 0.15})`
  ctx.lineWidth = minDim * 0.003
  ctx.shadowColor = 'rgba(255,0,120,0.5)'
  ctx.shadowBlur = 8
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
