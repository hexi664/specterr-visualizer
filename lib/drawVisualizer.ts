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

function drawCountingStars(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  audioData: AudioData | null,
  state: DrawState,
  time: number,
) {
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#f8cbc8')
  bg.addColorStop(0.3, '#e8a6b4')
  bg.addColorStop(0.62, '#c889ae')
  bg.addColorStop(1, '#725b81')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  const cloudA = ctx.createRadialGradient(w * 0.5, h * 0.2, 0, w * 0.5, h * 0.2, w * 0.5)
  cloudA.addColorStop(0, 'rgba(255,230,214,0.46)')
  cloudA.addColorStop(0.5, 'rgba(255,200,212,0.2)')
  cloudA.addColorStop(1, 'rgba(255,200,212,0)')
  ctx.fillStyle = cloudA
  ctx.fillRect(0, 0, w, h)

  const cloudB = ctx.createRadialGradient(w * 0.18, h * 0.36, 0, w * 0.18, h * 0.36, w * 0.35)
  cloudB.addColorStop(0, 'rgba(255,211,191,0.3)')
  cloudB.addColorStop(1, 'rgba(255,211,191,0)')
  ctx.fillStyle = cloudB
  ctx.fillRect(0, 0, w, h)

  const cloudC = ctx.createRadialGradient(w * 0.78, h * 0.26, 0, w * 0.78, h * 0.26, w * 0.32)
  cloudC.addColorStop(0, 'rgba(255,194,217,0.3)')
  cloudC.addColorStop(1, 'rgba(255,194,217,0)')
  ctx.fillStyle = cloudC
  ctx.fillRect(0, 0, w, h)

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

function drawPinkyPop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  audioData: AudioData | null,
  state: DrawState,
  time: number,
) {
  const bg = ctx.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, '#2f1d52')
  bg.addColorStop(0.35, '#5a2479')
  bg.addColorStop(0.72, '#a3348c')
  bg.addColorStop(1, '#e666b6')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  const auraA = ctx.createRadialGradient(w * 0.3, h * 0.3, 0, w * 0.3, h * 0.3, w * 0.35)
  auraA.addColorStop(0, 'rgba(255,220,246,0.22)')
  auraA.addColorStop(1, 'rgba(255,220,246,0)')
  ctx.fillStyle = auraA
  ctx.fillRect(0, 0, w, h)

  const auraB = ctx.createRadialGradient(w * 0.72, h * 0.66, 0, w * 0.72, h * 0.66, w * 0.4)
  auraB.addColorStop(0, 'rgba(255,142,225,0.25)')
  auraB.addColorStop(1, 'rgba(255,142,225,0)')
  ctx.fillStyle = auraB
  ctx.fillRect(0, 0, w, h)

  drawParticles(ctx, w, h, time, state, { boost: 1.15, color: [255, 168, 230], sizeScale: 0.95, twinkle: 0.35 })

  const cx = w / 2
  const cy = h * 0.43
  const minDim = Math.min(w, h)
  const baseR = minDim * 0.118
  const n = 128

  if (audioData?.beat) state.pulseScale = 1.06
  state.pulseScale += (1 - state.pulseScale) * 0.12
  state.rotation += 0.0019

  smoothBars(state, audioData, n, 0.55, 0.11)

  const layers = [
    { color: '#ffffff', lineWidth: 3.2, amp: 42, waveMul: 2.5, glow: 18, alpha: 0.95 },
    { color: '#ffb1ea', lineWidth: 2.8, amp: 49, waveMul: 3.1, glow: 20, alpha: 0.9 },
    { color: '#ff56be', lineWidth: 2.6, amp: 56, waveMul: 3.7, glow: 24, alpha: 0.86 },
    { color: '#88f5ff', lineWidth: 2.3, amp: 62, waveMul: 4.3, glow: 20, alpha: 0.84 },
  ] as const

  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(state.pulseScale, state.pulseScale)

  layers.forEach((layer, layerIndex) => {
    const phase = time * (1.8 + layerIndex * 0.14) + layerIndex * 0.75

    ctx.beginPath()
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * Math.PI * 2
      const sample = state.smoothedBars[i % n]
      const wave = Math.sin(t * layer.waveMul + phase) * (10 + layerIndex * 4)
      const jitter = Math.cos(t * (6 + layerIndex) - phase * 0.7) * (2 + sample * 4)
      const r = baseR + layerIndex * 9 + wave + jitter + sample * layer.amp
      const x = Math.cos(t) * r
      const y = Math.sin(t) * r
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()

    ctx.globalCompositeOperation = layerIndex >= 2 ? 'lighter' : 'source-over'
    ctx.strokeStyle = layer.color
    ctx.globalAlpha = layer.alpha
    ctx.lineWidth = layer.lineWidth
    ctx.shadowColor = layer.color
    ctx.shadowBlur = layer.glow
    ctx.stroke()
  })

  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
  ctx.restore()

  drawCenterDisc(ctx, cx, cy, baseR * 0.92, {
    fill: 'rgba(18,8,26,0.82)',
    stroke: 'rgba(255,255,255,0.34)',
    glow: 'rgba(255,149,224,0.4)',
    glowBlur: 14,
    lineWidth: 2.1,
  })
}

function drawLuckyClover(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  audioData: AudioData | null,
  state: DrawState,
  time: number,
) {
  const bg = ctx.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, '#082724')
  bg.addColorStop(0.45, '#0f3a34')
  bg.addColorStop(0.78, '#155146')
  bg.addColorStop(1, '#071716')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  const halo = ctx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, w * 0.38)
  halo.addColorStop(0, 'rgba(148,255,122,0.33)')
  halo.addColorStop(0.55, 'rgba(112,240,112,0.16)')
  halo.addColorStop(1, 'rgba(112,240,112,0)')
  ctx.fillStyle = halo
  ctx.fillRect(0, 0, w, h)

  drawParticles(ctx, w, h, time, state, { boost: 1.2, color: [162, 255, 167], sizeScale: 0.9, twinkle: 0.28 })

  const cx = w / 2
  const cy = h * 0.42
  const baseR = Math.min(w, h) * 0.14
  const n = 128

  if (audioData?.beat) state.pulseScale = 1.07
  state.pulseScale += (1 - state.pulseScale) * 0.12
  state.rotation += 0.0015

  smoothBars(state, audioData, n, 0.6, 0.08)

  const energy = audioData?.volume ?? 0
  const cloverPower = 20 + energy * 76

  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(state.pulseScale, state.pulseScale)
  ctx.rotate(state.rotation)

  const layerStyle = [
    { lineWidth: 8.8, stroke: 'rgba(184,255,120,0.95)', fill: 'rgba(138,255,126,0.16)', blur: 30, alpha: 1 },
    { lineWidth: 5.6, stroke: 'rgba(126,255,97,0.78)', fill: 'rgba(126,255,97,0.1)', blur: 24, alpha: 0.9 },
    { lineWidth: 3.2, stroke: 'rgba(224,255,200,0.6)', fill: 'rgba(224,255,200,0.06)', blur: 18, alpha: 0.86 },
  ] as const

  layerStyle.forEach((layer, layerIndex) => {
    ctx.beginPath()
    for (let i = 0; i <= 360; i++) {
      const t = (i / 360) * Math.PI * 2
      const sample = state.smoothedBars[Math.floor((i / 360) * n) % n]
      const radialMod = cloverPower - layerIndex * 7
      const r = baseR + radialMod * Math.cos(4 * t) + sample * (35 - layerIndex * 5)
      const x = Math.cos(t) * r
      const y = Math.sin(t) * r
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()

    ctx.fillStyle = layer.fill
    ctx.globalAlpha = layer.alpha
    ctx.fill()
    ctx.strokeStyle = layer.stroke
    ctx.lineWidth = layer.lineWidth
    ctx.shadowColor = '#8eff73'
    ctx.shadowBlur = layer.blur
    ctx.globalCompositeOperation = layerIndex === 0 ? 'lighter' : 'source-over'
    ctx.stroke()
  })

  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
  ctx.restore()

  drawCenterDisc(ctx, cx, cy, baseR * 0.47, {
    fill: 'rgba(10,18,15,0.78)',
    stroke: 'rgba(225,255,225,0.32)',
    glow: 'rgba(158,255,153,0.45)',
    glowBlur: 16,
    lineWidth: 2,
  })
}

function drawPetalDance(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  audioData: AudioData | null,
  state: DrawState,
  time: number,
) {
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#ffdce8')
  bg.addColorStop(0.5, '#f8bfd6')
  bg.addColorStop(1, '#f2a4c8')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  const bloom = ctx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, w * 0.42)
  bloom.addColorStop(0, 'rgba(255,238,245,0.4)')
  bloom.addColorStop(0.6, 'rgba(255,212,228,0.16)')
  bloom.addColorStop(1, 'rgba(255,212,228,0)')
  ctx.fillStyle = bloom
  ctx.fillRect(0, 0, w, h)

  drawParticles(ctx, w, h, time, state, { boost: 0.9, color: [255, 214, 231], sizeScale: 0.92, twinkle: 0.3 })

  const cx = w / 2
  const cy = h * 0.42
  const baseR = Math.min(w, h) * 0.15
  const n = 128

  if (audioData?.beat) state.pulseScale = 1.05
  state.pulseScale += (1 - state.pulseScale) * 0.1
  state.rotation += 0.0014

  smoothBars(state, audioData, n, 0.54, 0.1)

  const energy = audioData?.volume ?? 0
  const pulse = 18 + energy * 56

  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(state.pulseScale, state.pulseScale)
  ctx.rotate(state.rotation)

  const layers = [
    { lineWidth: 7.5, fill: 'rgba(255,195,216,0.2)', stroke: 'rgba(255,180,205,0.92)', blur: 20, alpha: 1 },
    { lineWidth: 4.6, fill: 'rgba(255,166,197,0.14)', stroke: 'rgba(248,141,183,0.82)', blur: 16, alpha: 0.92 },
    { lineWidth: 2.8, fill: 'rgba(255,221,232,0.1)', stroke: 'rgba(255,230,238,0.75)', blur: 12, alpha: 0.86 },
  ] as const

  layers.forEach((layer, idx) => {
    ctx.beginPath()
    for (let i = 0; i <= 360; i++) {
      const t = (i / 360) * Math.PI * 2
      const sample = state.smoothedBars[Math.floor((i / 360) * n) % n]
      const petal = Math.cos(3 * t)
      const sway = Math.sin(t * (2.2 + idx * 0.5) + time * (1.4 + idx * 0.3)) * (6 - idx)
      const r = baseR + (pulse - idx * 7) * petal + sample * (34 - idx * 5) + sway
      const x = Math.cos(t) * r
      const y = Math.sin(t) * r
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()

    ctx.fillStyle = layer.fill
    ctx.globalAlpha = layer.alpha
    ctx.fill()
    ctx.strokeStyle = layer.stroke
    ctx.lineWidth = layer.lineWidth
    ctx.shadowColor = 'rgba(255,170,210,0.9)'
    ctx.shadowBlur = layer.blur
    ctx.stroke()
  })

  ctx.globalAlpha = 1
  ctx.restore()

  drawCenterDisc(ctx, cx, cy, baseR * 0.5, {
    fill: 'rgba(24,12,22,0.74)',
    stroke: 'rgba(255,239,247,0.4)',
    glow: 'rgba(255,184,220,0.5)',
    glowBlur: 14,
    lineWidth: 2,
  })
}

function drawStardustSky(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  audioData: AudioData | null,
  state: DrawState,
  time: number,
) {
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#091936')
  bg.addColorStop(0.36, '#132c5d')
  bg.addColorStop(0.72, '#2b3b7f')
  bg.addColorStop(1, '#1e2754')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  const nebulaA = ctx.createRadialGradient(w * 0.24, h * 0.24, 0, w * 0.24, h * 0.24, w * 0.4)
  nebulaA.addColorStop(0, 'rgba(123,171,255,0.23)')
  nebulaA.addColorStop(1, 'rgba(123,171,255,0)')
  ctx.fillStyle = nebulaA
  ctx.fillRect(0, 0, w, h)

  const nebulaB = ctx.createRadialGradient(w * 0.78, h * 0.72, 0, w * 0.78, h * 0.72, w * 0.44)
  nebulaB.addColorStop(0, 'rgba(128,116,255,0.26)')
  nebulaB.addColorStop(1, 'rgba(128,116,255,0)')
  ctx.fillStyle = nebulaB
  ctx.fillRect(0, 0, w, h)

  drawParticles(ctx, w, h, time, state, {
    boost: 1.45,
    color: [215, 232, 255],
    sizeScale: 1.15,
    twinkle: 0.55,
  })

  const cx = w / 2
  const cy = h * 0.42
  const minDim = Math.min(w, h)
  const discR = minDim * 0.116
  const ringR = discR + minDim * 0.038
  const waveH = minDim * 0.118
  const pointR = minDim * 0.007

  const pointCount = 76
  const quarter = pointCount / 4
  const layerCount = 7
  const separation = minDim * 0.0102

  const layerColors = [
    'rgba(248,252,255,0.96)',
    'rgba(216,236,255,0.9)',
    'rgba(179,215,255,0.86)',
    'rgba(146,188,255,0.82)',
    'rgba(126,161,255,0.78)',
    'rgba(135,132,255,0.72)',
    'rgba(162,119,255,0.66)',
  ]

  if (audioData?.beat) state.pulseScale = 1.045
  state.pulseScale += (1 - state.pulseScale) * 0.09
  state.rotation += 0.00135

  smoothBars(state, audioData, quarter, 0.6, 0.09)

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
    ctx.globalCompositeOperation = 'lighter'
    ctx.shadowColor = layerColor
    ctx.shadowBlur = 10 + layer * 4

    for (let i = 0; i < pointCount; i++) {
      const a = (i / pointCount) * Math.PI * 2
      const v = values[i]
      const flare = Math.pow(v, 1.2)
      const dist = ringR + v * waveH
      const x = Math.cos(a) * dist
      const y = Math.sin(a) * dist
      const r = pointR * (0.62 + flare * 0.88)

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
    fill: 'rgba(7,11,25,0.9)',
    stroke: 'rgba(203,221,255,0.5)',
    glow: 'rgba(120,158,255,0.62)',
    glowBlur: 20,
    lineWidth: 2.4,
  })
}

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

  const tcx = w / 2
  ctx.textAlign = 'center'
  ctx.shadowColor = 'rgba(0,0,0,0.25)'
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
