# SafeNet — Kiber oyunlar

SafeNet opens with a PC boot animation and a welcome screen. Launch **Network Defense**, **Kiber Qalxan Junior**, **Şəkil Detektivi**, **Real yoxsa AI?**, or **Fişinq Ovçusu** from the desktop icons, and return using **SafeNet** in the top bar. Open sessions remain available in the taskbar. A Network Defense wave pauses while its app is hidden.

## Run locally

Use Node.js 24 and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Direct app links use `?app=network`, `?app=junior`, `?app=detective`, `?app=real-ai`, and `?app=phishing-hunter`.

Select the fullscreen control to enter or exit browser fullscreen.

## Environment variables

Copy `.env.example` to `.env.local` and fill in the provider keys you use. Restart Vite after changing the file.

| Variable | Purpose |
| --- | --- |
| `GROQ_API_KEY` | Groq-generated introductions for the ten Fişinq Ovçusu letters in each new run. |
| `GROQ_MODEL` | Groq model. Defaults to `openai/gpt-oss-20b`. |
| `XAI_API_KEY` | Optional Grok coaching tips after a Fişinq Ovçusu decision. |
| `XAI_MODEL` | Grok model. Defaults to `grok-4.7`. |

For a hosted build, set the same variables in the hosting platform's server environment. Live mail and coaching require the `/api/ai` handlers. A static-only deployment uses the built-in mail and hints. Keep the actual keys in `.env.local` or the hosting environment.

## Network Defense demo walkthrough

1. Open **Network Defense**. Choose **Trafik filtri**, then click **Giriş** to protect the first route.
2. Start the wave and watch ordinary traffic pass. In wave two, place **Poçt sipəri** on **Poçt serveri**.
3. Place **Giriş kilidi** on **Arxiv** for the last wave. During a wave, you can select a node and give it one three-second shield.

Changing or removing a defense during preparation returns the previous installation's cost to the same budget. A running wave pauses while the browser tab is hidden. All packet paths and threat types are simulated locally.
If a malicious packet reaches its destination, the wave ends. Retry returns to the same wave's preparation with the integrity and score from the start of the attempt. Earlier completed waves and installed defenses are retained.

## Kiber Qalxan Junior

The supplied HTML is preserved in `assets/junior-source/original.html` as a reference. Junior is rebuilt as a React/TypeScript game with a Phaser visitor scene, the supplied smooth character artwork, and a readable illustrated checkpoint interface.

- Play three days with four visitors each. Account cards and messages arrive open; select a phrase to mark a clue, then apply a safe or block stamp.
- Each day ends with a three-option safe-response challenge. Correct responses unlock the report; retrying an unsafe response does not cost a shield. Includes voice-chat boundaries, fake support codes, and compromised friend accounts.
- Correct decisions earn 10 points, 5 coins, and a named badge. Daily reports and the final title use actual decisions.
- Three mistakes exhaust the shield and pause the post. Retry restores the current day while keeping earlier days.
- New rules unlock with each day. The rulebook can be opened with the keyboard and closed with Escape.
- The supplied character sheet is in `assets/junior-source/characters.png`. Reproduce its transparent crops with `./scripts/crop-junior-assets.ps1`. Outputs are in `public/junior-art`.

## Şəkil Detektivi

Launch from the PC desktop or with ?app=detective. Four chapters teach children to inspect photos before sharing: bedroom (address, phone), school (sign, uniform badge), desk (password, email), and street (street name, building number).

- The supplied HTML references and brief are preserved in assets/detective-source. The supplied four-scene atlas is split into individual scene images with scripts/crop-detective-assets.ps1.
- React renders readable clue text onto the actual calendar, notes, signs and notebook. Keyboard-accessible hotspots cover each clue with an opaque redaction. Unrelated objects award no points; both targets must be hidden to share.
- Zustand owns the level, phase, foundIds Set and persistence. Every clue scores once; completing four levels gives 80 points. Reloading restores the current photo and redactions. End-screen replay starts a fresh run.
- The custom detective cat is original SVG artwork. All panels, hints, progress, buttons and dialogs are live elements. The photos remain separate cropped assets; no complete UI screenshot is used as a background.

## Real yoxsa AI?

Open the game from the desktop or at `?app=real-ai`. Each run shuffles six subjects and shows exactly three normal and three anomalous illustrations. Players can move the card left or right using a mouse, touch, or arrow keys, or choose an on-screen button. Each answer reveals an explanation before the next round. Progress and sound preferences are stored in the browser.

The game uses the twelve 1024×1024 images from the photoreal pack in `public/real-ai/cases`. Both variants are synthetic training images. The supplied fox artwork and the earlier editable SVGs are in `public/real-ai`. Source references and asset manifests are archived in `assets/real-ai-source`. Gameplay only requests assets from the local app.

## Fişinq Ovçusu

The SafeNet desktop opens the playable asset-pack game at `?app=phishing-hunter`. Its standalone HTML and local art are in `public/phishing-hunter`. It includes two interactive lessons, a three-question quiz, and ten mail scenarios. Each new run requests fresh introductions from Groq when configured.

After a decision, **Grok-dan məsləhət al** requests a short Azerbaijani coaching tip. To enable live coaching, set `XAI_API_KEY` in the server environment (or in local `.env.local`), then restart Vite. `XAI_MODEL` defaults to `grok-4.7`. The server sends only a predefined training topic and whether the player was correct. If the API cannot respond, the game displays its built-in hint. Scoring always runs locally.

## Shared implementation

- Phaser 3 renders the Network Defense battlefield and the Junior visitor scene. Phaser scenes receive state snapshots and dispatch pointer actions to React.
- React, TypeScript, Vite, Tailwind CSS, Motion, and Lucide provide documents, investigation, keyboard-accessible controls, reports, and responsive layouts. Howler plays synthesized effects. The UI respects reduced-motion preferences.
- Zustand owns progression, budget, decisions, stats, scoring guardrails, and local saves. Central rules calculate deterministic scores and endings. Zod validates the 19 handcrafted scenarios and AI payloads. Scenario links are inert text using reserved fictional domains.

## Verification

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Unit tests cover scenario data, verdicts, score consequences, ending conditions, and mocked provider behavior. Browser tests cover the desktop games, persistence, restart, drag-and-drop, and phone layout. The retired TRUST, PLEASE campaign browser scenarios are archived in e2e/campaign.archived.ts.

## Network Defense artwork

The five supplied images are kept in `assets/network-source`. The game combines transparent crops from the sheets in `public/network-art` with live labels and controls. The keyboard and desk props are isolated cutouts from the concept. To reproduce the crops on Windows, run `./scripts/crop-network-assets.ps1`.

## Art

The original [campus office illustration](public/campus-office.webp) was generated with the built-in ImageGen tool and encoded as WebP. The interactive Phaser sprites are drawn in code.

### ImageGen prompt

> Create a single original wide 3:2 pixel-art indie game background, desktop night shift at a fictional Azerbaijani university security office. The right 60% contains a grand dark navy university courtyard through a large mullioned window with glowing warm amber windows, cobalt roof, deep midnight sky and a few stars; close foreground right has vintage graphite CRT with dim green phosphor screen, warm articulated desk lamp with gold cone, keyboard, stacks of books and a ceramic cup on walnut desktop. LEFT 40% is mostly dark plain navy shadow fading into the room and suitable for readable large HTML title over it. Classic extremely crisp deliberate 16-bit pixel clusters, detailed but clean, deep indigo and bright honey gold, restrained turquoise accents, nostalgic detective adventure game. Camera eye-level, room fills entire art, no person. No readable text, no labels, no UI or frames, no watermark. Output intended for game title backdrop and Phaser desk ambient layer.
