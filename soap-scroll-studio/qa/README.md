# Browser verification — 6 November 2026

The completed build was checked in Chromium through the Codex browser at an observed **1280×720 desktop viewport** and **390×844 mobile viewport**.

- All six chapters render the supplied video identity in the approved order: Orange, Avarampoo, Charcoal, Sandalwood, Aloe Vera, Kuppaimeni.
- Each sequence reached its final frame (zero-based index 189) with `data-frame` matching `data-requested-frame` and `data-ready="true"`.
- Forward, reverse, and stopped scrolling were checked. Orange moved from index 0 to 73, held at 73, then reversed to 37 on desktop. Kuppaimeni reversed from 189 to 95 on mobile.
- Desktop and mobile chapter links, next-soap links, the collection transition, and the six-product image grid were checked. All six packaging images loaded.
- The menu opens, focuses its first link, closes with Escape, and restores focus to its button. The mobile menu fits inside the viewport.
- Refreshing a product hash opens that chapter. Refreshing `#collection` positions the collection below the fixed header.
- Neither tested layout has horizontal page overflow. Product image boxes are square, and their descriptions and footer wordmark no longer overlap.
- Browser console inspections returned no warnings or errors.
- The temporary viewport override was reset after responsive testing.

`desktop-final.jpg` is the completed opening. `desktop-collection.jpg` and `mobile-collection.jpg` show the corrected collection. Other captures document individual chapter openings and endings; `mobile-orange-ending.jpg` predates the final shorter mobile detail panel.

The asset verification command, `npm run check`, separately passed all 12 manifests and 2,280 WebP files, frame counts, file signatures, dimensions, frame rates, mappings, 18 photographs, and SHA-256 checksums of both the supplied source videos and their archived copies. The final JavaScript syntax check passed. Reduced-motion handling was checked in the source; operating-system preferences were not changed for this review.
