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
  // 线性渐变天空：青灰 → 蓝灰雾 → 暗色
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#4a6670')
  bg.addColorStop(0.5, '#8a9ea6')
  bg.addColorStop(1, '#2a3a3e')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  // 中间层半透明雾气
  const fogG = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, w * 0.6)
  fogG.addColorStop(0, 'rgba(255,255,255,0.15)')
  fogG.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = fogG
  ctx.fillRect(0, 0, w, h)

  // 底部 1/3 松树剪影（5-7棵）
  const treeBase = h * 0.72
  ctx.fillStyle = '#0a1a15'
  const trees = [
    { x: w * 0.05, tw: w * 0.07, th: h * 0.22 },
    { x: w * 0.18, tw: w * 0.06, th: h * 0.26 },
    { x: w * 0.33, tw: w * 0.08, th: h * 0.20 },
    { x: w * 0.50, tw: w * 0.07, th: h * 0.28 },
    { x: w * 0.65, tw: w * 0.06, th: h * 0.24 },
    { x: w * 0.80, tw: w * 0.08, th: h * 0.21 },
    { x: w * 0.93, tw: w * 0.07, th: h * 0.25 },
  ]
  for (const t of trees) {
    ctx.beginPath()
    ctx.moveTo(t.x - t.tw, treeBase)
    ctx.bezierCurveTo(t.x - t.tw * 0.6, treeBase - t.th * 0.4, t.x - t.tw * 0.3, treeBase - t.th * 0.7, t.x, treeBase - t.th)
    ctx.bezierCurveTo(t.x + t.tw * 0.3, treeBase - t.th * 0.7, t.x + t.tw * 0.6, treeBase - t.th * 0.4, t.x + t.tw, treeBase)
    ctx.closePath()
    ctx.fill()
  }
  ctx.fillRect(0, treeBase, w, h - treeBase)

  drawParticles(ctx, w, h, time, state, { boost: 0.6, color: [255, 255, 255], sizeScale: 1.3, twinkle: 0.4 })

  const cx = w / 2
  const cy = h * 0.42
  const minDim = Math.min(w, h)
  const discR = minDim * 0.12
  const n = 120

  if (audioData?.beat) state.pulseScale = 1.06
  state.pulseScale += (1 - state.pulseScale) * 0.1
  state.rotation += 0.002

  smoothBars(state, audioData, n, 0.55, 0.1)

  const bass = audioData?.bass ?? 0

  // 火焰日冕 - 3层有机火焰
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(state.pulseScale, state.pulseScale)
  ctx.globalCompositeOperation = 'lighter'

  const flameLayers = [
    { scale: 1.15, offset: 0.3, baseFlame: minDim * 0.04, waveH: minDim * 0.14 },
    { scale: 1.05, offset: 0.7, baseFlame: minDim * 0.03, waveH: minDim * 0.11 },
    { scale: 1.0,  offset: 0.0, baseFlame: minDim * 0.02, waveH: minDim * 0.08 },
  ]

  for (const layer of flameLayers) {
    // 计算120个点的距离
    const pts: { x: number; y: number }[] = []
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + layer.offset
      const sample = state.smoothedBars[i]
      const noise = Math.sin(a * 7 + time * 3.5) * 0.2 + Math.cos(a * 13 - time * 2.1) * 0.15 + Math.sin(a * 23 + time * 5.2) * 0.1
      const dist = (discR + layer.baseFlame + sample * layer.waveH + bass * minDim * 0.03) * (1 + noise) * layer.scale
      pts.push({ x: Math.cos(a) * dist, y: Math.sin(a) * dist })
    }

    // 用 quadraticCurveTo 连接
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 0; i < n; i++) {
      const next = pts[(i + 1) % n]
      const cur = pts[i]
      const midX = (cur.x + next.x) / 2
      const midY = (cur.y + next.y) / 2
      ctx.quadraticCurveTo(cur.x, cur.y, midX, midY)
    }
    ctx.closePath()

    // 火焰颜色渐变
    const grad = ctx.createRadialGradient(0, 0, discR * 0.9, 0, 0, discR + layer.waveH * 1.5)
    grad.addColorStop(0, 'rgba(255,240,180,0.95)')
    grad.addColorStop(0.4, 'rgba(255,160,50,0.85)')
    grad.addColorStop(1, 'rgba(200,40,20,0.7)')
    ctx.fillStyle = grad
    ctx.shadowColor = 'rgba(255,160,50,0.8)'
    ctx.shadowBlur = 20
    ctx.fill()
  }

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
  // 线性渐变天空：深蓝 → 紫 → 金橙夕阳
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#1a2040')
  bg.addColorStop(0.5, '#4a3060')
  bg.addColorStop(1, '#e8a040')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  // 地平线暖光
  const sunGlow = ctx.createRadialGradient(w * 0.5, h * 0.85, 0, w * 0.5, h * 0.85, w * 0.5)
  sunGlow.addColorStop(0, 'rgba(255,180,60,0.3)')
  sunGlow.addColorStop(1, 'rgba(255,180,60,0)')
  ctx.fillStyle = sunGlow
  ctx.fillRect(0, 0, w, h)

  // 右侧悬崖剪影
  ctx.fillStyle = '#0a0a15'
  ctx.beginPath()
  ctx.moveTo(w * 0.6, h)
  ctx.lineTo(w * 0.6, h * 0.62)
  ctx.lineTo(w * 0.65, h * 0.58)
  ctx.lineTo(w * 0.72, h * 0.55)
  ctx.lineTo(w * 0.78, h * 0.56)
  ctx.lineTo(w * 0.82, h * 0.6)
  ctx.lineTo(w * 0.85, h * 0.58)
  ctx.lineTo(w * 0.9, h * 0.62)
  ctx.lineTo(w, h * 0.7)
  ctx.lineTo(w, h)
  ctx.closePath()
  ctx.fill()

  // 悬崖顶上2个小人影
  const fy = h * 0.54
  for (const fx of [w * 0.70, w * 0.74]) {
    ctx.fillStyle = '#0a0a15'
    ctx.beginPath()
    ctx.arc(fx, fy - 6, 2.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(fx - 1.5, fy - 4, 3, 8)
  }

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

  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(state.pulseScale, state.pulseScale)
  ctx.rotate(state.rotation)
  ctx.globalCompositeOperation = 'lighter'

  // 128个尖刺星爆
  const spikeCount = 128
  const baseSpikeLen = minDim * 0.03
  const maxSpikeLen = minDim * 0.15

  for (let i = 0; i < spikeCount; i++) {
    const a = (i / spikeCount) * Math.PI * 2
    const sample = state.smoothedBars[i % n]
    const spikeLen = discR + baseSpikeLen + sample * maxSpikeLen
    const tipX = Math.cos(a) * spikeLen
    const tipY = Math.sin(a) * spikeLen
    const baseW = minDim * 0.003
    const perpA = a + Math.PI / 2
    const bx = Math.cos(a) * (discR + 2)
    const by = Math.sin(a) * (discR + 2)

    ctx.beginPath()
    ctx.moveTo(bx + Math.cos(perpA) * baseW, by + Math.sin(perpA) * baseW)
    ctx.lineTo(tipX, tipY)
    ctx.lineTo(bx - Math.cos(perpA) * baseW, by - Math.sin(perpA) * baseW)
    ctx.closePath()

    const spikeGrad = ctx.createLinearGradient(bx, by, tipX, tipY)
    spikeGrad.addColorStop(0, 'rgba(255,255,255,0.95)')
    spikeGrad.addColorStop(1, 'rgba(100,200,255,0.7)')
    ctx.fillStyle = spikeGrad
    ctx.shadowColor = 'rgba(100,180,255,0.8)'
    ctx.shadowBlur = 15
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
  // 线性渐变天空：深紫 → 紫 → 暖棕橙 → 琥珀橙
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#1a0a30')
  bg.addColorStop(0.33, '#3a1560')
  bg.addColorStop(0.66, '#804020')
  bg.addColorStop(1, '#e08030')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  // 天空中几缕云
  for (let i = 0; i < 3; i++) {
    const cy2 = h * (0.2 + i * 0.12)
    const cg = ctx.createRadialGradient(w * (0.25 + i * 0.22), cy2, 0, w * (0.25 + i * 0.22), cy2, w * 0.25)
    cg.addColorStop(0, `rgba(200,150,180,${0.12 - i * 0.02})`)
    cg.addColorStop(1, 'rgba(200,150,180,0)')
    ctx.fillStyle = cg
    ctx.fillRect(0, 0, w, h)
  }

  // 浮空岩石剪影（中下偏左）
  ctx.fillStyle = '#0a0810'
  ctx.beginPath()
  ctx.moveTo(w * 0.15, h * 0.72)
  ctx.bezierCurveTo(w * 0.18, h * 0.62, w * 0.25, h * 0.58, w * 0.32, h * 0.60)
  ctx.bezierCurveTo(w * 0.38, h * 0.57, w * 0.42, h * 0.60, w * 0.45, h * 0.65)
  ctx.bezierCurveTo(w * 0.43, h * 0.72, w * 0.35, h * 0.76, w * 0.25, h * 0.75)
  ctx.closePath()
  ctx.fill()

  // 岩石上2个人影
  const fy2 = h * 0.56
  for (const fx of [w * 0.30, w * 0.35]) {
    ctx.fillStyle = '#0a0810'
    ctx.beginPath()
    ctx.arc(fx, fy2 - 6, 2.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(fx - 1.5, fy2 - 4, 3, 8)
  }

  drawParticles(ctx, w, h, time, state, { boost: 0.7, color: [255, 255, 255], sizeScale: 1.1, twinkle: 0.4 })

  const cx = w / 2
  const cy = h * 0.4
  const minDim = Math.min(w, h)
  const discR = minDim * 0.12
  const n = 64

  if (audioData?.beat) state.pulseScale = 1.05
  state.pulseScale += (1 - state.pulseScale) * 0.1
  state.rotation += 0.0008

  smoothBars(state, audioData, n, 0.55, 0.1)

  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(state.pulseScale, state.pulseScale)
  ctx.rotate(state.rotation)
  ctx.globalCompositeOperation = 'lighter'

  // 64根径向频谱条
  const barCount = 64
  const ringR = discR + 4
  const maxBarLen = minDim * 0.14

  for (let i = 0; i < barCount; i++) {
    const a = (i / barCount) * Math.PI * 2
    const sample = state.smoothedBars[i]
    const barLen = sample * maxBarLen + minDim * 0.005
    const barWidth = (2 * Math.PI * ringR / barCount) * 0.7

    ctx.save()
    ctx.rotate(a)
    ctx.fillStyle = 'rgba(180,80,220,0.9)'
    ctx.shadowColor = 'rgba(200,100,255,0.7)'
    ctx.shadowBlur = 12
    ctx.fillRect(ringR, -barWidth / 2, barLen, barWidth)
    ctx.restore()
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
  // 极暗蓝黑 → 深蓝海军
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#050815')
  bg.addColorStop(1, '#0a1525')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  // 建筑群 - 透视效果：向中心收窄
  const vanishX = w * 0.5
  const leftBuildings = [
    { x: 0, bw: w * 0.10, bh: h * 0.70 },
    { x: w * 0.08, bw: w * 0.09, bh: h * 0.55 },
    { x: w * 0.16, bw: w * 0.08, bh: h * 0.80 },
    { x: w * 0.23, bw: w * 0.06, bh: h * 0.50 },
  ]
  const rightBuildings = [
    { x: w * 0.65, bw: w * 0.07, bh: h * 0.55 },
    { x: w * 0.71, bw: w * 0.10, bh: h * 0.75 },
    { x: w * 0.80, bw: w * 0.08, bh: h * 0.60 },
    { x: w * 0.87, bw: w * 0.13, bh: h * 0.85 },
  ]
  const allBuildings = [...leftBuildings, ...rightBuildings]

  // Use deterministic seed based on building index for windows
  for (let bi = 0; bi < allBuildings.length; bi++) {
    const b = allBuildings[bi]
    const by = h - b.bh
    // 透视：左侧楼右边界向中心倾斜，右侧楼左边界向中心倾斜
    const isLeft = b.x + b.bw / 2 < vanishX
    const skew = isLeft ? (vanishX - (b.x + b.bw)) * 0.02 : ((b.x) - vanishX) * -0.02

    ctx.fillStyle = '#0a0f1a'
    ctx.beginPath()
    ctx.moveTo(b.x, h)
    ctx.lineTo(b.x + skew, by)
    ctx.lineTo(b.x + b.bw + skew, by)
    ctx.lineTo(b.x + b.bw, h)
    ctx.closePath()
    ctx.fill()

    // 霓虹灯带
    const neonColors = ['rgba(0,220,255,0.6)', 'rgba(255,50,180,0.5)']
    for (let j = 0; j < 3; j++) {
      const ny = by + b.bh * (0.2 + j * 0.3)
      ctx.fillStyle = neonColors[j % 2]
      ctx.fillRect(b.x + 2, ny, b.bw - 4, 1.5)
    }

    // 小方块灯（用确定性伪随机）
    for (let wy = by + 8; wy < h - 8; wy += 14) {
      for (let wx = b.x + 4; wx < b.x + b.bw - 4; wx += 9) {
        const seed = (bi * 1000 + wy * 31 + wx * 17) % 100
        if (seed > 45) {
          ctx.fillStyle = seed % 2 === 0 ? 'rgba(0,180,255,0.15)' : 'rgba(255,50,180,0.1)'
          ctx.fillRect(wx, wy, 3, 2.5)
        }
      }
    }
  }

  // 左侧垂直粉色霓虹光柱
  ctx.save()
  ctx.shadowColor = 'rgba(255,50,180,0.6)'
  ctx.shadowBlur = 20
  ctx.fillStyle = 'rgba(255,50,180,0.4)'
  ctx.fillRect(w * 0.14, h * 0.1, w * 0.015, h * 0.7)
  ctx.restore()

  // 底部地面反光
  const groundGrad = ctx.createLinearGradient(0, h * 0.85, 0, h)
  groundGrad.addColorStop(0, 'rgba(0,100,150,0.15)')
  groundGrad.addColorStop(1, 'rgba(0,50,80,0)')
  ctx.fillStyle = groundGrad
  ctx.fillRect(0, h * 0.85, w, h * 0.15)

  drawParticles(ctx, w, h, time, state, { boost: 0.5, color: [100, 200, 255], sizeScale: 0.8, twinkle: 0.5 })

  const cx = w / 2
  const cy = h * 0.42
  const minDim = Math.min(w, h)
  const discR = minDim * 0.14
  const n = 128

  if (audioData?.beat) state.pulseScale = 1.08
  state.pulseScale += (1 - state.pulseScale) * 0.1
  state.rotation += 0.001

  smoothBars(state, audioData, n, 0.5, 0.1)

  const bass = audioData?.bass ?? 0

  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(state.pulseScale, state.pulseScale)
  ctx.globalCompositeOperation = 'lighter'

  // 脉冲光环 - 霓虹青
  const ringR2 = discR + minDim * 0.02
  const ringWidth = minDim * 0.008 + bass * 8

  ctx.beginPath()
  ctx.arc(0, 0, ringR2, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(0,200,255,0.7)'
  ctx.lineWidth = ringWidth
  ctx.shadowColor = 'rgba(0,180,255,0.9)'
  ctx.shadowBlur = 20 + bass * 15
  ctx.stroke()

  // 外层粉色淡环
  ctx.beginPath()
  ctx.arc(0, 0, ringR2 + minDim * 0.015, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,50,180,0.3)'
  ctx.lineWidth = minDim * 0.004
  ctx.shadowColor = 'rgba(255,50,180,0.5)'
  ctx.shadowBlur = 10
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
