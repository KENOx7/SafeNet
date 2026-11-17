# CODEX MASTER PROMPT — REAL YOXSA AI? / KIBER TULKU

You are a senior PC game UI engineer, visual designer, frontend developer, and educational game designer. Work directly in the supplied project folder, with the files:

- `source/original_texnologiya.html` — original six-round game and its intended mechanics
- `index.html` / `real_yoxsa_ai_yeni.html` — updated fully playable prototype
- `assets/cases/` — 12 game images, both SVG editable and PNG 720x720
- `assets/ui/` — original game mascot illustration and 3D-cartoon mascot asset
- `reference/desktop_game.png` etc. — SCREENSHOTS OF THE ACTUALLY RENDERED PROTOTYPE
- `reference/art_direction_game_concept.png` and `reference/art_direction_ui_kit.png` — VISUAL CONCEPTS ONLY

## Primary objective

Produce a fully playable, high-quality, responsive, child-friendly PC/browser game titled **Real yoxsa AI?**, based on the actual mechanics of `texnologiya.html`. This is not a copywriting request or a request for another static mockup. Implement changes in the actual application.

## Visual identity

- Kid-friendly **soft 3D cartoon** styling with an expressive fox detective mascot.
- The game should feel like a proper PC game, not a mobile quiz enlarged to desktop, and not an AI-generated SaaS dashboard.
- Playful but curated composition, short and clear Azerbaijani labels, readable typography, consistent art direction.
- Pastel indigo/lavender background, punchy green/red decisions, yellow rewards, subtle depth, glossy illustrated surfaces.
- No pixel art, no emoji sticker walls, no copied commercial game UI, no excessive unrelated decoration.
- Use existing provided assets. Where quality needs improvement, create coherent replacement art, not arbitrary emoji or stock pictures.
- All UI labels should be live DOM text, NOT text baked into background screenshots.
- Do NOT use the reference screenshot itself as a full-screen background with invisible clickable hotspots.

## Required screens

1. Intro — animated Kiber Tülkü, title, 3 short things to notice, start button.
2. Main game — fullscreen-ish desktop game stage with HUD, central draggable image-card, helper mascot, small investigation hint panel, two prominent choice buttons.
3. Feedback — correct/incorrect result with actual explanation grounded in the displayed card's known truth, continue button.
4. Final report — final 0–6 score from real decisions, 2–3 accurate safety learnings, replay button.
5. Rules/settings popup — mouse, touch, keyboard, optional mute.

## Mechanics — preserve, do not simplify

- Exactly six subjects: cat, child playing soccer, mountain landscape, house, dog, birthday cake.
- Each subject can display either normal or intentionally anomalous variant.
- Shuffle subjects and ensure exactly three normal and three anomalous each game, or preserve existing equivalent balancing.
- Left swipe/ArrowLeft/red button = AI (the intentionally anomalous training variant).
- Right swipe/ArrowRight/green button = normal reference.
- Prevent double-submission, locked card while feedback is open, show feedback, advance to next round.
- One point per correct response, final score 0–6, robust restart.
- Responsive design: 1920×1080, 1440×900, 1366×768, and mobile 390×844.
- Offline play must be supported; all critical asset files must be served locally.

## Implementation and assets

- Start by opening `index.html` and inspect the running result. Use Playwright/Browser screenshots for visual QA.
- Treat existing `assets/cases/*.png` and `.svg` as **real assets to use**, not suggestions.
- Keep the editable SVG files in the project. Feel free to develop a reusable React/TypeScript component architecture IF it improves maintainability and there is time; the simple HTML prototype is already playable, do not break it for a needless rewrite.
- Use CSS 2.5D depth effects, responsive UI layers, and restrained transitions. No need for Phaser, WebGL, Three.js, or a real-time 3D renderer for this particular drag-and-decide game.
- The Kiber Tülkü asset can be animated subtly with CSS. Respect prefers-reduced-motion.
- Avoid CORS issues and broken asset paths in deployment.
- Ensure keyboard access and text readability. Button focus states must work.

## Educational accuracy

The supplied images are custom cartoon illustrations, NOT verified authentic photos. Both normal and anomalous versions are authored as educational simulations. Do not claim that the normal cartoon images are real photographs or that the anomalous images were necessarily created by an external AI model.

The game's original AI/REAL classification refers to a simplified training category: normal vs obviously impossible/anomalous. Keep an unintrusive clear label explaining this limitation. For a scientifically valid AI-image detection lesson, use documented authentic photos and known-provenance AI generations from trusted sources, with appropriate usage rights, and change feedback accordingly.

Avoid telling children that all AI images necessarily contain extra fingers, misshapen objects, or scrambled text. Encourage source verification and critical evaluation.

## QA and acceptance criteria

- No console errors, no broken image paths, no placeholder buttons.
- All 12 PNG case assets referenced correctly.
- All 6 rounds finish, final score accurate.
- Mouse drag, touch swipe, ArrowLeft/ArrowRight, on-screen buttons work.
- No duplicate score from repeated clicks or double pointer events.
- Wrong answers produce the correct corresponding explanation.
- Rules popup, mute, restart fully operational.
- Layout fits desktop without horizontal scroll and looks good on narrow phones.
- Screenshots of actual implementation compared against reference concept: cohesive visual quality, no pixel-art or sticker look.

## Delivery

Implement directly; do not stop at a plan. When done, report modified files, how to run, what passed QA, and outstanding limitations. Do not invent results.
