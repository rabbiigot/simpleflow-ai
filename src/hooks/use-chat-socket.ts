import { getApiBaseUrl } from "@/lib/backend-api";
import { useEffect, useRef, useState, useCallback } from "react";

export type ChatSocketMessage = {
  type: string;
  channelId?: string;
  message?: {
    id: string;
    channelId: string;
    userId: string;
    content: string;
    createdAt: string;
    user: { id: string; firstName: string; lastName: string; email: string; avatarUrl: string | null };
    replyToId?: number | null;
    replyTo?: {
      id: number;
      content: string;
      user: { id: number; firstName: string; lastName: string; avatarUrl?: string | null };
    } | null;
    reactions?: Array<{
      id: number;
      emoji: string;
      userId: number;
      user: { id: number; firstName: string; lastName: string };
    }>;
  };
  [key: string]: unknown;
};

function buildWsUrl() {
  const base = getApiBaseUrl();
  const wsBase = base.replace(/^http/, "ws");
  return `${wsBase}/chat/ws`;
}

export function useChatSocket(userId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Set<(msg: ChatSocketMessage) => void>>(new Set());
  const pendingRef = useRef<string[]>([]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT = 5;

  const safeSend = useCallback((data: string) => {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(data);
    } else {
      pendingRef.current.push(data);
    }
  }, []);

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

        // Flush any queued messages
        for (const msg of pendingRef.current) {
          socket.send(msg);
        }
        pendingRef.current = [];
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
          const data = JSON.parse(String(event.data)) as ChatSocketMessage;
          for (const listener of listenersRef.current) {
            listener(data);
          }
        } catch {
          // ignore non-JSON
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

  const joinChannel = useCallback((channelId: string) => {
    safeSend(JSON.stringify({ type: "join_channel", channelId }));
  }, [safeSend]);

  const leaveChannel = useCallback((channelId: string) => {
    safeSend(JSON.stringify({ type: "leave_channel", channelId }));
  }, [safeSend]);

  const sendMessage = useCallback((channelId: string, content: string, replyToId?: string) => {
    safeSend(JSON.stringify({ type: "send_message", channelId, content, replyToId }));
  }, [safeSend]);

  const addListener = useCallback((fn: (msg: ChatSocketMessage) => void) => {
    listenersRef.current.add(fn);
    return () => { listenersRef.current.delete(fn); };
  }, []);

  return { isConnected, joinChannel, leaveChannel, sendMessage, addListener };
}
