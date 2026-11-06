# Sri Kumaran Herbals — six botanical stories

Six consecutive, full-screen soap stories inspired by the Lumé reference. Scroll position selects a real frame from the supplied video; scrolling backward reverses the action and stopping holds the current frame. Each chapter has animated typography, a progress indicator, botanical details, and navigation to the next soap. The final collection uses the original packaging photographs.

## Preview

```powershell
npm run dev
```

Open **http://127.0.0.1:4173/**. This is a local preview. The static website is in `dist`; the server exposes only that folder. The video archives, source files, and reports are not served.

## Supplied video mapping

| Chapter | Soap | Source video identifier |
| --- | --- | --- |
| 01 | Orange | 442d7fae |
| 02 | Avarampoo | 07a8ffef |
| 03 | Charcoal | 03ba9c29 |
| 04 | Sandalwood | 74cc60e6 |
| 05 | Aloe Vera | 2cd96fe2 |
| 06 | Kuppaimeni | 4fc9cdf9 |

All six supplied clips are 1920×1080, 24 fps, approximately eight seconds long. Each was converted to **190 WebP frames** in two variants: 1920×1080 for desktop and 1280×720 for mobile, **2,280 frames total**. The archived videos and extracted frame files remain unchanged. Audio is not used in the scroll animation.

At the user's request, the website excludes the visible corner stars by retaining the **central 75% of the source width and height**. This keeps the original 16:9 proportions with a closer composition (1440×810 of the desktop source; 960×540 of the mobile source). Charcoal's view is shifted slightly upward to keep the rotating bar inside the frame; the other five use a centered view. The same view applies to every video frame and its opening poster. The Sandalwood macro shot is intentionally closer. Tall-screen backgrounds blend four tiny color samples from inside this view, so the excluded corner cannot reappear in the surround or stretch the soap's shadow across it. This is a presentation crop, not an edited or watermark-free source export, and it does not remove invisible SynthID.

The viewer loads nearby frames through a shared download queue and releases distant decoded images. A branded loader prepares the opening; adjacent chapters preload their first frame. Reduced-motion preferences show a static frame. Menu navigation supports keyboard focus and Escape; collection and chapter links use ordinary anchors.

## Assets and verification

- `dist/media.json` selects the active sequences.
- `dist/frames/supplied-20261106075400335/` contains the current frame batch.
- `videos/supplied-20261106075400335/` contains unchanged copies of the supplied MP4 files.
- `supplied-video-report.json` records mappings, frame counts, sizes, and SHA-256 checksums.
- `.backups/` preserves the previous local website files.

```powershell
npm run check
node --check dist/app.js
```

The check validates the approved chapter order, all 12 manifests, all 2,280 contiguous WebP files, dimensions, frame rates, product photographs, and source/archive checksums. Bundled originals are in `videos/supplied-20261106075400335/`; set `SUPPLIED_VIDEO_DIR` to verify or rebuild against an external source folder.

To rebuild all frames from those files, install the existing development dependency with `npm install`, then run `npm run build:frames`. It creates a new batch before switching the registry. `npm run prepare` refreshes the product data and original photographs while preserving the current registry.

This deliverable is the six-soap animation presentation and collection. Checkout, payments, stock management, and public hosting are separate integrations. No account connection or further video generation is needed.
