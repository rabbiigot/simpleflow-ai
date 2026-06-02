import { getApiBaseUrl } from "@/lib/backend-api";
import { useEffect, useRef, useState, useCallback } from "react";

export type SocialSocketEvent = {
  type: string;
  post?: unknown;
  postId?: string;
  reaction?: unknown;
  comment?: unknown;
  userId?: string;
  commentId?: string;
  [key: string]: unknown;
};

function buildWsUrl() {
  const base = getApiBaseUrl();
  const wsBase = base.replace(/^http/, "ws");
  return `${wsBase}/social/ws`;
}

export function useSocialSocket(userId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Set<(event: SocialSocketEvent) => void>>(new Set());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT = 5;

  useEffect(() => {
    if (!userId) return;

    const url = buildWsUrl();

    function connect() {
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        socket.send(JSON.stringify({ type: "auth", userId }));
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
          const data = JSON.parse(String(event.data)) as SocialSocketEvent;
          for (const listener of listenersRef.current) {
            listener(data);
          }
        } catch {
          // ignore
        }
      };

      return socket;
    }

    const socket = connect();

    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      socket.close();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [userId]);

  const addListener = useCallback((fn: (event: SocialSocketEvent) => void) => {
    listenersRef.current.add(fn);
    return () => { listenersRef.current.delete(fn); };
  }, []);

  return { isConnected, addListener };
}
