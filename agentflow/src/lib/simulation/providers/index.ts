import { SimulationProvider } from "@/types/simulation";

function seededRandom(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff;
}

const calendarProvider: SimulationProvider = {
  id: "calendar",
  label: "Calendar",
  operations: [
    { name: "findEvents" },
    { name: "createEvent", paramsSchema: { title: "string", date: "string" } },
  ],
  scenarios: [
    { id: "busy-week", label: "Busy week with double-bookings" },
    { id: "empty-calendar", label: "Empty calendar" },
  ],
  async run({ operation, params = {}, scenarioId, latencyMs = 120, injectError }) {
    if (injectError) {
      await new Promise((r) => setTimeout(r, latencyMs));
      return { error: injectError.message || injectError.type };
    }
    await new Promise((r) => setTimeout(r, latencyMs));
    const rnd = seededRandom(operation + scenarioId + JSON.stringify(params));
    if (operation === "findEvents") {
      const count = scenarioId === "empty-calendar" ? 0 : 3 + Math.floor(rnd * 3);
      const events = Array.from({ length: count }).map((_, i) => ({
        id: `evt_${i}_${scenarioId}`,
        title: i === 1 && scenarioId === "busy-week" ? "Team Sync (double-booked)" : `Event ${i + 1}`,
        start: `2025-08-${10 + i}T0${8 + i}:00:00Z`,
        end: `2025-08-${10 + i}T0${9 + i}:00:00Z`,
        location: rnd > 0.5 ? "Zoom" : "HQ Room 2",
      }));
      return { data: { events } };
    }
    if (operation === "createEvent") {
      return { data: { ok: true, event: { id: `evt_${Math.floor(rnd * 10000)}`, ...(params as object) } } };
    }
    return { error: `Unknown operation: ${operation}` };
  },
};

const emailProvider: SimulationProvider = {
  id: "email",
  label: "Email",
  operations: [
    { name: "listEmails" },
    { name: "sendEmail", paramsSchema: { to: "string", subject: "string" } },
  ],
  scenarios: [
    { id: "support-inbox", label: "Support inbox (unread)" },
    { id: "clean-inbox", label: "Clean inbox" },
  ],
  async run({ operation, params = {}, scenarioId, latencyMs = 80, injectError }) {
    if (injectError) {
      await new Promise((r) => setTimeout(r, latencyMs));
      return { error: injectError.message || injectError.type };
    }
    await new Promise((r) => setTimeout(r, latencyMs));
    const rnd = seededRandom(operation + scenarioId + JSON.stringify(params));
    if (operation === "listEmails") {
      const count = scenarioId === "clean-inbox" ? 0 : 2 + Math.floor(rnd * 3);
      const emails = Array.from({ length: count }).map((_, i) => ({
        id: `em_${i}_${scenarioId}`,
        from: rnd > 0.5 ? "customer@acme.com" : "alerts@service.io",
        subject: i === 0 && scenarioId === "support-inbox" ? "Password reset not working" : `Message ${i + 1}`,
        receivedAt: `2025-08-${15 + i}T1${i}:15:00Z`,
      }));
      return { data: { emails } };
    }
    if (operation === "sendEmail") {
      return { data: { ok: true, messageId: `msg_${Math.floor(rnd * 100000)}`, ...(params as object) } };
    }
    return { error: `Unknown operation: ${operation}` };
  },
};

export const providers: SimulationProvider[] = [calendarProvider, emailProvider];

export function getProvider(id: string | undefined) {
  return providers.find((p) => p.id === id);
}
