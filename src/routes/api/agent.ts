import { createFileRoute } from "@tanstack/react-router";

// Streaming agent endpoint. Server-only logic is loaded inside the handler so it never enters the client bundle.
export const Route = createFileRoute("/api/agent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleAgentRequest } = await import("@/lib/legal/agent.server");
        return handleAgentRequest(request);
      },
    },
  },
});
