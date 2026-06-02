import { useEffect, useMemo, useRef, useState } from "react";
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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT = 5;

  useEffect(() => {
    function connect() {
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      socket.onclose = () => {
        setIsConnected(false);
        if (reconnectAttemptsRef.current < MAX_RECONNECT) {
          const delay = Math.min(
            3000 * Math.pow(2, reconnectAttemptsRef.current),
            30000,
          );
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as AiSocketEvent & {
            payload?: {
              requestId?: string;
              chatId?: string;
              batchId?: string;
            };
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

      return socket;
    }

    const socket = connect();

    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      socket.close();
    };
  }, [wsUrl]);

  return {
    events,
    isConnected,
    wsUrl,
  };
}
