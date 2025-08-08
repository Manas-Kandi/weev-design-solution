export interface RunExecutionOptions {
  scenario?: {
    description?: string;
    timezone?: string;
    workingHours?: { start?: string; end?: string };
    businessRules?: string;
  };
  simulation?: {
    useSimulators?: boolean;
    latencyMs?: { min?: number; max?: number };
    failurePercent?: number; // 0-100
  };
  overrides?: {
    provider?: string; // e.g., 'nvidia' | 'gemini'
    model?: string;
    temperature?: number;
    seed?: string;
  };
  // Optional assertions to evaluate after flow completes
  assertions?: import("@/lib/assertions").AssertionSpec[];
}
