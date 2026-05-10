// Bewegter Hintergrund nur fuer den "Meine WG"-Bereich.
// Drei animierte Color-Blobs (Pink, Fuchsia, Cyan) auf dunklem Grund,
// die in sehr langsamen Loops driften. CSS in globals.css.
//
// Wenn ein Hintergrund-Bild gesetzt ist (--wg-bg-image als CSS-Variable),
// wird es als Basislayer mitgerendert.
export function WgAnimatedBg() {
  return (
    <div className="wg-animated-bg" aria-hidden="true">
      <div className="wg-blob-3" />
    </div>
  );
}
