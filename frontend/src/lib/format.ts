/** Trim a full address down to "…, City, ST" — drop trailing country and zip. */
export function addressUpToState(address: string): string {
  const parts = address
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  while (parts.length && /^(united states|usa|us)$/i.test(parts[parts.length - 1])) {
    parts.pop();
  }
  while (parts.length && /^\d{5}(-\d{4})?$/.test(parts[parts.length - 1])) {
    parts.pop();
  }
  return parts.join(", ");
}
