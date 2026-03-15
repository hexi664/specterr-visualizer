# 8 New Templates Spec

Project: `/Users/keyyyy/.openclaw/workspace/projects/specterr-visualizer`
Tech: Next.js, Canvas 2D
Core file: `lib/drawVisualizer.ts`

## Existing Templates (keep as-is)
1. `counting-stars` — pink dots, 4-way reflection, cloud sky
2. `lucky-clover` — green organic orb pulse

## New Templates to Add

### 3. `range-of-fire`
- **Background**: Dark teal mountain landscape with layered silhouettes, snow-capped peak center
- **Visualizer**: Orange-yellow flame-like spectrum bars rising from a horizontal orange baseline at mid-height. ~12-15 irregular pointed peaks with neon glow/bloom effect
- **Particles**: White bokeh dots scattered across scene
- **Text**: Artist name + track name lower-left area, white

### 4. `snowflake`
- **Background**: Dreamy blue sky with soft wispy clouds
- **Visualizer**: Central circular black disc (album art placeholder) that pulses with beat
- **Particles**: White stars/sparkles scattered throughout, twinkling
- **Text**: Centered below circle, white uppercase

### 5. `pinky-pop`
- **Background**: Anime-style cherry blossom scene, pink/warm pastels (use gradient approximation, not actual image)
- **Visualizer**: Central pulsing circle with audio reactivity
- **Particles**: Falling cherry blossom petals (pink particles drifting down)
- **Text**: Centered below circle, white

### 6. `seven-suns`
- **Background**: Dark nighttime cityscape with warm amber city lights below
- **Visualizer**: Glowing orange/amber/red dots arranged in curved arc patterns across scene, varying size by frequency
- **Particles**: Warm bokeh dots with atmospheric glow
- **Text**: Centered, white

### 7. `chromatic`
- **Background**: Atmospheric dark teal sky with dramatic clouds
- **Visualizer**: Rainbow/multicolor spectral RING around central circle. Ring has gradient cycling red→orange→yellow→green→blue→purple. Spikes at top/bottom responding to peaks
- **Particles**: White stars in upper area
- **Text**: Centered below circle, white

### 8. `jungle-cat`
- **Background**: Dark moody green/black gradient (no actual cat image)
- **Visualizer**: Horizontal white bar spectrum centered vertically. Bars taller in center, taper to edges. Mix of solid bars (active) and dashed lines (quiet)
- **Particles**: White floating dust motes in upper half
- **Text**: Left-aligned, below visualizer

### 9. `prismatic`
- **Background**: Black with kaleidoscopic mirrored pattern - hot pink/magenta central orb with fractal symmetry, cyan accents
- **Visualizer**: Horizontal white bar spectrum at vertical center, mirrored up/down
- **Particles**: Pink/cyan light streaks radiating from center
- **Text**: Artist top-center, track bottom-center, white bold

### 10. `datascape`
- **Background**: Black upper, lower has retro synthwave pink/magenta wireframe 3D perspective grid receding to horizon
- **Visualizer**: White waveform/oscilloscope at center, jagged peaks and valleys
- **Particles**: White dots in upper dark area
- **Text**: Centered below waveform, white

## Implementation Requirements

1. Add all 8 new TemplateId values to `lib/types.ts`
2. Create `draw<Name>` function for each in `lib/drawVisualizer.ts` (follow existing patterns like `drawCountingStars` and `drawLuckyClover`)
3. Update the main `drawVisualizer` function's template routing (particle counts + if/else chain)
4. Update `app/page.tsx` templateOptions array with all 10 templates + referenceVideo paths
5. All videos already exist in `public/videos/` with kebab-case names (e.g., `range-of-fire.mp4`)
6. Each draw function must use audioData for reactivity (bass, mid, high, volume, frequencyData, beat)
7. Use Canvas 2D API only (no WebGL)
8. Build must pass: `npx next build`

## Style Guide
- Use gradients, glow effects (shadowBlur/shadowColor), alpha blending
- Particle systems with drift/fade
- Audio reactivity: bass → large movements, high → sparkle/shimmer, beat → pulse/flash
- Keep 60fps friendly (no heavy per-frame allocations)
