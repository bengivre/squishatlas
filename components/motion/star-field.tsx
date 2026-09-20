/** CSS-only drifting star field. Stops under prefers-reduced-motion. */
export function StarField() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="aurora-drift" />
      <div className="star-field star-field--a" />
      <div className="star-field star-field--b" />
    </div>
  );
}
