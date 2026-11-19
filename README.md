# Princess Birthday Surprise

An interactive, mobile-first, three-stage birthday celebration web experience combining a video game–style slingshot archery challenge with progressive portrait reveals, sky fireworks, synthesized music, and candle-lighting animations.

---

## Experience Overview & Stage Flow

### Stage 1 — Interactive Archery Challenge (`src/components/ArcheryStage.tsx`)
A full-viewport (`100dvh`) HTML5 Canvas archery game set in a deep midnight-purple starlit sky.

- **Target Board**: Concentric alternating black-and-white rings surrounding a glowing crimson-red heart bullseye (`28%` of target diameter).
- **Fixed Recurve Bow & Glowing Arrow**:
  - Ornate golden-crimson bow anchored opposite the target (`lower-left → upper-right` on mobile portrait; `left → right` on landscape/desktop).
  - Dynamic bowstring connecting the upper and lower limbs to the arrow nock, flexing with draw distance and snapping back with damped harmonic oscillation upon release.
  - Real-time 26-dot parabolic aiming trajectory preview while pulling back.
- **Physics & Hit Detection**:
  - Supports both desktop mouse and mobile touch (`touch-action: none` prevents accidental page scrolling while aiming).
  - Sub-stepped projectile physics (`8` sub-steps per frame) track the arrow's closest point of approach inside the target board so arrows aimed at the center pass through outer rings and stick directly inside the red bullseye.
  - **Bullseye Hit**: Sticks the arrow into the red center, triggers golden sparkle explosions, expanding shockwaves, rising heart particles, and a harp chime, then transitions smoothly to Stage 2.
  - **Outer Ring / Miss**: Sticks briefly in the outer ring with a subtle board wobble, displays `"Almost there! Try again, my love. 💗"`, and resets the arrow back to the bow without reloading.

---

### Stage 2 — Progressive Birthday Photo Reveal (`src/components/Stage2Reveal.tsx`)
Reveals the first birthday photograph (`public/assets/aistudio/Dreamy_Lavender_No_1_207947a5.png`) in a choreographed three-part sequence out of a dreamy blurred lavender-and-gold bokeh veil—preserving the original face, dress, and `1214:1296` aspect ratio.

1. **Part 1 — Background Reveal**: Soft feathered masks illuminate the floral arch, `"Happy Birthday"` neon backdrop, fairy lights, and balloons first.
2. **Part 2 — Table Reveal**: A bottom-to-top clip-path curtain with a champagne-gold light ribbon unveils the floral table, glowing heart lamp, gift box, and birthday cake.
3. **Part 3 — Portrait Reveal**: A smooth radial bloom with a subtle scale settle brings the birthday girl into crisp focus, framed by face-safe golden sparkles and floating hearts (`RomanticParticles`).
4. **Background Fireworks**: Diwali/wedding-style sky-shot rockets (`FireworksBackdrop`) launch from the bottom and burst across the upper sky for **10 seconds**.
5. **Birthday Letter & Transition**: Displays `"Happy Birthday, My Queen! ❤️"` with animated typography and the `"There's One More Surprise ✨"` button while silently preloading Stage 3.

---

### Stage 3 — Final Birthday Celebration (`src/components/Stage3Celebration.tsx`)
Opens with the second birthday photograph (`public/assets/aistudio/Elegant_Lavender_No_2_43c58fc7.png`) prepared as `public/assets/stage3_unlit.png`, where all **5 cake candles** start completely unlit (`1188:1324` aspect ratio).

- **Initial Scene**: Displays the unlit cake setup, gentle face-safe ambient sparkles, `"Now, it's time to make a wish! 🎂"`, and the glowing `"Celebrate Birthday 🎉"` button. Fireworks remain off until celebration begins.
- **Clicking `"Celebrate Birthday 🎉"`**:
  1. Starts the synthesized *"Happy Birthday to You"* melody (`soundEngine.playHappyBirthdaySong()`).
  2. Ignites all **5 SVG/CSS animated candle flames** (`src/components/CandleFlame.tsx`) one by one (`270ms` stagger) at pixel-calibrated wick coordinates with flickering teardrop cores and radial halos.
  3. Blooms a warm golden glow over the cake and brightens the room decorations.
  4. Launches an **18-second** multi-volley Diwali sky-shot fireworks show (`FireworksBackdrop`) behind the scene.
  5. Fires a full-viewport canvas confetti burst and upward-floating pink/purple hearts.
  6. Reveals `"Happy Birthday, My Love! ❤️"` and a **`Next ✨`** button that transitions to Stage 4.

---

### Stage 4 — Cake-Cutting Moment Together (`src/components/Stage4CakeCutting.tsx`)
Opens with the couple cake-cutting photograph (`public/assets/aistudio/file_00000000380482118e14a795dc0af564_4c8eec04.png`, `1199:1312` aspect ratio).

- **Visuals**: Smooth fade/scale entrance, **10-second** background Diwali fireworks, and face-safe golden sparkles & floating hearts framing the scene without overlapping either face.
- **Message & Replay**: Displays `"Together Forever, My Love! 🎂❤️"` with a heartfelt message and `"Replay Your Little Surprise ↻"` to restart cleanly from Stage 1.

---

## Visual Effects, Audio & Accessibility

- **Diwali / Wedding Sky-Shot Fireworks (`src/components/FireworksBackdrop.tsx`)**:
  - Rockets launch from the bottom with glowing ember trails and burst into wide willow, chrysanthemum, palm, and double-ring cascades with sky-bloom flashes and secondary crackle sparkles.
  - Finite scheduled duration (`10s` on Stage 2 reveal; `18s` on Stage 3 celebration) with clean timer and `requestAnimationFrame` cleanup.
- **Face-Safe Ambient Particles (`src/components/RomanticParticles.tsx`)**:
  - Exclusion zones prevent sparkles and floating hearts from rendering over the portrait's face.
- **Web Audio Synthesizer (`src/utils/soundEngine.ts`)**:
  - Zero external audio file dependencies—synthesizes romantic music-box waltz loops, *"Happy Birthday to You"*, bowstring twangs, target hits, magical chimes, candle sparks, and soft distant firework whistles/pops using the browser Web Audio API.
  - Never autoplays before the first user interaction; includes a persistent **Music On / Off** control.
- **Mobile-First & Accessibility**:
  - `25px` mobile side padding (`px-[25px]`) for large edge-to-edge portrait frames without horizontal overflow (`overflow-x: clip`).
  - Subtle background-matched scrollbar styling in `src/index.css` so vertical scrolling stays smooth and unobtrusive.
  - Respects `prefers-reduced-motion` automatically and provides a top-right **Full Motion / Gentle Motion** toggle.

---

## Project Structure

```text
├── public/
│   └── assets/
│       ├── aistudio/
│       │   ├── Dreamy_Lavender_No_1_207947a5.png    # Stage 2 photo
│       │   └── Elegant_Lavender_No_2_43c58fc7.png   # Stage 3 original reference
│       └── stage3_unlit.png                         # Stage 3 base with 5 candles unlit
├── src/
│   ├── components/
│   │   ├── ArcheryStage.tsx        # Stage 1 canvas archery game & collision physics
│   │   ├── Stage2Reveal.tsx        # Stage 2 3-part progressive photo reveal
│   │   ├── Stage3Celebration.tsx   # Stage 3 candle ignition, confetti & finale
│   │   ├── FireworksBackdrop.tsx   # Sky-shot fireworks canvas engine
│   │   ├── RomanticParticles.tsx   # Face-safe sparkles & floating hearts
│   │   └── CandleFlame.tsx         # Scaled animated SVG/CSS candle flame
│   ├── utils/
│   │   └── soundEngine.ts          # Web Audio music & SFX synthesizer
│   ├── App.tsx                     # 3-stage state machine & audio/motion HUD
│   ├── index.css                   # Tailwind v4, keyframes, scrollbar & motion rules
│   └── main.tsx                    # React root entry point
├── index.html                      # Fonts (Cormorant Garamond, Plus Jakarta Sans) & meta
└── package.json
```

---

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** + **Tailwind CSS v4**
- **Motion (`motion/react`)** for stage transitions and reveal choreography
- **HTML5 Canvas** for archery physics, fireworks, and confetti
- **Web Audio API** for synthesized music and sound effects
- **Lucide React** icons

---

## Running Locally

```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev

# Type-check with TypeScript
npm run lint

# Build for production
npm run build
```
