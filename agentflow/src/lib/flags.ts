export function boolFlag(value: string | undefined, defaultValue = false): boolean {
  if (value == null) return defaultValue;
  const v = value.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export const TESTER_V2_ENABLED = boolFlag(process.env.NEXT_PUBLIC_TESTER_V2, false);
