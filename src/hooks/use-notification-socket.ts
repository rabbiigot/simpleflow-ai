import { getApiBaseUrl, type NotificationData } from "@/lib/backend-api";
import { useEffect, useRef, useState, useCallback } from "react";

export type NotificationSocketEvent = {
  type: string;
  notification?: NotificationData;
  unreadCount?: number;
  [key: string]: unknown;
};

function buildWsUrl() {
  const base = getApiBaseUrl();
  const wsBase = base.replace(/^http/, "ws");
  return `${wsBase}/notifications/ws`;
}

export function useNotificationSocket(userId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<
    Set<(event: NotificationSocketEvent) => void>
  >(new Set());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>(undefined);
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
          const data = JSON.parse(
            String(event.data),
          ) as NotificationSocketEvent;

          // Auto-track unread count from server events
          if (typeof data.unreadCount === "number") {
            setUnreadCount(data.unreadCount);
          }

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

  const addListener = useCallback(
    (fn: (event: NotificationSocketEvent) => void) => {
      listenersRef.current.add(fn);
      return () => {
        listenersRef.current.delete(fn);
      };
    },
    [],
  );

  return { isConnected, unreadCount, setUnreadCount, addListener };
}
