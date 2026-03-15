import { AudioData, TemplateId } from './types'

interface Particle {
  x: number
  y: number
  size: number
  opacity: number
  speed: number
}

interface OrbPulse {
  r: number
  alpha: number
  width: number
}

interface DrawState {
  particles: Particle[]
  smoothedBars: number[]
  rotation: number
  pulseScale: number
  initialized: boolean
  orbPulses: OrbPulse[]
  scanOffset: number
}

export function createDrawState(): DrawState {
  return {
    particles: [],
    smoothedBars: new Array(128).fill(0),
    rotation: 0,
    pulseScale: 1,
    initialized: false,
    orbPulses: [],
    scanOffset: 0,
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
    respawnFromBottom?: boolean
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
      p.y = options?.respawnFromBottom ? h + Math.random() * 22 : h + 8
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

/* ═══════════════════════════════════════════════════════════════
   TEMPLATE 1: COUNTING STARS
   ═══════════════════════════════════════════════════════════════ */
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

function drawInferno(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  audioData: AudioData | null,
  state: DrawState,
  time: number,
) {
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#000000')
  bg.addColorStop(0.6, '#1a0000')
  bg.addColorStop(1, '#8B0000')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  const floorGlow = ctx.createRadialGradient(w * 0.5, h * 0.98, 0, w * 0.5, h * 0.98, w * 0.7)
  floorGlow.addColorStop(0, 'rgba(255,69,0,0.4)')
  floorGlow.addColorStop(0.65, 'rgba(255,69,0,0.18)')
  floorGlow.addColorStop(1, 'rgba(255,69,0,0)')
  ctx.fillStyle = floorGlow
  ctx.fillRect(0, 0, w, h)

  drawParticles(ctx, w, h, time, state, {
    boost: 1.5,
    color: [255, 120, 40],
    sizeScale: 1.2,
    twinkle: 0.55,
    respawnFromBottom: true,
  })

  const cx = w / 2
  const cy = h * 0.42
  const minDim = Math.min(w, h)
  const discR = minDim * 0.12
  const barCount = 64
  const bass = audioData?.bass ?? 0

  if (audioData?.beat) state.pulseScale = 1.06
  state.pulseScale += (1 - state.pulseScale) * 0.1
  state.rotation += 0.0018

  smoothBars(state, audioData, barCount, 0.64, 0.08)

  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(state.pulseScale, state.pulseScale)
  ctx.rotate(state.rotation)
  ctx.globalCompositeOperation = 'lighter'
  ctx.shadowColor = 'rgba(255,90,0,0.78)'
  ctx.shadowBlur = 16

  for (let i = 0; i < barCount; i++) {
    const a = (i / barCount) * Math.PI * 2
    const v = state.smoothedBars[i] || 0
    const baseR = discR + minDim * 0.012
    const len = minDim * 0.03 + Math.pow(v, 1.25) * minDim * 0.22 + bass * minDim * 0.03
    const tipR = baseR + len
    const px = Math.cos(a + Math.PI / 2) * minDim * 0.0045
    const py = Math.sin(a + Math.PI / 2) * minDim * 0.0045
    const bx = Math.cos(a) * baseR
    const by = Math.sin(a) * baseR
    const tx = Math.cos(a) * tipR
    const ty = Math.sin(a) * tipR

    const g = ctx.createLinearGradient(bx, by, tx, ty)
    g.addColorStop(0, '#FFD700')
    g.addColorStop(0.45, '#FF8C00')
    g.addColorStop(1, '#B22222')

    ctx.beginPath()
    ctx.moveTo(bx + px, by + py)
    ctx.lineTo(tx, ty)
    ctx.lineTo(bx - px, by - py)
    ctx.closePath()
    ctx.fillStyle = g
    ctx.fill()
  }

  ctx.globalCompositeOperation = 'source-over'
  ctx.restore()

  drawCenterDisc(ctx, cx, cy, discR, {
    fill: 'rgba(10,6,4,0.94)',
    stroke: 'rgba(255,179,71,0.62)',
    glow: 'rgba(255,120,40,0.72)',
    glowBlur: 18,
    lineWidth: 2.2,
  })

  ctx.beginPath()
  ctx.arc(cx, cy, discR * 0.58, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,215,0,0.38)'
  ctx.lineWidth = 1.5
  ctx.stroke()
}

function drawPowerOrb(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  audioData: AudioData | null,
  state: DrawState,
  time: number,
) {
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#000022')
  bg.addColorStop(0.58, '#1a0033')
  bg.addColorStop(1, '#050510')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  for (let i = 0; i < 40; i++) {
    const x = (i * 87.73) % w
    const y = (i * 43.19 + time * 2.8) % h
    ctx.fillStyle = 'rgba(180,220,255,0.35)'
    ctx.fillRect(x, y, 1, 1)
  }

  const cx = w / 2
  const cy = h * 0.42
  const minDim = Math.min(w, h)
  const discR = minDim * 0.12
  const barCount = 96
  const bass = audioData?.bass ?? 0

  if (audioData?.beat) {
    state.pulseScale = 1.09
    state.orbPulses.push({ r: discR * 1.1, alpha: 0.72, width: 2 + bass * 4 })
  } else if (bass > 0.72 && state.orbPulses.length < 8) {
    state.orbPulses.push({ r: discR * 1.05, alpha: 0.48, width: 1.5 + bass * 3 })
  }

  state.pulseScale += (1 - state.pulseScale) * 0.1
  state.rotation += 0.0012

  smoothBars(state, audioData, barCount, 0.66, 0.12)

  const aura = ctx.createRadialGradient(cx, cy, discR * 0.4, cx, cy, discR * 2.4)
  aura.addColorStop(0, 'rgba(255,255,255,0.85)')
  aura.addColorStop(0.25, 'rgba(0,204,255,0.5)')
  aura.addColorStop(1, 'rgba(68,0,255,0)')
  ctx.fillStyle = aura
  ctx.beginPath()
  ctx.arc(cx, cy, discR * 2.4, 0, Math.PI * 2)
  ctx.fill()

  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(state.pulseScale, state.pulseScale)
  ctx.rotate(state.rotation)
  ctx.globalCompositeOperation = 'lighter'
  ctx.shadowColor = 'rgba(90,180,255,0.92)'
  ctx.shadowBlur = 20

  for (let i = 0; i < barCount; i++) {
    const a = (i / barCount) * Math.PI * 2
    const v = Math.pow(state.smoothedBars[i] || 0, 1.15)
    const r0 = discR + minDim * 0.02
    const r1 = r0 + minDim * (0.03 + v * 0.12)
    const j = Math.sin(time * 9 + i * 0.7) * minDim * 0.004

    const p0x = Math.cos(a) * r0
    const p0y = Math.sin(a) * r0
    const p1a = a + 0.015 * Math.sin(time * 7 + i)
    const p1x = Math.cos(p1a) * (r1 * 0.65 + j)
    const p1y = Math.sin(p1a) * (r1 * 0.65 + j)
    const p2x = Math.cos(a) * (r1 + j)
    const p2y = Math.sin(a) * (r1 + j)

    ctx.beginPath()
    ctx.moveTo(p0x, p0y)
    ctx.lineTo(p1x, p1y)
    ctx.lineTo(p2x, p2y)
    ctx.strokeStyle = i % 2 === 0 ? '#45d7ff' : '#7a5cff'
    ctx.lineWidth = 1.2 + v * 1.6
    ctx.stroke()
  }

  ctx.globalCompositeOperation = 'source-over'
  ctx.restore()

  state.orbPulses = state.orbPulses
    .map((pulse) => ({
      r: pulse.r + minDim * 0.012,
      alpha: pulse.alpha * 0.965,
      width: pulse.width,
    }))
    .filter((pulse) => pulse.alpha > 0.03)

  ctx.save()
  ctx.shadowColor = 'rgba(0,204,255,0.6)'
  ctx.shadowBlur = 12
  for (const pulse of state.orbPulses) {
    ctx.beginPath()
    ctx.arc(cx, cy, pulse.r, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(0,204,255,${pulse.alpha})`
    ctx.lineWidth = pulse.width
    ctx.stroke()
  }
  ctx.restore()

  drawCenterDisc(ctx, cx, cy, discR, {
    fill: 'rgba(8,10,30,0.92)',
    stroke: 'rgba(215,245,255,0.85)',
    glow: 'rgba(0,204,255,0.95)',
    glowBlur: 26,
    lineWidth: 2.6,
  })
}

function drawTechscape(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  audioData: AudioData | null,
  state: DrawState,
  _time: number,
) {
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, w, h)

  ctx.lineWidth = 1
  for (let y = 0; y < h; y += 4) {
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'
    ctx.beginPath()
    ctx.moveTo(0, y + 0.5)
    ctx.lineTo(w, y + 0.5)
    ctx.stroke()
  }
  for (let x = 0; x < w; x += 32) {
    ctx.strokeStyle = 'rgba(0,212,255,0.05)'
    ctx.beginPath()
    ctx.moveTo(x + 0.5, 0)
    ctx.lineTo(x + 0.5, h)
    ctx.stroke()
  }

  state.scanOffset = (state.scanOffset + 1.4) % h
  ctx.fillStyle = 'rgba(0,212,255,0.08)'
  ctx.fillRect(0, state.scanOffset, w, 2)

  const cx = w / 2
  const cy = h * 0.42
  const minDim = Math.min(w, h)
  const discR = minDim * 0.12
  const barCount = 96
  const tickCount = 120

  if (audioData?.beat) state.pulseScale = 1.025
  state.pulseScale += (1 - state.pulseScale) * 0.1
  state.rotation += 0.00055

  smoothBars(state, audioData, barCount, 0.5, 0.14)

  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(state.pulseScale, state.pulseScale)

  ctx.rotate(state.rotation)
  for (let i = 0; i < tickCount; i++) {
    const a = (i / tickCount) * Math.PI * 2
    const rA = discR + minDim * 0.17
    const rB = rA + (i % 10 === 0 ? minDim * 0.018 : minDim * 0.009)
    const ax = Math.cos(a) * rA
    const ay = Math.sin(a) * rA
    const bx = Math.cos(a) * rB
    const by = Math.sin(a) * rB

    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(bx, by)
    ctx.strokeStyle = i % 10 === 0 ? '#ffffff' : 'rgba(110,118,138,0.7)'
    ctx.lineWidth = i % 10 === 0 ? 1.3 : 1
    ctx.stroke()
  }

  ctx.shadowColor = 'rgba(0,212,255,0.35)'
  ctx.shadowBlur = 6
  for (let i = 0; i < barCount; i++) {
    const a = (i / barCount) * Math.PI * 2
    const v = state.smoothedBars[i] || 0
    const start = discR + minDim * 0.045
    const len = minDim * (0.015 + v * 0.12)
    const width = minDim * 0.0038

    ctx.save()
    ctx.rotate(a)
    ctx.fillStyle = v > 0.72 ? '#ffffff' : '#00d4ff'
    ctx.fillRect(start, -width / 2, len, width)
    ctx.restore()
  }

  ctx.shadowBlur = 0
  for (const mult of [0.03, 0.09, 0.16]) {
    ctx.beginPath()
    ctx.arc(0, 0, discR + minDim * mult, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(110,118,138,0.35)'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  ctx.restore()

  drawCenterDisc(ctx, cx, cy, discR, {
    fill: 'rgba(6,8,14,0.95)',
    stroke: 'rgba(255,255,255,0.65)',
    glow: 'rgba(0,212,255,0.28)',
    glowBlur: 10,
    lineWidth: 1.8,
  })
}

function drawSynthwave(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  audioData: AudioData | null,
  state: DrawState,
  time: number,
) {
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#0d0221')
  bg.addColorStop(0.58, '#480d6e')
  bg.addColorStop(1, '#1b103f')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  const horizonY = h * 0.62
  const sunX = w * 0.5
  const sunY = h * 0.58
  const sunR = Math.min(w, h) * 0.16

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, w, horizonY)
  ctx.clip()
  const sunGrad = ctx.createRadialGradient(sunX, sunY, sunR * 0.1, sunX, sunY, sunR)
  sunGrad.addColorStop(0, '#ff6b35')
  sunGrad.addColorStop(1, '#ff2975')
  ctx.fillStyle = sunGrad
  ctx.beginPath()
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2)
  ctx.fill()

  for (let i = 0; i < 8; i++) {
    const stripeY = sunY - sunR * 0.82 + i * (sunR * 0.2)
    ctx.fillStyle = 'rgba(20,6,40,0.38)'
    ctx.fillRect(sunX - sunR, stripeY, sunR * 2, sunR * 0.06)
  }
  ctx.restore()

  ctx.strokeStyle = 'rgba(138,43,226,0.55)'
  ctx.lineWidth = 1.3
  for (let i = -10; i <= 10; i++) {
    const x = w * 0.5 + i * (w * 0.06)
    ctx.beginPath()
    ctx.moveTo(x, h)
    ctx.lineTo(w * 0.5, horizonY)
    ctx.stroke()
  }

  for (let i = 1; i <= 12; i++) {
    const t = i / 12
    const y = horizonY + (h - horizonY) * t * t
    ctx.strokeStyle = `rgba(138,43,226,${0.2 + 0.35 * (1 - t)})`
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }

  drawParticles(ctx, w, h, time, state, {
    boost: 0.35,
    color: [180, 160, 255],
    sizeScale: 0.9,
    twinkle: 0.25,
  })

  const cx = w / 2
  const cy = h * 0.44
  const minDim = Math.min(w, h)
  const discR = minDim * 0.12
  const barCount = 64

  if (audioData?.beat) state.pulseScale = 1.055
  state.pulseScale += (1 - state.pulseScale) * 0.09
  state.rotation += 0.0009

  smoothBars(state, audioData, barCount, 0.6, 0.1)

  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(state.pulseScale, state.pulseScale)
  ctx.rotate(state.rotation)
  ctx.globalCompositeOperation = 'lighter'

  for (let i = 0; i < barCount; i++) {
    const a = (i / barCount) * Math.PI * 2
    const v = Math.pow(state.smoothedBars[i] || 0, 1.1)
    const start = discR + minDim * 0.018
    const len = minDim * (0.02 + v * 0.16)
    const bw = minDim * 0.008

    ctx.save()
    ctx.rotate(a)
    const g = ctx.createLinearGradient(start, 0, start + len, 0)
    if (i % 2 === 0) {
      g.addColorStop(0, '#ff2975')
      g.addColorStop(1, '#ff6b35')
      ctx.shadowColor = 'rgba(255,61,145,0.9)'
    } else {
      g.addColorStop(0, '#00d4ff')
      g.addColorStop(1, '#66e6ff')
      ctx.shadowColor = 'rgba(0,212,255,0.88)'
    }
    ctx.shadowBlur = 14
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.roundRect(start, -bw / 2, len, bw, bw / 2)
    ctx.fill()
    ctx.restore()
  }

  ctx.globalCompositeOperation = 'source-over'
  ctx.restore()

  drawCenterDisc(ctx, cx, cy, discR, {
    fill: 'rgba(10,8,22,0.94)',
    stroke: 'rgba(255,170,220,0.7)',
    glow: 'rgba(255,41,117,0.55)',
    glowBlur: 18,
    lineWidth: 2.2,
  })
}

function rainbowColorAt(i: number, n: number) {
  const colors = ['#ff0033', '#ff7a00', '#ffd500', '#39ff14', '#00b7ff', '#8b3dff']
  const t = (i / n) * colors.length
  return colors[Math.floor(t) % colors.length]
}

function drawChromatic(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  audioData: AudioData | null,
  state: DrawState,
  _time: number,
) {
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#0a0a0a')
  bg.addColorStop(1, '#1a1a1a')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  const vignette = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.8)
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, 'rgba(0,0,0,0.35)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, w, h)

  const cx = w / 2
  const cy = h * 0.42
  const minDim = Math.min(w, h)
  const discR = minDim * 0.12
  const barCount = 96

  if (audioData?.beat) state.pulseScale = 1.06
  state.pulseScale += (1 - state.pulseScale) * 0.08
  state.rotation += 0.001

  smoothBars(state, audioData, barCount, 0.68, 0.11)

  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(state.pulseScale, state.pulseScale)
  ctx.rotate(state.rotation)
  ctx.lineCap = 'round'

  for (let i = 0; i < barCount; i++) {
    const a = (i / barCount) * Math.PI * 2
    const v = state.smoothedBars[i] || 0
    const start = discR + minDim * 0.015
    const len = minDim * (0.03 + Math.pow(v, 1.2) * 0.18)
    const thick = minDim * 0.0105
    const color = rainbowColorAt(i, barCount)

    ctx.save()
    ctx.rotate(a)
    ctx.shadowColor = color
    ctx.shadowBlur = 10
    ctx.strokeStyle = color
    ctx.lineWidth = thick
    ctx.beginPath()
    ctx.moveTo(start, 0)
    ctx.lineTo(start + len, 0)
    ctx.stroke()
    ctx.restore()
  }

  const segCount = 24
  const ringR = discR + minDim * 0.008
  ctx.lineWidth = minDim * 0.004
  ctx.shadowBlur = 6
  for (let i = 0; i < segCount; i++) {
    const color = rainbowColorAt(i, segCount)
    const a0 = (i / segCount) * Math.PI * 2
    const a1 = a0 + (Math.PI * 2) / segCount * 0.72
    ctx.beginPath()
    ctx.arc(0, 0, ringR, a0, a1)
    ctx.strokeStyle = color
    ctx.shadowColor = color
    ctx.stroke()
  }

  ctx.restore()

  drawCenterDisc(ctx, cx, cy, discR, {
    fill: 'rgba(8,8,10,0.95)',
    stroke: 'rgba(255,255,255,0.4)',
    glow: 'rgba(255,255,255,0.2)',
    glowBlur: 8,
    lineWidth: 1.8,
  })
}

/* ═══════════════════════════════════════════════════════════════
   LUCKY CLOVER — green blob glow, underwater cavern background
   ═══════════════════════════════════════════════════════════════ */

function drawLuckyClover(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  audioData: AudioData | null,
  state: DrawState,
  time: number,
) {
  // --- dark teal/cavern background ---
  const bg = ctx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, Math.max(w, h) * 0.75)
  bg.addColorStop(0, '#0d3b3b')
  bg.addColorStop(0.35, '#0a2e2e')
  bg.addColorStop(0.7, '#071e1e')
  bg.addColorStop(1, '#020a0a')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  // cavern rock edges
  const rockAlpha = 0.35
  ctx.fillStyle = `rgba(8,18,18,${rockAlpha})`
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(w * 0.15, h * 0.4, 0, h)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(w, 0)
  ctx.quadraticCurveTo(w * 0.85, h * 0.4, w, h)
  ctx.fill()

  // misty fog
  const fog = ctx.createRadialGradient(w * 0.5, h * 0.18, 0, w * 0.5, h * 0.18, w * 0.35)
  fog.addColorStop(0, 'rgba(180,210,210,0.12)')
  fog.addColorStop(1, 'rgba(180,210,210,0)')
  ctx.fillStyle = fog
  ctx.fillRect(0, 0, w, h)

  // particles — teal/cyan speckles
  drawParticles(ctx, w, h, time, state, { boost: 0.6, color: [140, 230, 220], twinkle: 0.5 })

  const cx = w / 2
  const cy = h * 0.42
  const minDim = Math.min(w, h)
  const discR = minDim * 0.12

  if (audioData?.beat) state.pulseScale = 1.06
  state.pulseScale += (1 - state.pulseScale) * 0.07

  const blobN = 64
  smoothBars(state, audioData, blobN, 0.52, 0.07)

  const radii: number[] = []
  for (let i = 0; i < blobN; i++) {
    const v = state.smoothedBars[i] || 0
    const prev1 = state.smoothedBars[(i - 1 + blobN) % blobN] || 0
    const next1 = state.smoothedBars[(i + 1) % blobN] || 0
    const prev2 = state.smoothedBars[(i - 2 + blobN) % blobN] || 0
    const next2 = state.smoothedBars[(i + 2) % blobN] || 0
    const blended = prev2 * 0.08 + prev1 * 0.22 + v * 0.4 + next1 * 0.22 + next2 * 0.08
    const angle = (i / blobN) * Math.PI * 2
    const lobeModulation = 0.4 + 0.6 * Math.pow(Math.abs(Math.cos(2 * angle)), 1.5)
    const freqDrivenRadius = Math.pow(blended, 0.8) * minDim * 0.32
    const r = discR * 1.15 + freqDrivenRadius * lobeModulation
    radii.push(r * state.pulseScale)
  }

  ctx.save()
  ctx.translate(cx, cy)

  const traceBlobPath = () => {
    ctx.beginPath()
    for (let i = 0; i <= blobN; i++) {
      const idx = i % blobN
      const a = (idx / blobN) * Math.PI * 2 - Math.PI / 2
      const r = radii[idx]
      const x = Math.cos(a) * r
      const y = Math.sin(a) * r
      if (i === 0) ctx.moveTo(x, y)
      else {
        const prevIdx = (idx - 1 + blobN) % blobN
        const prevA = (prevIdx / blobN) * Math.PI * 2 - Math.PI / 2
        const cpR = (radii[prevIdx] + r) / 2
        const midA = (prevA + a) / 2
        ctx.quadraticCurveTo(
          Math.cos(prevA) * radii[prevIdx],
          Math.sin(prevA) * radii[prevIdx],
          Math.cos(midA) * cpR,
          Math.sin(midA) * cpR,
        )
      }
    }
    ctx.closePath()
  }

  const glowScales = [1.48, 1.36, 1.24, 1.12]
  const glowAlphas = [0.04, 0.06, 0.08, 0.12]
  for (let pass = 0; pass < 4; pass++) {
    ctx.save()
    ctx.scale(glowScales[pass], glowScales[pass])
    traceBlobPath()
    ctx.fillStyle = `rgba(0,255,65,${glowAlphas[pass]})`
    ctx.fill()
    ctx.restore()
  }

  traceBlobPath()

  const blobGrad = ctx.createRadialGradient(0, 0, discR * 0.8, 0, 0, minDim * 0.28)
  blobGrad.addColorStop(0, 'rgba(240,255,240,0.95)')
  blobGrad.addColorStop(0.2, 'rgba(180,255,180,0.85)')
  blobGrad.addColorStop(0.4, 'rgba(57,255,20,0.7)')
  blobGrad.addColorStop(0.7, 'rgba(0,255,65,0.4)')
  blobGrad.addColorStop(1, 'rgba(0,180,80,0.05)')
  ctx.fillStyle = blobGrad
  ctx.shadowColor = '#00ff41'
  ctx.shadowBlur = 50
  ctx.fill()

  ctx.strokeStyle = 'rgba(255,255,255,0.5)'
  ctx.lineWidth = minDim * 0.003
  ctx.shadowColor = 'rgba(255,255,255,0.3)'
  ctx.shadowBlur = 4
  ctx.stroke()
  ctx.shadowBlur = 0

  ctx.restore()

  // centre disc
  drawCenterDisc(ctx, cx, cy, discR, {
    fill: 'rgba(0,0,0,0.92)',
    stroke: 'rgba(255,255,255,0.18)',
    glow: 'rgba(0,255,65,0.45)',
    glowBlur: 28,
    lineWidth: 2,
  })
}

/* ═══════════════════════════════════════════════════════════════
   RANGE OF FIRE — flame spectrum over teal mountains
   ═══════════════════════════════════════════════════════════════ */
function drawRangeOfFire(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  audioData: AudioData | null, state: DrawState, time: number,
) {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h)
  skyGrad.addColorStop(0, '#6faeb2')
  skyGrad.addColorStop(0.4, '#4e9097')
  skyGrad.addColorStop(0.72, '#1a434a')
  skyGrad.addColorStop(1, '#08171c')
  ctx.fillStyle = skyGrad
  ctx.fillRect(0, 0, w, h)

  const mist = ctx.createRadialGradient(w * 0.52, h * 0.32, 0, w * 0.52, h * 0.45, w * 0.55)
  mist.addColorStop(0, 'rgba(160,230,235,0.22)')
  mist.addColorStop(1, 'rgba(160,230,235,0)')
  ctx.fillStyle = mist
  ctx.fillRect(0, 0, w, h)

  const mountainY = h * 0.5
  ctx.fillStyle = '#152b30'
  ctx.beginPath()
  ctx.moveTo(0, h)
  ctx.lineTo(0, mountainY + h * 0.05)
  ctx.lineTo(w * 0.1, mountainY - h * 0.02)
  ctx.lineTo(w * 0.2, mountainY + h * 0.03)
  ctx.lineTo(w * 0.34, mountainY - h * 0.05)
  ctx.lineTo(w * 0.43, mountainY - h * 0.12)
  ctx.lineTo(w * 0.5, mountainY - h * 0.18)
  ctx.lineTo(w * 0.56, mountainY - h * 0.1)
  ctx.lineTo(w * 0.67, mountainY - h * 0.02)
  ctx.lineTo(w * 0.82, mountainY - h * 0.08)
  ctx.lineTo(w, mountainY - h * 0.01)
  ctx.lineTo(w, h)
  ctx.fill()

  ctx.fillStyle = 'rgba(210,224,230,0.45)'
  ctx.beginPath()
  ctx.moveTo(w * 0.46, mountainY - h * 0.13)
  ctx.lineTo(w * 0.5, mountainY - h * 0.18)
  ctx.lineTo(w * 0.54, mountainY - h * 0.1)
  ctx.lineTo(w * 0.5, mountainY - h * 0.08)
  ctx.fill()

  const lake = ctx.createLinearGradient(0, h * 0.74, 0, h)
  lake.addColorStop(0, 'rgba(70,130,140,0.28)')
  lake.addColorStop(1, 'rgba(5,18,22,0.12)')
  ctx.fillStyle = lake
  ctx.fillRect(0, h * 0.72, w, h * 0.28)

  drawParticles(ctx, w, h, time, state, {
    boost: 0.45,
    color: [240, 255, 255],
    twinkle: 0.45,
    sizeScale: 0.95,
  })

  const bass = audioData?.bass ?? 0.3
  const barCount = 72
  smoothBars(state, audioData, barCount, 0.62, 0.08)
  const baselineY = h * 0.457
  const startX = w * 0.1
  const width = w * 0.8
  const step = width / (barCount - 1)

  ctx.strokeStyle = 'rgba(255,140,90,0.8)'
  ctx.lineWidth = Math.max(1.4, Math.min(w, h) * 0.0021)
  ctx.shadowColor = 'rgba(255,112,64,0.9)'
  ctx.shadowBlur = 18
  ctx.beginPath()
  ctx.moveTo(startX, baselineY)
  ctx.lineTo(startX + width, baselineY)
  ctx.stroke()

  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.beginPath()
  ctx.moveTo(startX, baselineY)
  for (let i = 0; i < barCount; i++) {
    const t = i / (barCount - 1)
    const v = state.smoothedBars[i] || 0
    const envelope = 0.85 + Math.sin(t * Math.PI * 3.2 + time * 0.0012) * 0.15
    const amp = Math.pow(v, 1.28) * h * 0.11 + bass * h * 0.045
    const y = baselineY - amp * envelope
    const x = startX + i * step
    ctx.lineTo(x, y)
  }
  ctx.lineTo(startX + width, baselineY)
  ctx.closePath()

  const flameGrad = ctx.createLinearGradient(0, baselineY - h * 0.16, 0, baselineY)
  flameGrad.addColorStop(0, 'rgba(255,245,170,0.95)')
  flameGrad.addColorStop(0.38, 'rgba(255,170,92,0.9)')
  flameGrad.addColorStop(0.7, 'rgba(255,102,66,0.82)')
  flameGrad.addColorStop(1, 'rgba(255,72,38,0.2)')
  ctx.fillStyle = flameGrad
  ctx.shadowColor = 'rgba(255,110,58,0.92)'
  ctx.shadowBlur = 26
  ctx.fill()

  ctx.shadowBlur = 12
  ctx.strokeStyle = 'rgba(255,220,160,0.45)'
  ctx.lineWidth = Math.max(1, Math.min(w, h) * 0.0015)
  ctx.stroke()
  ctx.restore()

  ctx.shadowBlur = 0
}

/* ═══════════════════════════════════════════════════════════════
   SNOWFLAKE — dreamy blue sky with pulsing disc
   ═══════════════════════════════════════════════════════════════ */
function drawSnowflake(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  audioData: AudioData | null, _state: DrawState, time: number,
) {
  // Blue sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h)
  skyGrad.addColorStop(0, '#4a8ec2')
  skyGrad.addColorStop(0.4, '#6ba8d4')
  skyGrad.addColorStop(0.7, '#8ec0e0')
  skyGrad.addColorStop(1, '#b8d8ec')
  ctx.fillStyle = skyGrad
  ctx.fillRect(0, 0, w, h)

  // Soft clouds
  for (let i = 0; i < 6; i++) {
    const cx = (i * 0.18 + 0.05) * w + Math.sin(time * 0.0001 + i) * 20
    const cy = h * (0.2 + i * 0.1)
    const rx = w * 0.12
    const ry = h * 0.04
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Twinkling stars
  for (let i = 0; i < 50; i++) {
    const sx = (Math.sin(i * 13.7) * 0.5 + 0.5) * w
    const sy = (Math.cos(i * 9.3) * 0.5 + 0.5) * h
    const twinkle = 0.2 + Math.sin(time * 0.003 + i * 4.1) * 0.3
    ctx.fillStyle = `rgba(255,255,255,${Math.max(0, twinkle)})`
    ctx.beginPath()
    ctx.arc(sx, sy, 1.5, 0, Math.PI * 2)
    ctx.fill()
  }

  // Central pulsing disc
  const cx = w / 2, cy = h * 0.4
  const bass = audioData?.bass ?? 0.2
  const volume = audioData?.volume ?? 0.2
  const discR = Math.min(w, h) * 0.12 + bass * 15 + volume * 10

  ctx.shadowColor = 'rgba(100,180,255,0.5)'
  ctx.shadowBlur = 30 + bass * 20
  drawCenterDisc(ctx, cx, cy, discR, {
    fill: 'rgba(0,0,0,0.9)',
    stroke: 'rgba(255,255,255,0.3)',
    glow: 'rgba(100,180,255,0.4)',
    glowBlur: 25,
    lineWidth: 2,
  })
  ctx.shadowBlur = 0
}

/* ═══════════════════════════════════════════════════════════════
   PINKY POP — cherry blossom petals
   ═══════════════════════════════════════════════════════════════ */
function drawPinkyPop(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  audioData: AudioData | null, state: DrawState, time: number,
) {
  // Pink gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, '#fce4ec')
  grad.addColorStop(0.3, '#f8bbd0')
  grad.addColorStop(0.6, '#f48fb1')
  grad.addColorStop(1, '#e8f5e9')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // Cherry tree silhouettes
  ctx.fillStyle = 'rgba(180,100,120,0.2)'
  for (const tx of [w * 0.1, w * 0.85]) {
    ctx.beginPath()
    ctx.arc(tx, h * 0.25, w * 0.1, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(tx - 3, h * 0.3, 6, h * 0.3)
  }

  // Falling petal particles
  const bass = audioData?.bass ?? 0.2
  for (let i = 0; i < 35; i++) {
    const px = ((i * 37.3 + time * 0.00005 * (i % 3 + 1)) % 1) * w
    const py = ((i * 23.7 + time * 0.0001 * (i % 2 + 1)) % 1) * h
    const size = 3 + Math.sin(i * 5.3) * 2 + bass * 3
    const rot = time * 0.001 + i * 2.1
    const alpha = 0.4 + Math.sin(i * 3.1 + time * 0.002) * 0.2

    ctx.save()
    ctx.translate(px, py)
    ctx.rotate(rot)
    ctx.fillStyle = `rgba(255,${150 + (i % 50)},${170 + (i % 40)},${alpha})`
    ctx.beginPath()
    ctx.ellipse(0, 0, size, size * 0.6, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // Central pulsing disc
  const cx = w / 2, cy = h * 0.4
  const volume = audioData?.volume ?? 0.2
  const discR = Math.min(w, h) * 0.12 + bass * 12 + volume * 8

  ctx.shadowColor = 'rgba(255,100,150,0.5)'
  ctx.shadowBlur = 25
  drawCenterDisc(ctx, cx, cy, discR, {
    fill: 'rgba(0,0,0,0.9)',
    stroke: 'rgba(255,200,220,0.4)',
    glow: 'rgba(255,100,150,0.3)',
    glowBlur: 20,
    lineWidth: 2,
  })
  ctx.shadowBlur = 0
}

/* ═══════════════════════════════════════════════════════════════
   SEVEN SUNS — city lights with glowing dot arcs
   ═══════════════════════════════════════════════════════════════ */
function drawSevenSuns(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  audioData: AudioData | null, _state: DrawState, time: number,
) {
  // Dark sky to amber city
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, '#0a0a15')
  grad.addColorStop(0.5, '#1a1520')
  grad.addColorStop(0.8, '#2a1a10')
  grad.addColorStop(1, '#1a0f05')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // City lights glow at bottom
  const cityGrad = ctx.createRadialGradient(w * 0.5, h, 0, w * 0.5, h, h * 0.5)
  cityGrad.addColorStop(0, 'rgba(200,150,50,0.3)')
  cityGrad.addColorStop(1, 'rgba(200,150,50,0)')
  ctx.fillStyle = cityGrad
  ctx.fillRect(0, h * 0.5, w, h * 0.5)

  // Mountain silhouette
  ctx.fillStyle = '#0d0d15'
  ctx.beginPath()
  ctx.moveTo(0, h)
  ctx.lineTo(0, h * 0.7)
  ctx.lineTo(w * 0.2, h * 0.55)
  ctx.lineTo(w * 0.4, h * 0.65)
  ctx.lineTo(w * 0.6, h * 0.5)
  ctx.lineTo(w * 0.8, h * 0.6)
  ctx.lineTo(w, h * 0.55)
  ctx.lineTo(w, h)
  ctx.fill()

  // Central disc
  const cx = w / 2, cy = h * 0.38
  const bass = audioData?.bass ?? 0.2
  const discR = Math.min(w, h) * 0.1
  drawCenterDisc(ctx, cx, cy, discR, {
    fill: 'rgba(0,0,0,0.92)',
    stroke: 'rgba(255,180,50,0.3)',
    glow: 'rgba(255,150,30,0.3)',
    glowBlur: 20,
    lineWidth: 2,
  })

  // Glowing frequency dots in arc patterns
  const freq = audioData?.frequencyData
  const dotCount = 60
  for (let i = 0; i < dotCount; i++) {
    const angle = (i / dotCount) * Math.PI * 2 + time * 0.0003
    const freqVal = freq ? freq[Math.floor(i * freq.length / dotCount)] / 255 : (0.3 + Math.sin(i * 0.5 + time * 0.002) * 0.3)
    const radius = discR * 1.8 + freqVal * Math.min(w, h) * 0.15 + bass * 20
    const dx = cx + Math.cos(angle) * radius
    const dy = cy + Math.sin(angle) * radius * 0.6
    const dotSize = 2 + freqVal * 5
    const hue = 20 + freqVal * 30 // amber to orange-red

    ctx.shadowColor = `hsla(${hue},90%,50%,0.8)`
    ctx.shadowBlur = 12
    ctx.fillStyle = `hsla(${hue},90%,60%,${0.5 + freqVal * 0.5})`
    ctx.beginPath()
    ctx.arc(dx, dy, dotSize, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.shadowBlur = 0
}

/* ═══════════════════════════════════════════════════════════════
   CHROMATIC — rainbow ring around central disc
   ═══════════════════════════════════════════════════════════════ */
function drawChromaticSky(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  audioData: AudioData | null, _state: DrawState, time: number,
) {
  // Dark teal sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h)
  skyGrad.addColorStop(0, '#0d2b3e')
  skyGrad.addColorStop(0.5, '#1a3d4e')
  skyGrad.addColorStop(1, '#0a2030')
  ctx.fillStyle = skyGrad
  ctx.fillRect(0, 0, w, h)

  // Atmospheric clouds
  for (let i = 0; i < 4; i++) {
    const cx2 = (i * 0.25 + 0.1) * w
    const cy2 = h * (0.5 + i * 0.08)
    ctx.fillStyle = 'rgba(150,180,200,0.08)'
    ctx.beginPath()
    ctx.ellipse(cx2, cy2, w * 0.15, h * 0.06, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Stars
  for (let i = 0; i < 30; i++) {
    const sx = (Math.sin(i * 17.3) * 0.5 + 0.5) * w
    const sy = (Math.cos(i * 11.7) * 0.3 + 0.1) * h
    ctx.fillStyle = `rgba(255,255,255,${0.2 + Math.sin(time * 0.003 + i * 3) * 0.15})`
    ctx.beginPath()
    ctx.arc(sx, sy, 1.2, 0, Math.PI * 2)
    ctx.fill()
  }

  const cx = w / 2, cy = h * 0.42
  const bass = audioData?.bass ?? 0.2
  const freq = audioData?.frequencyData
  const discR = Math.min(w, h) * 0.1
  const ringR = discR * 1.6

  // Rainbow ring segments
  const segments = 64
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2 - Math.PI / 2
    const nextAngle = ((i + 1) / segments) * Math.PI * 2 - Math.PI / 2
    const freqVal = freq ? freq[Math.floor(i * freq.length / segments)] / 255 : (0.3 + Math.sin(i * 0.3 + time * 0.002) * 0.2)
    const spikeR = ringR + freqVal * discR * 0.8 + bass * 8
    const hue = (i / segments) * 360

    ctx.strokeStyle = `hsla(${hue},85%,55%,0.85)`
    ctx.lineWidth = 3 + freqVal * 3
    ctx.shadowColor = `hsla(${hue},90%,50%,0.6)`
    ctx.shadowBlur = 8

    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(angle) * ringR, cy + Math.sin(angle) * ringR)
    ctx.lineTo(cx + Math.cos((angle + nextAngle) / 2) * spikeR, cy + Math.sin((angle + nextAngle) / 2) * spikeR)
    ctx.lineTo(cx + Math.cos(nextAngle) * ringR, cy + Math.sin(nextAngle) * ringR)
    ctx.stroke()
  }
  ctx.shadowBlur = 0

  // Central disc
  drawCenterDisc(ctx, cx, cy, discR, {
    fill: 'rgba(0,0,0,0.92)',
    stroke: 'rgba(255,255,255,0.2)',
    glow: 'rgba(100,200,255,0.3)',
    glowBlur: 20,
    lineWidth: 2,
  })
}

/* ═══════════════════════════════════════════════════════════════
   JUNGLE CAT — dark moody with horizontal bar spectrum
   ═══════════════════════════════════════════════════════════════ */
function drawJungleCat(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  audioData: AudioData | null, state: DrawState, time: number,
) {
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, '#20302a')
  grad.addColorStop(0.48, '#1a2a25')
  grad.addColorStop(1, '#0a1614')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  for (let i = 0; i < 14; i++) {
    const px = (i / 13) * w
    const py = h * (0.32 + Math.sin(i * 0.8 + time * 0.0004) * 0.08)
    const r = h * (0.07 + (i % 4) * 0.015)
    const haze = ctx.createRadialGradient(px, py, 0, px, py, r)
    haze.addColorStop(0, 'rgba(160,210,170,0.08)')
    haze.addColorStop(1, 'rgba(160,210,170,0)')
    ctx.fillStyle = haze
    ctx.beginPath()
    ctx.arc(px, py, r, 0, Math.PI * 2)
    ctx.fill()
  }

  const headX = w * 0.53
  const headY = h * 0.47
  const headR = Math.min(w, h) * 0.26
  const headGrad = ctx.createRadialGradient(headX, headY, headR * 0.15, headX, headY, headR)
  headGrad.addColorStop(0, 'rgba(40,45,42,0.75)')
  headGrad.addColorStop(1, 'rgba(5,10,8,0.72)')
  ctx.fillStyle = headGrad
  ctx.beginPath()
  ctx.ellipse(headX, headY, headR * 0.9, headR * 1.02, -0.08, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(12,18,15,0.84)'
  ctx.beginPath()
  ctx.moveTo(headX - headR * 0.48, headY - headR * 0.66)
  ctx.lineTo(headX - headR * 0.28, headY - headR * 1.2)
  ctx.lineTo(headX - headR * 0.1, headY - headR * 0.62)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(headX + headR * 0.48, headY - headR * 0.66)
  ctx.lineTo(headX + headR * 0.28, headY - headR * 1.2)
  ctx.lineTo(headX + headR * 0.1, headY - headR * 0.62)
  ctx.closePath()
  ctx.fill()

  const eyeSep = headR * 0.38
  for (const ex of [headX - eyeSep, headX + eyeSep]) {
    const eyeGlow = ctx.createRadialGradient(ex, headY - headR * 0.16, 0, ex, headY - headR * 0.16, headR * 0.2)
    eyeGlow.addColorStop(0, 'rgba(255,208,80,0.96)')
    eyeGlow.addColorStop(0.55, 'rgba(238,157,45,0.86)')
    eyeGlow.addColorStop(1, 'rgba(238,157,45,0)')
    ctx.fillStyle = eyeGlow
    ctx.beginPath()
    ctx.ellipse(ex, headY - headR * 0.16, headR * 0.11, headR * 0.085, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(28,22,16,0.9)'
    ctx.beginPath()
    ctx.ellipse(ex, headY - headR * 0.16, headR * 0.02, headR * 0.07, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  drawParticles(ctx, w, h, time, state, {
    boost: 0.38,
    color: [245, 255, 245],
    twinkle: 0.42,
    sizeScale: 1.05,
  })

  const mid = audioData?.mid ?? 0.25
  const barCount = 84
  smoothBars(state, audioData, barCount, 0.66, 0.09)
  const baselineY = h * 0.455
  const startX = w * 0.09
  const width = w * 0.82
  const step = width / barCount

  ctx.strokeStyle = 'rgba(255,255,255,0.74)'
  ctx.lineWidth = Math.max(1.1, Math.min(w, h) * 0.0018)
  ctx.setLineDash([Math.max(2, w * 0.003), Math.max(2, w * 0.003)])
  ctx.beginPath()
  ctx.moveTo(startX, baselineY)
  ctx.lineTo(startX + width, baselineY)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  for (let i = 0; i < barCount; i++) {
    const v = state.smoothedBars[i] || 0
    const hUp = Math.pow(v, 1.6) * h * 0.12 + mid * h * 0.015
    const x = startX + i * step
    const bw = Math.max(1.4, step * 0.56)
    ctx.fillRect(x, baselineY - hUp, bw, hUp)
    ctx.fillRect(x, baselineY, bw, hUp * 0.14)
  }
}

/* ═══════════════════════════════════════════════════════════════
   PRISMATIC — kaleidoscope with central pink orb
   ═══════════════════════════════════════════════════════════════ */
function drawPrismatic(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  audioData: AudioData | null, state: DrawState, time: number,
) {
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, '#0a1010')
  grad.addColorStop(0.45, '#101b17')
  grad.addColorStop(1, '#07100d')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  const cx = w / 2
  const cy = h / 2
  const bass = audioData?.bass ?? 0.2

  for (const sy of [1, -1]) {
    for (const sx of [1, -1]) {
      ctx.save()
      ctx.translate(cx, cy)
      ctx.scale(sx, sy)
      for (let layer = 0; layer < 5; layer++) {
        const depth = layer / 5
        const x0 = w * (0.08 + layer * 0.08)
        const y0 = h * (0.06 + layer * 0.02)
        const x1 = x0 + w * 0.2
        const hue = 320 + layer * 12 + Math.sin(time * 0.0009 + layer) * 8
        ctx.fillStyle = `hsla(${hue},70%,${24 + layer * 4}%,${0.18 + depth * 0.1})`
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(x1, y0 + h * 0.14)
        ctx.lineTo(x0 + w * 0.12, y0 + h * 0.19)
        ctx.lineTo(x0 - w * 0.03, y0 + h * 0.1)
        ctx.closePath()
        ctx.fill()
      }
      ctx.restore()
    }
  }

  const orb = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.36)
  orb.addColorStop(0, `rgba(255,118,178,${0.86 + bass * 0.1})`)
  orb.addColorStop(0.3, 'rgba(255,72,142,0.58)')
  orb.addColorStop(0.6, 'rgba(124,219,255,0.22)')
  orb.addColorStop(1, 'rgba(124,219,255,0)')
  ctx.fillStyle = orb
  ctx.fillRect(0, 0, w, h)

  const sideGlowR = ctx.createRadialGradient(cx + w * 0.18, cy, 0, cx + w * 0.18, cy, w * 0.2)
  sideGlowR.addColorStop(0, 'rgba(145,235,255,0.32)')
  sideGlowR.addColorStop(1, 'rgba(145,235,255,0)')
  ctx.fillStyle = sideGlowR
  ctx.fillRect(0, 0, w, h)
  const sideGlowL = ctx.createRadialGradient(cx - w * 0.18, cy, 0, cx - w * 0.18, cy, w * 0.2)
  sideGlowL.addColorStop(0, 'rgba(145,235,255,0.32)')
  sideGlowL.addColorStop(1, 'rgba(145,235,255,0)')
  ctx.fillStyle = sideGlowL
  ctx.fillRect(0, 0, w, h)

  const barCount = 108
  smoothBars(state, audioData, barCount, 0.63, 0.08)
  const baselineY = h * 0.5
  const startX = w * 0.05
  const width = w * 0.9
  const step = width / barCount

  ctx.shadowColor = 'rgba(255,255,255,0.7)'
  ctx.shadowBlur = 10
  ctx.fillStyle = 'rgba(255,255,255,0.96)'
  for (let i = 0; i < barCount; i++) {
    const v = state.smoothedBars[i] || 0
    const amp = Math.pow(v, 1.45) * h * 0.1 + bass * h * 0.028
    const x = startX + i * step
    const bw = Math.max(1.3, step * 0.62)
    ctx.fillRect(x, baselineY - amp, bw, amp * 2)
  }
  ctx.shadowBlur = 0

  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
  ctx.lineWidth = Math.max(1, Math.min(w, h) * 0.0015)
  ctx.beginPath()
  ctx.moveTo(startX, baselineY)
  ctx.lineTo(startX + width, baselineY)
  ctx.stroke()
}

/* ═══════════════════════════════════════════════════════════════
   DATASCAPE — synthwave grid with oscilloscope waveform
   ═══════════════════════════════════════════════════════════════ */
function drawDatascape(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  audioData: AudioData | null, state: DrawState, time: number,
) {
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#04030a')
  bg.addColorStop(0.6, '#06040b')
  bg.addColorStop(1, '#0a0612')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  for (let i = 0; i < 80; i++) {
    const sx = (Math.sin(i * 17.3) * 0.5 + 0.5) * w
    const sy = (Math.cos(i * 9.1) * 0.5 + 0.45) * h * 0.95
    const alpha = 0.12 + Math.sin(time * 0.0013 + i) * 0.08
    ctx.fillStyle = `rgba(255,220,255,${Math.max(0.03, alpha)})`
    ctx.beginPath()
    ctx.arc(sx, sy, 0.9 + (i % 3) * 0.3, 0, Math.PI * 2)
    ctx.fill()
  }

  const horizonY = h * 0.47
  ctx.strokeStyle = 'rgba(206,72,170,0.35)'
  ctx.lineWidth = 1
  for (let i = 0; i < 18; i++) {
    const t = i / 17
    const y = horizonY + (h - horizonY) * Math.pow(t, 1.22)
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }

  const vpX = w / 2
  for (let i = -12; i <= 12; i++) {
    const x = vpX + i * (w * 0.05)
    ctx.beginPath()
    ctx.moveTo(vpX, horizonY)
    ctx.lineTo(x, h)
    ctx.stroke()
  }

  ctx.fillStyle = 'rgba(188,110,175,0.42)'
  ctx.beginPath()
  ctx.moveTo(vpX - w * 0.18, h * 0.86)
  ctx.lineTo(vpX - w * 0.06, horizonY + h * 0.02)
  ctx.lineTo(vpX + w * 0.06, horizonY + h * 0.02)
  ctx.lineTo(vpX + w * 0.18, h * 0.86)
  ctx.closePath()
  ctx.fill()

  const waveCount = 96
  smoothBars(state, audioData, waveCount, 0.66, 0.08)
  const bass = audioData?.bass ?? 0.2
  const waveY = h * 0.445
  const startX = w * 0.09
  const width = w * 0.82
  const step = width / (waveCount - 1)

  ctx.beginPath()
  ctx.moveTo(startX, waveY)
  for (let i = 0; i < waveCount; i++) {
    const t = i / (waveCount - 1)
    const v = state.smoothedBars[i] || 0
    const x = startX + i * step
    const y = waveY - Math.pow(v, 1.45) * h * 0.105 - Math.sin(t * Math.PI * 5.2 + time * 0.0009) * h * 0.005 - bass * h * 0.018
    ctx.lineTo(x, y)
  }
  ctx.lineTo(startX + width, waveY)
  ctx.closePath()
  ctx.fillStyle = 'rgba(255,255,255,0.96)'
  ctx.shadowColor = 'rgba(255,255,255,0.5)'
  ctx.shadowBlur = 9
  ctx.fill()

  ctx.beginPath()
  for (let i = 0; i < waveCount; i++) {
    const t = i / (waveCount - 1)
    const v = state.smoothedBars[i] || 0
    const x = startX + i * step
    const y = waveY - Math.pow(v, 1.45) * h * 0.105 - Math.sin(t * Math.PI * 5.2 + time * 0.0009) * h * 0.005 - bass * h * 0.018
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.strokeStyle = 'rgba(255,150,210,0.5)'
  ctx.lineWidth = Math.max(1, Math.min(w, h) * 0.0014)
  ctx.stroke()
  ctx.shadowBlur = 0
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
  const targetParticles =
    template === 'lucky-clover'
      ? 60
      : template === 'range-of-fire'
        ? 45
        : template === 'snowflake'
          ? 70
          : template === 'pinky-pop'
            ? 80
            : template === 'seven-suns'
              ? 65
              : template === 'chromatic'
                ? 70
                : template === 'jungle-cat'
                  ? 30
                  : template === 'prismatic'
                    ? 55
                    : template === 'datascape'
                      ? 35
                      : 90

  if (!state.initialized || state.particles.length !== targetParticles) {
    state.particles = initParticles(w, h, targetParticles)
    state.orbPulses = []
    state.scanOffset = 0
    state.initialized = true
  }

  if (template === 'lucky-clover') drawLuckyClover(ctx, w, h, audioData, state, time)
  else if (template === 'range-of-fire') drawRangeOfFire(ctx, w, h, audioData, state, time)
  else if (template === 'snowflake') drawSnowflake(ctx, w, h, audioData, state, time)
  else if (template === 'pinky-pop') drawPinkyPop(ctx, w, h, audioData, state, time)
  else if (template === 'seven-suns') drawSevenSuns(ctx, w, h, audioData, state, time)
  else if (template === 'chromatic') drawChromaticSky(ctx, w, h, audioData, state, time)
  else if (template === 'jungle-cat') drawJungleCat(ctx, w, h, audioData, state, time)
  else if (template === 'prismatic') drawPrismatic(ctx, w, h, audioData, state, time)
  else if (template === 'datascape') drawDatascape(ctx, w, h, audioData, state, time)
  else drawCountingStars(ctx, w, h, audioData, state, time)

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
