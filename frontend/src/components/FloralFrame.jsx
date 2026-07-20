// FloralFrame — wraps any card in the app's existing floral-border band on all
// four sides. It reuses the same floral-border.png strip used at the top of the
// page (see .floral-top): the top/bottom edges tile it horizontally, the two
// side edges tile a rotated copy, and four small corner motifs sit on top to
// hide the seams where the edges meet. The side strips are intentionally longer
// than any card and clipped by the frame's overflow, so the band adapts to
// dynamic content height without stretching or cutting the pattern mid-motif.
export default function FloralFrame({ children }) {
  return (
    <div className="floral-frame">
      <span className="ff-edge top" aria-hidden="true" />
      <span className="ff-edge bottom" aria-hidden="true" />
      <span className="ff-edge left" aria-hidden="true" />
      <span className="ff-edge right" aria-hidden="true" />
      <span className="ff-corner tl" aria-hidden="true" />
      <span className="ff-corner tr" aria-hidden="true" />
      <span className="ff-corner bl" aria-hidden="true" />
      <span className="ff-corner br" aria-hidden="true" />
      <div className="ff-content">{children}</div>
    </div>
  );
}
