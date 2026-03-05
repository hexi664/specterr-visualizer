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

function initParticles(w: number, h: number): Particle[] {
  return Array.from({ length: 90 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    size: 1 + Math.random() * 1.6,
    opacity: 0.12 + Math.random() * 0.38,
    speed: 0.12 + Math.random() * 0.25,
  }))
}

function getFreqValue(freq: Uint8Array | undefined, i: number, n: number) {
  if (!freq || freq.length === 0) return 0
  const idx = Math.floor(Math.pow(i / n, 1.25) * freq.length)
  return (freq[Math.min(idx, freq.length - 1)] || 0) / 255
}

function drawParticles(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, state: DrawState, boost = 1) {
  for (const p of state.particles) {
    p.y -= p.speed * boost
    p.x += Math.sin(time * 0.4 + p.y * 0.01) * 0.1
    if (p.y < -6) {
      p.y = h + 6
      p.x = Math.random() * w
    }

    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${p.opacity})`
    ctx.fill()
  }
}

function drawCountingStars(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  audioData: AudioData | null,
  state: DrawState,
  time: number,
) {
  // === Background: multi-layer gradients simulating dreamy pink cloud sky ===
  // Base gradient: coral-pink to lavender-purple
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#f4c2c2')
  bg.addColorStop(0.25, '#e8a0a0')
  bg.addColorStop(0.5, '#d98cb0')
  bg.addColorStop(0.75, '#b07aaa')
  bg.addColorStop(1, '#7a5a7a')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  // Cloud layer 1: large soft glow top-center
  const cloud1 = ctx.createRadialGradient(w * 0.5, h * 0.2, 0, w * 0.5, h * 0.2, w * 0.5)
  cloud1.addColorStop(0, 'rgba(255,220,210,0.45)')
  cloud1.addColorStop(0.5, 'rgba(255,200,200,0.2)')
  cloud1.addColorStop(1, 'rgba(255,200,200,0)')
  ctx.fillStyle = cloud1
  ctx.fillRect(0, 0, w, h)

  // Cloud layer 2: left warmth
  const cloud2 = ctx.createRadialGradient(w * 0.2, h * 0.35, 0, w * 0.2, h * 0.35, w * 0.35)
  cloud2.addColorStop(0, 'rgba(255,200,180,0.3)')
  cloud2.addColorStop(0.6, 'rgba(255,180,170,0.1)')
  cloud2.addColorStop(1, 'rgba(255,180,170,0)')
  ctx.fillStyle = cloud2
  ctx.fillRect(0, 0, w, h)

  // Cloud layer 3: right pink
  const cloud3 = ctx.createRadialGradient(w * 0.75, h * 0.25, 0, w * 0.75, h * 0.25, w * 0.3)
  cloud3.addColorStop(0, 'rgba(255,190,200,0.35)')
  cloud3.addColorStop(0.5, 'rgba(255,170,190,0.12)')
  cloud3.addColorStop(1, 'rgba(255,170,190,0)')
  ctx.fillStyle = cloud3
  ctx.fillRect(0, 0, w, h)

  // Cloud layer 4: center warm glow behind disc
  const cloud4 = ctx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, w * 0.28)
  cloud4.addColorStop(0, 'rgba(255,230,220,0.3)')
  cloud4.addColorStop(1, 'rgba(255,230,220,0)')
  ctx.fillStyle = cloud4
  ctx.fillRect(0, 0, w, h)

  // Cloud layer 5: bottom darker wisps
  const cloud5 = ctx.createRadialGradient(w * 0.4, h * 0.7, 0, w * 0.4, h * 0.7, w * 0.4)
  cloud5.addColorStop(0, 'rgba(180,130,160,0.2)')
  cloud5.addColorStop(1, 'rgba(180,130,160,0)')
  ctx.fillStyle = cloud5
  ctx.fillRect(0, 0, w, h)

  drawParticles(ctx, w, h, time, state)

  const cx = w / 2
  const cy = h * 0.42
  const minDim = Math.min(w, h)
  const discR = minDim * 0.12            // disc ~12% of view
  const ringR = discR + minDim * 0.035   // ring just outside disc
  const waveH = minDim * 0.065           // wave height
  const pointR = minDim * 0.007          // point radius
  const pointCount = 76
  const quarter = pointCount / 4  // 19 unique values, 4-way mirror
  const numLayers = 7
  const separation = minDim * 0.008       // layer separation (scale offset)

  // 7-layer colors: light pink-white → deep coral → magenta
  const layerColors = [
    'rgba(255,245,245,0.9)',   // near-white pink
    'rgba(255,220,220,0.85)',  // light pink
    'rgba(255,190,195,0.8)',   // pink
    'rgba(255,155,165,0.75)',  // medium pink
    'rgba(255,130,130,0.7)',   // coral
    'rgba(255,120,100,0.65)',  // orange-coral
    'rgba(230,80,120,0.6)',    // magenta-pink
  ]

  if (audioData?.beat) state.pulseScale = 1.04
  state.pulseScale += (1 - state.pulseScale) * 0.08
  state.rotation += 0.001

  // Compute 19 unique smoothed frequency values
  for (let i = 0; i < quarter; i++) {
    const val = getFreqValue(audioData?.frequencyData, i, quarter)
    const cur = state.smoothedBars[i]
    state.smoothedBars[i] = val > cur ? cur * 0.4 + val * 0.6 : cur * 0.92 + val * 0.08
  }

  // Build 76 values with 4-way reflection: [0..18, 18..0, 0..18, 18..0]
  const values: number[] = []
  for (let q = 0; q < 4; q++) {
    for (let i = 0; i < quarter; i++) {
      const idx = (q % 2 === 0) ? i : (quarter - 1 - i)
      values.push(state.smoothedBars[idx])
    }
  }

  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(state.pulseScale, state.pulseScale)
  ctx.rotate(state.rotation)

  // === 7 layers, SCALE mode: each layer slightly larger, drawn back-to-front ===
  for (let layer = numLayers - 1; layer >= 0; layer--) {
    const layerScale = 1 + layer * (separation / ringR)
    const color = layerColors[layer]

    ctx.save()
    ctx.scale(layerScale, layerScale)

    // Glow for inner layers (stronger glow on outer layers)
    if (layer > 0) {
      ctx.shadowColor = layerColors[Math.min(layer, 6)]
      ctx.shadowBlur = 4 + layer * 3
    } else {
      ctx.shadowColor = 'rgba(255,220,210,0.6)'
      ctx.shadowBlur = 8
    }

    for (let i = 0; i < pointCount; i++) {
      const a = (i / pointCount) * Math.PI * 2
      const v = values[i]
      const dist = ringR + v * waveH
      const x = Math.cos(a) * dist
      const y = Math.sin(a) * dist
      const r = pointR * (0.6 + v * 0.6)

      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
    }

    ctx.restore()
  }
  ctx.shadowBlur = 0

  // === Center disc: large black with white glow border ===
  ctx.shadowColor = 'rgba(255,255,255,0.5)'
  ctx.shadowBlur = 18
  ctx.beginPath()
  ctx.arc(0, 0, discR, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(10,5,12,0.88)'
  ctx.fill()

  ctx.shadowColor = 'rgba(255,255,255,0.4)'
  ctx.shadowBlur = 12
  ctx.beginPath()
  ctx.arc(0, 0, discR, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'
  ctx.lineWidth = 2.5
  ctx.stroke()
  ctx.shadowBlur = 0

  ctx.restore()
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
  bg.addColorStop(0, '#4a2d6b')
  bg.addColorStop(0.35, '#6f3d8a')
  bg.addColorStop(0.7, '#a05daa')
  bg.addColorStop(1, '#d48fbe')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  const haze = ctx.createRadialGradient(w * 0.35, h * 0.32, 0, w * 0.35, h * 0.32, w * 0.28)
  haze.addColorStop(0, 'rgba(255,220,245,0.28)')
  haze.addColorStop(1, 'rgba(255,220,245,0)')
  ctx.fillStyle = haze
  ctx.fillRect(0, 0, w, h)

  drawParticles(ctx, w, h, time, state, 1.15)
  for (const p of state.particles) {
    const pinkOpacity = Math.min(1, p.opacity * 0.8)
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * 0.85, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,180,232,${pinkOpacity})`
    ctx.fill()
  }

  const cx = w / 2
  const cy = h * 0.43
  const baseR = Math.min(w, h) * 0.115
  const n = 128

  if (audioData?.beat) state.pulseScale = 1.06
  state.pulseScale += (1 - state.pulseScale) * 0.1
  state.rotation += 0.0018
  for (let i = 0; i < n; i++) {
    const val = getFreqValue(audioData?.frequencyData, i, n)
    const cur = state.smoothedBars[i]
    state.smoothedBars[i] = val > cur ? cur * 0.5 + val * 0.5 : cur * 0.9 + val * 0.1
  }

  // multi-layer neon waveform ring (Specterr Pinky Pop vibe)
  for (let layer = 0; layer < 4; layer++) {
    const color = ['#ffffff', '#ffb5e8', '#ff7ac8', '#9ff3ff'][layer]
    const phase = layer * 0.9 + time * 1.8

    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(state.pulseScale, state.pulseScale)
    ctx.rotate(state.rotation * (layer % 2 === 0 ? 1 : -1))

    ctx.beginPath()
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * Math.PI * 2
      const amp = state.smoothedBars[i % n]
      const r = baseR + Math.sin(t * 3 + phase) * (20 + layer * 5) + amp * 65
      const x = Math.cos(t) * r
      const y = Math.sin(t) * r
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.strokeStyle = color
    ctx.lineWidth = layer === 0 ? 3 : 2
    ctx.shadowColor = color
    ctx.shadowBlur = 10
    ctx.stroke()
    ctx.restore()
  }

  // center disc
  ctx.beginPath()
  ctx.arc(cx, cy, baseR * 0.9, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(20,10,25,0.7)'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx, cy, baseR * 0.9, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.lineWidth = 2
  ctx.stroke()
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
  bg.addColorStop(0, '#0c2a28')
  bg.addColorStop(0.4, '#123b35')
  bg.addColorStop(0.75, '#1b4f44')
  bg.addColorStop(1, '#0b1e1c')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  const glow = ctx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, w * 0.34)
  glow.addColorStop(0, 'rgba(178,255,155,0.35)')
  glow.addColorStop(1, 'rgba(178,255,155,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)

  drawParticles(ctx, w, h, time, state, 1.2)

  const cx = w / 2
  const cy = h * 0.42
  const baseR = Math.min(w, h) * 0.14

  if (audioData?.beat) state.pulseScale = 1.07
  state.pulseScale += (1 - state.pulseScale) * 0.12
  state.rotation += 0.0015

  const energy = audioData?.volume || 0
  const wobble = 22 + energy * 70
  const n = 128
  for (let i = 0; i < n; i++) {
    const val = getFreqValue(audioData?.frequencyData, i, n)
    const cur = state.smoothedBars[i]
    state.smoothedBars[i] = val > cur ? cur * 0.4 + val * 0.6 : cur * 0.92 + val * 0.08
  }

  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(state.pulseScale, state.pulseScale)
  ctx.rotate(state.rotation)

  // 4-lobed clover (r = a + b*cos(4t))
  for (let layer = 0; layer < 3; layer++) {
    const lw = 10 - layer * 3
    const color = layer === 0 ? 'rgba(164,255,127,0.9)' : layer === 1 ? 'rgba(130,245,110,0.65)' : 'rgba(230,255,205,0.55)'
    ctx.beginPath()
    for (let i = 0; i <= 360; i++) {
      const t = (i / 360) * Math.PI * 2
      const f = state.smoothedBars[Math.floor((i / 360) * n) % n]
      const r = baseR + (wobble - layer * 8) * Math.cos(4 * t) + f * 40
      const x = Math.cos(t) * r
      const y = Math.sin(t) * r
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fillStyle = layer === 0 ? 'rgba(139,255,127,0.18)' : layer === 1 ? 'rgba(139,255,127,0.12)' : 'rgba(220,255,200,0.08)'
    ctx.fill()
    ctx.strokeStyle = color
    ctx.lineWidth = lw
    ctx.shadowColor = '#8bff7f'
    ctx.shadowBlur = 24 + layer * 6
    ctx.stroke()
  }

  ctx.restore()

  ctx.beginPath()
  ctx.arc(cx, cy, baseR * 0.46, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(15,20,18,0.75)'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx, cy, baseR * 0.46, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.28)'
  ctx.lineWidth = 2
  ctx.stroke()
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
  if (!state.initialized || state.particles.length === 0) {
    state.particles = initParticles(w, h)
    state.initialized = true
  }

  if (template === 'pinky-pop') drawPinkyPop(ctx, w, h, audioData, state, time)
  else if (template === 'lucky-clover') drawLuckyClover(ctx, w, h, audioData, state, time)
  else drawCountingStars(ctx, w, h, audioData, state, time)

  // text overlay (shared)
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
