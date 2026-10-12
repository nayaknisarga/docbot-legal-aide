import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/discovery")({
  server: { handlers: { POST: async ({ request }) => {
    const { handleDiscovery } = await import("@/lib/legal/discovery/agent.server");
    return handleDiscovery(request);
  } } },
});