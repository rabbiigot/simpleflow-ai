import { useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "@/lib/backend-api";

export type AiSocketEvent = {
  type: string;
  requestId?: string;
  timestamp?: string;
  payload?: unknown;
};

function buildWsUrl() {
  const explicit = import.meta.env.VITE_AI_WS_URL?.trim();
  if (explicit) {
    return explicit;
  }

  const base = getApiBaseUrl().replace(/^http/, "ws");
  return `${base}/ai-orchestration/ws`;
}

export function useAiEvents() {
  const [events, setEvents] = useState<AiSocketEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const wsUrl = useMemo(() => buildWsUrl(), []);

  useEffect(() => {
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setIsConnected(true);
    };

    socket.onclose = () => {
      setIsConnected(false);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as AiSocketEvent & {
          payload?: { requestId?: string; chatId?: string; batchId?: string };
          chatId?: string;
          batchId?: string;
        };

        const normalized: AiSocketEvent = {
          ...data,
          requestId: data.requestId || data.payload?.requestId,
        };

        setEvents((prev) => [normalized, ...prev].slice(0, 50));
      } catch {
        setEvents((prev) => [
          {
            type: "raw_message",
            timestamp: new Date().toISOString(),
            payload: event.data,
          },
          ...prev,
        ]);
      }
    };

    return () => {
      socket.close();
    };
  }, [wsUrl]);

  return {
    events,
    isConnected,
    wsUrl,
  };
}
