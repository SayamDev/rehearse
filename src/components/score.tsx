/**
 * A score with tabular digits but a normal-width decimal point.
 * Tabular sets often widen ".", which leaves a gap ("7 . 9").
 */
export function Score({ value, digits = 1, className = "" }: { value: number; digits?: number; className?: string }) {
  const [whole, frac] = value.toFixed(digits).split(".");
  return (
    <span className={`tnum font-display ${className}`}>
      {whole}
      {frac !== undefined && (
        <>
          <span className="[font-feature-settings:'tnum'_0]">.</span>
          {frac}
        </>
      )}
    </span>
  );
}
