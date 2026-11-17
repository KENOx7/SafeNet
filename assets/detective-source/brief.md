# CODEX MASTER PROMPT — Şəkil Detektivi / Kids Cyber Safety Game

You are the senior frontend game engineer and game UI art director. Rebuild the provided `onlayn-tehlukesizlik.html` as a coherent, joyful, polished **soft-3D cartoon** children's web game in Azerbaijani. The supplied `index.html` is only a Vite shell, not the actual source of this minigame. Use the attached `sekil_detektivi_yeni.html` as a functional design starting point, not a pixel-perfect requirement.

## Non-negotiable art direction
- Bright, cheerful, soft 3D cartoon look, rounded game controls, approachable detective story; ages roughly 8–13.
- **No photorealism, no pixel-art, no flat clip-art, no emoji-as-environment-art, no sticker collage, no SaaS admin interface.**
- Use the provided `assets/scene_*.webp` for four scene backgrounds; preserve these separately, don't use a complete UI screenshot as a static background.
- `reference/gameplay_concept.png` and `reference/ui_kit_concept.png` are art direction guides only. Recreate interface panels and controls with HTML/CSS/SVG or game components; all labels, values, and controls must be real interactive elements.
- Create one consistent mascot detective cat in a soft 3D cartoon aesthetic (use a properly licensed isolated asset if available, otherwise a cohesive custom vector illustration). It teaches, cheers and gives hints. Don't use emoji as the mascot.

## Preserve actual educational gameplay from source
- Exactly 4 chapters: **Yataq otağı selfisi, Məktəb həyəti, Kompüter masası, Küçədə gəzinti**.
- Goal: detect sensitive personal information in image scenes before sharing.
- Preserve each chapter's two vulnerabilities: bedroom=address & phone; school=school sign & uniform badge; desk=password & email; street=street sign & building number.
- Click an actual visual clue to redact/blur it. The specific clue becomes visibly covered; its checklist becomes checked and progress advances.
- Safe, unrelated objects should not gain points; optionally give short friendly explanations.
- Do not allow sharing before both sensitive clues are hidden. Explain clearly why.
- After a safe share: success feedback, proceed to next chapter. After the last: badge, short practical privacy advice and replay.
- Keep original source content's teaching goal; do not replace this with a phishing quiz or a different game.

## Layout
- Full responsive PC-first game view, with a header HUD, large central visual post/scene, clear mission panel and clue checklist, hint, share action, success and ending screens.
- Desktop 1440×900 and 1366×768 are priorities; tablet layout must also work. Avoid scrolling for the main interaction when feasible.
- Dominant focus is the scene image. Side panels are secondary.
- Make interaction hotspots feel discoverable but not so obvious they give away the answers: subtle hover and inspection reveal. Keyboard access and visible focus states required.
- Use tasteful CSS depth and coherent illustration assets rather than excessive shadows, gradients or glassmorphism.

## Engineering
- If working inside the existing Vite project, convert into React+TypeScript components with typed level data, `GameScene`, `HUD`, `ClueChecklist`, `HintPanel`, `SuccessModal`, and `ResultScreen`; avoid duplicate game rules.
- If maintaining the standalone HTML version, keep it runnable without a build step.
- Store `foundIds` as a Set per level; never award points twice. Update progress, score, redaction, and checklist from a single state model.
- Each hotspot must match its visual clue in the generated background. Adjust locations after viewing actual rendered game; do not blindly trust placeholder coordinates.
- Use CSS pointer interaction for proof of concept; if moving to true 3D models, use Three.js / React Three Fiber as a separate optional phase. **Soft-3D rendering does not itself mean a real-time 3D engine.**
- No API keys, login, backend or AI required for the 7-hour MVP.
- Use accessible Azerbaijani copy and clear feedback. No fake metrics or inaccessible text baked into illustrations.

## Acceptance criteria
1. Every level loads the correct scene and correct two clue targets.
2. Each clue can be redacted once and counts exactly once.
3. Share blocked until both found; success unlocks next level.
4. All 4 levels and final screen complete end-to-end.
5. Can replay and reset; responsive layout no clipped text.
6. No emojis used as substitute for in-game art, no pixel art or photorealistic scene.
7. Inspect the live game visually at 1366×768 and 1440×900, fix overlaps, test keyboard and pointer controls.
8. Run build/lint where available and fix errors.

Implement all changes directly. Start with one complete playable chapter and expand to all four. Do not stop after producing plans or visual mockups.
