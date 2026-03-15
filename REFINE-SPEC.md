# Template Refinement Spec

## Goal
Refine ALL 8 new templates to EXACTLY match the reference videos. Each template's visualizer effect AND background must closely replicate the Specterr original.

## Reference frames location
`/tmp/specterr-ref/<template>-{1,3,5}s.jpg` — 3 frames per template at 1s, 3s, 5s

## Reference videos location
`/Users/keyyyy/.openclaw/workspace/projects/specterr-visualizer/public/videos/<template>.mp4`

## Project path
`/Users/keyyyy/.openclaw/workspace/projects/specterr-visualizer`

## Key files
- `lib/drawVisualizer.ts` — ALL draw functions live here
- `lib/types.ts` — TemplateId type
- `app/page.tsx` — template list with names + reference video paths

## Current template functions to refine (in drawVisualizer.ts)
- `drawRangeOfFire` — should have flame bars over teal mountain landscape
- `drawSnowflake` — dreamy blue sky, pulsing disc, twinkling particles
- `drawPinkyPop` — anime cherry blossom bg, falling petals, pulsing disc
- `drawSevenSuns` — nighttime cityscape, glowing amber/orange frequency dots in arc patterns
- `drawChromaticSky` — teal sky, rainbow ring around disc with frequency spikes
- `drawJungleCat` — dark green moody, horizontal white bar spectrum
- `drawPrismatic` — kaleidoscope fractal, pink/magenta orb, horizontal white bars
- `drawDatascape` — black + synthwave pink wireframe grid, oscilloscope waveform

## Requirements
1. Study the reference frames carefully
2. The visualizer element (bars, rings, dots, waveforms) must match the reference style
3. The background must match (mountains, city, sky, grid, etc.)
4. All effects must be audio-reactive using audioData (bass, mid, high, volume, frequencyData, beat)
5. Canvas 2D only, 60fps friendly
6. After changes, run `npx next build` to verify

## Existing helper functions available
- `drawCenterDisc(ctx, cx, cy, r, opts)` — draws disc with glow
- `smoothBars(state, audioData, count, smoothing, decay)` — smooths frequency data
- `drawParticles(ctx, w, h, time, state, opts)` — particle system
- `rainbowColorAt(i, total)` — rainbow color for index
- `initParticles(w, h, count)` — init particle array

## DO NOT change
- `drawCountingStars` and `drawLuckyClover` — these are already approved
- Template routing in `drawFrame` — already correct
- `app/page.tsx` — already correct
