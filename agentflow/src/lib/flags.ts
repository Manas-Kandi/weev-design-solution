export function boolFlag(value: string | undefined, defaultValue = false): boolean {
  if (value == null) return defaultValue;
  const v = value.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}
