export const CAPABILITY_ALIASES: Record<string, string> = {
  "calendar.find_free_time": "calendar.list_events",
  "web.search": "web_search.search" // safety net if any legacy strings leak in
};

export function normalizeCapability(cap: string): string {
  return CAPABILITY_ALIASES[cap] ?? cap;
}