import { useEffect, useState } from "react";

/**
 * Resolves CSS custom properties (design tokens) to their concrete computed
 * values so they can be handed to Recharts/SVG, which can't resolve `var()`
 * in presentation attributes. Re-resolves when the theme attribute flips.
 */
export function useTokenColors<T extends string>(vars: T[]): Record<T, string> {
  const read = () => {
    if (typeof document === "undefined") {
      return Object.fromEntries(vars.map((v) => [v, ""])) as Record<T, string>;
    }
    const cs = getComputedStyle(document.documentElement);
    return Object.fromEntries(
      vars.map((v) => [v, cs.getPropertyValue(v).trim()])
    ) as Record<T, string>;
  };

  const [colors, setColors] = useState<Record<T, string>>(read);

  const key = vars.join(",");
  useEffect(() => {
    setColors(read());
    const obs = new MutationObserver(() => setColors(read()));
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return colors;
}
