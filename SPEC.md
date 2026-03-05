# Specterr Visualizer Clone - Technical Spec

## Goal
Replicate Specterr.com's "Counting Stars" music visualizer template EXACTLY.

## Tech Stack
- Next.js 14 (App Router)
- HTML5 Canvas 2D (NOT WebGL/Three.js)
- Web Audio API (FFT analysis)
- Tailwind CSS

## Project Structure
```
app/
  layout.tsx          - Root layout with Tailwind
  page.tsx            - Main page: upload audio + visualizer preview
  globals.css         - Tailwind + global styles
components/
  Visualizer.tsx      - Canvas-based circular spectrum visualizer
  AudioUploader.tsx   - Audio file upload component
  TextOverlay.tsx     - Artist name + song title overlay
lib/
  audioAnalyzer.ts    - Web Audio API analyzer wrapper
  drawVisualizer.ts   - Canvas drawing functions
  types.ts            - Shared types
public/
  sample.mp3          - Demo audio file
```

## Visual Spec (Counting Stars - from Specterr screenshots)

### Background
- Soft dreamy pastel gradient
- Colors: #e8b4b8 → #dba6b0 → #c9a0aa → #b08090 → #967080
- Radial glow at center: rgba(255, 220, 210, 0.3)
- Overall: warm, hazy, sunset/dawn sky feel

### Circular Visualizer
- Canvas center: 50% width, 42% height (slightly above center)
- Inner circle radius: 80px (dark, semi-transparent, for logo/art)
- Inner circle color: rgba(30, 15, 25, 0.65)
- Inner ring border: 2px white, opacity 0.25
- Bar count: 128
- Bar width: 2px
- Bar color: white (#ffffff), opacity 0.7-1.0 (based on amplitude)
- Bar max length: 60px
- Bar min length: 3px
- Bars radiate outward from inner circle edge
- Bars arranged in full 360° circle
- Entire visualizer rotates slowly: ~0.1 deg/frame

### Frequency Mapping
- FFT size: 2048
- Use logarithmic scale: more bars for low frequencies
- Smoothing: 0.85 (Web Audio smoothingTimeConstant)
- Additional lerp smoothing per bar: 0.2 factor
- On beat: slight scale pulse 1.0 → 1.04 over 150ms

### Particles
- 80 small white dots scattered across canvas
- Size: 1-2px
- Opacity: 0.2-0.5
- Slow upward drift: 0.2px/frame
- Slight horizontal wobble: sin(time) * 0.1

### Text
- Position: centered, below visualizer (75% of canvas height)
- Artist name: 11px, uppercase, letter-spacing 3px, white opacity 0.75
- Song title: 28px, font-weight 300, white opacity 0.9
- Subtle text shadow for readability

### Animation Loop
```
requestAnimationFrame loop:
  1. Clear canvas
  2. Draw background gradient
  3. Draw particles (update positions)
  4. Get frequency data from analyzer
  5. Draw circular bars (with smoothing)
  6. Draw center circle
  7. Apply rotation transform
  8. Draw text overlay
```

### Beat Detection
- Compare current bass energy (0-200Hz) to rolling average
- If current > average * 1.4 → beat detected
- On beat: scale visualizer 1.04x, decay back over 150ms

## Implementation Notes
- Use Canvas 2D context, NOT WebGL
- Visualizer must be responsive (resize with window)
- Audio upload: accept MP3, WAV, FLAC, OGG
- Include a "use sample audio" button
- Dark UI chrome around the canvas (minimal)
- The canvas itself should be the main focus (near full screen)
