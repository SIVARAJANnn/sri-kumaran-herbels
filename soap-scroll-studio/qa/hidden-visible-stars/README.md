# Visible-star display update

The six supplied video sequences now use a closer, proportional view that excludes the lower-right star graphics. Each clip retains the central 75% of its width and 75% of its height. Charcoal's window is shifted upward slightly to accommodate the rotating bar. The full video and WebP source files are unchanged.

The same canvas path renders posters and decoded frames. Four color samples for the tall-screen surround also come from inside the retained area; the excluded stars cannot leak into the background. This avoids the streaks caused by extending an entire shadow-containing edge row.

Browser verification covered the opening, middle (index 95), and ending (index 189) of every soap at 1280×720 desktop and the user's 331×668 portrait preview. Captures are named by soap, viewport, and position. All final-frame checks returned `ready=true` and matching rendered/requested indices. Desktop and phone console checks returned no warnings or errors.

The source windows are 240,135,1440,810 for normal desktop scenes and 160,90,960,540 for normal phone scenes. Charcoal uses 240,86,1440,810 on desktop and 160,58,960,540 on phones. These windows keep the same 16:9 proportions.

Reverse scrolling was verified from index 189 back to 95. The scroll interpolation now performs its final settling tick, so an exact half-way scroll position consistently resolves to index 95. JavaScript syntax validation passed.

The source backups are in `.backups/visible-stars-before-reframe/`. This update hides visible graphics in the website view; it does not create altered source-video exports or remove invisible SynthID.
