export type ToolInput = Record<string, unknown>;

export type ToolDefinition = {
  name: string;
  description: string;
  requiredInput: string[];
};

export type ToolResult = {
  success: boolean;
  tool: string;
  data?: unknown;
  error?: string;
};

export type AiChatResponse = {
  status: "success" | "partial" | "failed" | "no_action" | "planned";
  message: string;
  plannedActions: unknown[];
  results: ToolResult[];
};

export type SocialReactionType = "LIKE" | "LOVE" | "CELEBRATE";

export type SocialUser = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

export type SocialComment = {
  id: string;
  content: string;
  createdAt: string;
  user?: SocialUser;
  reactions?: Array<{ id: string; type: SocialReactionType; userId: string }>;
};

export type SocialPost = {
  id: string;
  content: string;
  createdAt: string;
  user?: SocialUser;
  comments?: SocialComment[];
  reactions?: Array<{ id: string; type: SocialReactionType; userId: string }>;
};

export type Workspace = {
  id: string;
  name: string;
  columns?: Array<{
    id: string;
    name: string;
    position: number;
    type?: string;
    tasks?: Array<{
      id: string;
      title: string;
      description?: string | null;
      createdAt?: string;
      updatedAt?: string;
    }>;
  }>;
};

export type ShiftRecordApi = {
  id: string;
  userId: string;
  date: string;
  timeIn: string;
  timeOut?: string | null;
  expectedOut?: string | null;
  status: string;
};

export type SignUpPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  country: string;
  address?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:3000";

export const DEFAULT_USER_ID =
  import.meta.env.VITE_DEMO_USER_ID?.trim() || "user-001";

function resolveUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function normalizeErrorMessage(payload: unknown, status: number) {
  const message = (payload as { message?: unknown })?.message;

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  return `Request failed with status ${status}`;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const url = resolveUrl(path);
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = normalizeErrorMessage(data, response.status);
    throw new Error(`${errorMessage} [${response.status}] (${url})`);
  }

  return data as T;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export async function listAiTools() {
  return apiRequest<ToolDefinition[]>("/ai-orchestration/tools");
}

export async function executeAiTool(tool: string, input?: ToolInput) {
  return apiRequest<ToolResult>("/ai-orchestration/execute", {
    method: "POST",
    body: JSON.stringify({ tool, input }),
  });
}

export async function executeManyAiTools(actions: Array<{ tool: string; input?: ToolInput }>) {
  return apiRequest<{ success: boolean; results: ToolResult[] }>(
    "/ai-orchestration/execute-many",
    {
      method: "POST",
      body: JSON.stringify({ actions }),
    },
  );
}

export async function chatWithAi(message: string, context?: ToolInput) {
  return apiRequest<AiChatResponse>("/ai-orchestration/chat", {
    method: "POST",
    body: JSON.stringify({ message, context }),
  });
}

export async function listSocialPosts() {
  return apiRequest<SocialPost[]>("/social/posts");
}

export async function createSocialPost(payload: {
  userId: string;
  content: string;
  networkIds?: string[];
}) {
  return apiRequest<SocialPost>("/social/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSocialPost(
  postId: string,
  payload: {
    userId: string;
    content: string;
  },
) {
  return apiRequest<{ count: number }>(`/social/posts/${postId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteSocialPost(postId: string, userId: string) {
  return apiRequest<{ count: number }>(`/social/posts/${postId}`, {
    method: "DELETE",
    body: JSON.stringify({ userId }),
  });
}

export async function listWorkspaces() {
  return apiRequest<Workspace[]>("/workspace");
}

export async function createWorkspace(payload: {
  name: string;
  columns?: Array<{ name: string; position?: number; type?: string }>;
}) {
  return apiRequest<Workspace>("/workspace", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateWorkspace(workspaceId: string, payload: { name?: string }) {
  return apiRequest<Workspace>(`/workspace/${workspaceId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function createTask(
  workspaceId: string,
  payload: {
    title: string;
    description?: string;
    columnId?: string;
    customFieldValues?: Record<string, unknown>;
  },
) {
  return apiRequest<{ id: string; title: string }>(`/workspace/${workspaceId}/tasks`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function clockIn(userId: string) {
  return apiRequest<ShiftRecordApi>("/time-record/clock-in", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export async function clockOut(userId: string, expectedOut: string) {
  return apiRequest<ShiftRecordApi>("/time-record/clock-out", {
    method: "POST",
    body: JSON.stringify({ userId, expectedOut }),
  });
}

export async function signUp(payload: SignUpPayload) {
  return apiRequest<{
    message: string;
    token: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
  }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(payload: LoginPayload) {
  return apiRequest<{
    message: string;
    token: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role?: string;
    };
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Backward-compatible aliases used by existing UI components
export async function chatAi(message: string, context?: ToolInput) {
  return chatWithAi(message, context);
}

export async function getSocialPosts() {
  return listSocialPosts();
}

export async function createSocialComment(payload: {
  userId: string;
  postId: string;
  content: string;
}) {
  return apiRequest<{ id: string; content: string }>("/social/comments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function addSocialReaction(payload: {
  userId: string;
  type: SocialReactionType;
  postId?: string;
  commentId?: string;
}) {
  return apiRequest<{ id: string; type: SocialReactionType }>("/social/reactions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function removeSocialReaction(payload: {
  userId: string;
  postId?: string;
  commentId?: string;
}) {
  return apiRequest<{ count: number }>("/social/reactions", {
    method: "DELETE",
    body: JSON.stringify(payload),
  });
}

export async function getWorkspaces() {
  return listWorkspaces();
}

export async function getWorkspaceById(workspaceId: string) {
  return apiRequest<Workspace>(`/workspace/${workspaceId}`);
}

export async function createWorkspaceTask(
  workspaceId: string,
  payload: {
    title: string;
    description?: string;
    columnId?: string;
    customFieldValues?: Record<string, unknown>;
  },
) {
  return createTask(workspaceId, payload);
}

export function getCurrentUserId() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const raw = localStorage.getItem("simpleflow_auth_state");
    if (raw) {
      const parsed = JSON.parse(raw) as { user?: { id?: string } };
      if (parsed?.user?.id) {
        return parsed.user.id.trim();
      }
    }
  } catch {
    // no-op
  }

  return localStorage.getItem("simpleflow_user_id")?.trim() || "";
}
