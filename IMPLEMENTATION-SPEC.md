# 5 Templates Implementation Spec (Based on Specterr Recordings)

## Reference Videos
All in `tmp/specterr-recordings/*.mp4`. Frame extracts in `/tmp/specterr-frames/`.

---

## Template 1: Counting Stars
**Source**: Specterr editor parameter extraction (browser inspection)

### Visual
- Central **black disc** with user image/logo
- **76 POINT dots** (small circles) arranged radially around the disc
- **4-WAY reflection** (top/bottom/left/right symmetry)
- **7 concentric wave layers** in SCALE mode (inner smaller, outer larger)
- Each dot's distance from center reacts to audio frequency

### Colors & Effects
- Dots: soft **pink/white** with glow
- **Inner glow**: blur=2, scale=29
- **Fire effect**: intensity=10 (warm orange-pink flickering around edges)
- **Shadow**: pink, blur=29, opacity=1
- Background: **multi-layer radial gradient** simulating pink/purple sunset clouds

### Parameters
- discR = minDim * 0.12
- ringR = discR + minDim * 0.035
- waveH = minDim * 0.065
- pointR = minDim * 0.007
- Shape=CIRCLE, Style=POINT, PointCount=76
- Smooth=ON, Diameter=30, ImageSize=95, WaveHeight=37, Separation=50

---

## Template 2: Pinky Pop
**Source**: Recording frames (pinky-pop_sec05.jpg, pinky-pop_end.jpg)

### Visual
- Central **black disc** with ghost/logo icon (white on black)
- **Fiery radial glow ring** emanating from disc edge — NOT bars, but a continuous flame-like corona
- Spiky, organic, **fire/corona effect** around the circle that reacts to audio
- Spike heights vary with frequency amplitude — taller spikes = louder frequencies

### Colors & Effects
- Core glow: **bright yellow-white** nearest disc edge
- Mid ring: **intense orange/amber**
- Outer edges: **deep red/crimson**
- Overall: solar eclipse corona appearance
- **White bokeh particles** floating across scene (snow/ember-like, varying sizes)
- Particles have subtle glow, drift slowly

### Background
- **Misty forest landscape**: dark silhouetted conifer trees along bottom
- **Cool blue-gray fog/mist** filling mid-ground
- Upper sky: gradient from teal-gray to lighter fog
- Heavily desaturated, moody, ethereal — **contrasts with warm ring**
- Subtle vignetting at corners

### Text
- Artist name in white, centered below ring
- Track name in white italic, smaller, below artist

---

## Template 3: Lucky Clover  
**Source**: Recording frame (lucky-clover_sec07.jpg)

### Visual
- Central **black disc** with ghost/logo icon
- **Radial starburst/sunburst** of audio-reactive spikes emanating 360° from disc
- Spikes extend outward, lengths vary by frequency amplitude
- Creates an uneven, organic corona pattern

### Colors & Effects
- Spikes: **bright white core** transitioning to **cyan/electric blue** at edges
- **Bloom/soft glow** effect — luminous halo around entire visualization
- Strong blue glow bleeds outward

### Background
- **Dramatic cliff/floating rock** formation — fantasy landscape
- **Two small human silhouettes** standing on top of cliff
- **Golden/amber sunset** sky — warm yellow-orange at horizon
- Dark shadows and deep blues below cliff
- Epic, atmospheric, fantasy mood

### Text
- "Dabin feat. Conor Byrne" centered below ring
- "Rings & Roses (Anki Remix)" below

---

## Template 4: Petal Dance
**Source**: Recording frames (petal-dance_02.jpg, petal-dance_03.jpg)

### Visual
- Central **black disc** with ghost/logo
- **Radial frequency bars** emanating outward from disc perimeter in 360°
- Bars vary in length representing frequency amplitude
- Creates a circular spectrum analyzer effect

### Colors & Effects
- Bars: **purple/violet/magenta** color palette, glowing with luminosity
- Purple-pink radial glow around the visualization

### Background
- **Fantasy/surreal landscape**:
  - **Floating rock/island** in lower-center-left — jagged dark landmass suspended in air
  - **Two silhouetted human figures** on the floating rock
  - **Dramatic sky**: warm orange/amber at horizon → deep purple/indigo above
  - Layered clouds with warm-to-cool gradient

### Particles
- **White dots/particles** scattered across entire scene
- Varying sizes — tiny pinpoints to slightly larger glowing dots
- Float and drift — snow-like or dust-like ambient field
- Subtle glow/bloom effect

### Text
- Artist name and track name centered below circle

---

## Template 5: Stardust Sky
**Source**: Recording frames (stardust-sky_sec06.jpg, stardust-sky_end.jpg)

### Visual
- Central **black disc** (~15-18% of canvas width) with ghost/logo
- Circle may have subtle **glow/pulse** effect reacting to audio
- Possibly radial bars or just pulsing ring

### Colors & Effects
- **Dominant**: Electric/neon **cyan and bright blue**
- **Accent**: Hot **magenta/pink** neon strips
- Deep **teal and turquoise** ambient tones
- Dark navy/black shadows
- Heavy **blue-magenta split toning**
- **Bloom/glow** on neon light sources

### Background
- **Cyberpunk/futuristic cityscape** — tall angular buildings/skyscrapers
- **One-point perspective** — urban canyon/corridor drawing eye to center
- **Neon signs and geometric light panels** in architecture
- **Pink vertical neon beam** on left side
- **Atmospheric haze/fog** between buildings for depth
- Dark/nighttime with artificial illumination

### Text
- "ARTIST NAME" in bold white uppercase below circle
- "TRACK NAME" in lighter/smaller white text below

---

## Implementation Notes

### Common Elements
1. All templates have a **central black disc** for logo/art
2. All have **text overlay** (artist + track name) below center
3. All use **radial audio visualization** of some kind
4. All should support **user-uploaded cover image** in the disc

### Background Approach
- Use **CSS/Canvas gradients + procedural generation** (no copyrighted images)
- Counting Stars: pink/purple radial gradient clouds
- Pinky Pop: paint dark trees silhouette + fog layers + gradient sky
- Lucky Clover: paint cliff silhouette + sunset gradient sky
- Petal Dance: paint floating island silhouette + purple-orange gradient sky
- Stardust Sky: paint geometric buildings + neon lines + gradient sky

### Audio Reactivity
- Use `frequencyData` (FFT) for bar/spike heights
- Use `bass`/`volume` for overall pulse/glow intensity
- Use `beat` detection for particle bursts or flash effects

### File Changes Required
1. `lib/drawVisualizer.ts` — rewrite all 5 draw functions
2. `lib/types.ts` — already has all 5 template IDs ✅
3. `app/page.tsx` — update subtitles to match actual visuals
4. `components/Visualizer.tsx` — no changes needed (RAF loop is generic)
