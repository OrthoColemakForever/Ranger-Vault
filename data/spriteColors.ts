/**
 * DISCOVERED_SPRITE_BG: the "caught" state's container background. As of
 * 2026-08-10 assets/species/*_discovered.png are also transparent
 * tight-cropped cutouts (like the silhouette pair below), not a
 * baked-in-background image, so this is fully free to change too. Set to
 * the same beige as the vault page / species detail page background
 * (2026-08-10) so the card/hero box disappears into the surrounding page
 * instead of reading as a distinct grey square.
 */
export const DISCOVERED_SPRITE_BG = "#ece0c8";

/**
 * The "not yet caught" state's three layers, all freely swappable here —
 * none of these require touching assets/species/*.png:
 *  - SILHOUETTE_SPRITE_BG: the container's own background.
 *  - SILHOUETTE_SHAPE_COLOR: tintColor for *_silhouette_shape.png (the
 *    animal body + its ground shadow, one combined tintable layer).
 *  - QUESTION_MARK_COLOR: tintColor for *_question_mark.png (the "?"
 *    glyph), independent of the shape color above.
 * Medium/dark brown palette set 2026-08-10 (was a faint dark green), all
 * four lightened ~15% toward white the same day for a softer overall look.
 */
export const SILHOUETTE_SPRITE_BG = "#816552";
export const SILHOUETTE_SHAPE_COLOR = "#4b3c34";
export const QUESTION_MARK_COLOR = "#9e959c";
