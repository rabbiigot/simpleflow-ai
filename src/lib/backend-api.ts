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
  status:
    | "success"
    | "partial"
    | "failed"
    | "no_action"
    | "planned"
    | "confirmation_required"
    | "confirmation_id_required"
    | "canceled";
  message: string;
  sessionId?: number;
  confirmationId?: string;
  confirmationPrompt?: string;
  plannedActions: unknown[];
  results: ToolResult[];
  analyticsDetails?: Array<{ tool: string; data: unknown }>;
};

export type SocialReactionType =
  | "LIKE"
  | "LOVE"
  | "CELEBRATE"
  | "WOW"
  | "HAHA"
  | "SAD"
  | "ANGRY";

export type SocialReaction = {
  id: string;
  type: SocialReactionType;
  userId: string;
  createdAt?: string;
  user?: SocialUser;
};

export type SocialUser = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
};

export type SocialComment = {
  id: string;
  userId?: string;
  content: string;
  createdAt: string;
  user?: SocialUser;
  reactions?: SocialReaction[];
};

export type SocialPost = {
  id: string | number;
  userId?: string | number;
  content: string;
  createdAt: string;
  visibility?: "PUBLIC" | "CHANNELS";
  user?: SocialUser;
  comments?: SocialComment[];
  reactions?: SocialReaction[];
  channels?: Array<{ id: number; name: string; icon?: string }>;
};

export type UserNetworkMembership = {
  id: string;
  role?: string;
  joinedAt?: string;
  network?: {
    id: string;
    name: string;
    createdAt?: string;
  };
};

export type DashboardOverviewResponse = {
  summary: {
    activeGoals: number;
    tasksCompleted: number;
    totalTasks: number;
    successRate: number;
    monthlyHoursTracked: number;
    monthlyPosts: number;
  };
  goals: Array<{
    workspaceId: number;
    name: string;
    progress: number;
    totalTasks: number;
    completedTasks: number;
  }>;
  todayTasks: Array<{
    id: number;
    title: string;
    description?: string | null;
    workspaceName: string;
    status: string;
    done: boolean;
    createdAt: string;
  }>;
  aiInsight: {
    title: string;
    summary: string;
    highlights: string[];
    recommendations: string[];
  };
  generatedAt: string;
};

export type DashboardInsightsResponse = {
  periodDays: number;
  metrics: {
    tasksCompleted: number;
    hoursTracked: number;
    productivityScore: number;
    avgTaskMinutes: number;
  };
  productivityTrend: Array<{
    day: string;
    productivity: number;
    target: number;
  }>;
  taskStatusOverview: Array<{
    category: string;
    value: number;
  }>;
  timeAllocation: Array<{
    name: string;
    value: number;
  }>;
  reports: DashboardReport[];
  generatedAt: string;
};

export type DashboardReport = {
  id: string;
  name: string;
  date: string;
  status: "completed" | "pending";
  tasks: number;
  hours: number;
};

export type DashboardReportsResponse = {
  reports: DashboardReport[];
  generatedAt: string;
};

export type CustomField = {
  id: string;
  name: string;
  type: string;
  config?: unknown;
  createdAt?: string;
  boardId: string;
};

export type WorkspaceUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string | null;
};

export type WorkspaceMember = {
  id: number;
  boardId: number;
  userId: number;
  role: "ADMIN" | "MEMBER";
  joinedAt: string;
  user: WorkspaceUser;
};

export type Workspace = {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  status?: string;
  githubEnabled?: boolean;
  calendarEnabled?: boolean;
  createdAt?: string;
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
      assigneeId?: number | null;
      assignee?: WorkspaceUser | null;
      customFieldValues?: Record<string, unknown> | null;
      attachments?: TaskAttachment[];
    }>;
  }>;
  customFields?: CustomField[];
  members?: WorkspaceMember[];
  ownerId?: number | null;
  owner?: WorkspaceUser | null;
  channelId?: number | null;
  channel?: {
    id: number;
    name: string;
    description?: string | null;
    icon?: string | null;
  } | null;
};

export type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type WorkspaceStatusFilter = "all" | "active" | "completed" | "paused" | "archived";

export type WorkspacesQuery = {
  status?: WorkspaceStatusFilter;
  date?: string; // YYYY-MM-DD
  tzOffsetMinutes?: number; // JS Date.getTimezoneOffset()
  field?: "status" | "name";
  op?: "eq" | "neq";
  value?: string;
  excludeStatus?: Array<WorkspaceStatusFilter>;
  userId?: string;
  page?: number;
  pageSize?: number;
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

export type LeaveRequestApi = {
  id: string;
  userId: string;
  type: "SICK" | "VACATION" | "OTHER";
  status: string;
  date: string;
  note?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
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

  // Attach JWT token from auth store if available
  const token = typeof window !== "undefined"
    ? localStorage.getItem("simpleflow_token") || ""
    : "";
  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...(init?.headers ?? {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const msg = normalizeErrorMessage(data, response.status);

    // Handle unauthorized — clear auth and redirect to login
    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("simpleflow_auth_state");
      localStorage.removeItem("simpleflow_token");
      localStorage.removeItem("simpleflow_user_id");
      window.location.href = "/login";
      throw new Error("Session expired. Redirecting to login...");
    }

    // Detect stale session: user was deleted (DB wipe) but token still exists
    const isUserGone = response.status === 404 && /user.*not found/i.test(msg);
    if (isUserGone && typeof window !== "undefined") {
      localStorage.removeItem("simpleflow_auth_state");
      localStorage.removeItem("simpleflow_token");
      localStorage.removeItem("simpleflow_user_id");
      window.location.href = "/login";
      throw new Error("Session expired. Redirecting to login...");
    }

    throw new Error(msg);
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

export async function executeManyAiTools(
  actions: Array<{ tool: string; input?: ToolInput }>,
) {
  return apiRequest<{ success: boolean; results: ToolResult[] }>(
    "/ai-orchestration/execute-many",
    {
      method: "POST",
      body: JSON.stringify({ actions }),
    },
  );
}

export async function chatWithAi(
  message: string,
  context?: ToolInput,
  confirmationId?: string,
  requireConfirmation?: boolean,
  sessionId?: number,
) {
  return apiRequest<AiChatResponse>("/ai-orchestration/chat", {
    method: "POST",
    body: JSON.stringify({ message, context, confirmationId, requireConfirmation, sessionId }),
  });
}

export async function chatWithImage(
  image: File,
  message?: string,
  context?: ToolInput,
  requireConfirmation?: boolean,
) {
  const formData = new FormData();
  formData.append("image", image);
  if (message) formData.append("message", message);
  if (context) formData.append("context", JSON.stringify(context));
  formData.append("requireConfirmation", String(requireConfirmation ?? true));

  const url = resolveUrl("/ai-orchestration/chat-image");
  const token = typeof window !== "undefined"
    ? localStorage.getItem("simpleflow_token") || ""
    : "";
  const response = await fetch(url, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const msg = normalizeErrorMessage(data, response.status);
    throw new Error(msg);
  }

  return data as AiChatResponse;
}

export async function chatWithDocument(
  document: File,
  message?: string,
  context?: ToolInput,
  requireConfirmation?: boolean,
  sessionId?: number,
) {
  const formData = new FormData();
  formData.append("document", document);
  if (message) formData.append("message", message);
  if (context) formData.append("context", JSON.stringify(context));
  formData.append("requireConfirmation", String(requireConfirmation ?? true));
  if (sessionId != null) formData.append("sessionId", String(sessionId));

  const url = resolveUrl("/ai-orchestration/chat-document");
  const token = typeof window !== "undefined"
    ? localStorage.getItem("simpleflow_token") || ""
    : "";
  const response = await fetch(url, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const msg = normalizeErrorMessage(data, response.status);
    throw new Error(msg);
  }

  return data as AiChatResponse;
}

/**
 * Analyze an image and return checklist items for a task.
 * Dedicated lightweight endpoint — skips full tool orchestration.
 */
export async function analyzeImageForChecklist(
  image: File,
  taskTitle?: string,
  taskDescription?: string,
): Promise<{ items: string[]; summary: string }> {
  const formData = new FormData();
  formData.append("image", image);
  if (taskTitle) formData.append("taskTitle", taskTitle);
  if (taskDescription) formData.append("taskDescription", taskDescription);

  const url = resolveUrl("/ai-orchestration/analyze-checklist");
  const token = typeof window !== "undefined"
    ? localStorage.getItem("simpleflow_token") || ""
    : "";
  const response = await fetch(url, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const msg = normalizeErrorMessage(data, response.status);
    throw new Error(msg);
  }

  return data as { items: string[]; summary: string };
}

export async function listSocialPosts() {
  return apiRequest<SocialPost[]>("/social/posts");
}

export async function listSocialPostsPaged(
  page: number,
  pageSize: number,
  userId?: string,
  channelId?: string,
) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  if (userId) params.set("userId", userId);
  if (channelId) params.set("channelId", channelId);
  return apiRequest<PagedResult<SocialPost>>(
    `/social/posts/paged?${params.toString()}`,
  );
}

export async function listPostsByUser(
  authorId: string,
  page: number,
  pageSize: number,
  viewerId?: string,
) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  if (viewerId) params.set("viewerId", viewerId);
  return apiRequest<PagedResult<SocialPost>>(
    `/social/posts/by-user/${encodeURIComponent(authorId)}?${params.toString()}`,
  );
}

export async function getSocialPost(postId: string) {
  const encoded = encodeURIComponent(postId);
  return apiRequest<SocialPost>(`/social/posts/${encoded}`);
}

export async function listUserNetworks(userId: string) {
  const encoded = encodeURIComponent(userId);
  return apiRequest<UserNetworkMembership[]>(
    `/social/users/${encoded}/networks`,
  );
}

export async function getDashboardOverview(userId?: string, workspaceId?: string | number) {
  const params = new URLSearchParams();
  if (userId?.trim()) params.set("userId", userId.trim());
  if (workspaceId != null && String(workspaceId).trim()) params.set("workspaceId", String(workspaceId).trim());
  const suffix = params.toString();
  return apiRequest<DashboardOverviewResponse>(
    suffix ? `/dashboard/overview?${suffix}` : "/dashboard/overview",
  );
}

export async function getDashboardInsights(days = 30, userId?: string, workspaceId?: string | number) {
  const params = new URLSearchParams();
  params.set("days", String(days));
  if (userId?.trim()) params.set("userId", userId.trim());
  if (workspaceId != null && String(workspaceId).trim()) params.set("workspaceId", String(workspaceId).trim());
  return apiRequest<DashboardInsightsResponse>(
    `/dashboard/insights?${params.toString()}`,
  );
}

export async function getDashboardReports(limit = 10, userId?: string) {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (userId?.trim()) params.set("userId", userId.trim());
  return apiRequest<DashboardReportsResponse>(
    `/dashboard/reports?${params.toString()}`,
  );
}

export async function createReport(payload: {
  userId: string;
  name: string;
  type: "PDF" | "CSV";
  tasks: number;
  hours: number;
  periodDays?: number;
}) {
  return apiRequest<DashboardReport>("/dashboard/reports", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getUserReports(userId: string, limit = 10) {
  const params = new URLSearchParams();
  params.set("userId", userId);
  params.set("limit", String(limit));
  return apiRequest<DashboardReportsResponse>(
    `/dashboard/reports/user?${params.toString()}`,
  );
}

export async function listWorkspaceTasks(query: {
  workspaceId?: string;
  workspaceName?: string;
}) {
  const params = new URLSearchParams();
  if (query.workspaceId?.trim())
    params.set("workspaceId", query.workspaceId.trim());
  if (query.workspaceName?.trim())
    params.set("workspaceName", query.workspaceName.trim());

  return apiRequest<{
    workspaceId: string;
    workspaceName: string;
    total: number;
    tasks: Array<{
      id: string;
      title: string;
      description?: string | null;
      createdAt?: string;
      updatedAt?: string;
      columnId: string;
      columnName: string;
      columnType?: string;
      workspaceId: string;
      workspaceName: string;
    }>;
  }>(`/workspace/tasks/list?${params.toString()}`);
}

export async function createSocialPost(payload: {
  userId: string;
  content: string;
  networkIds?: string[];
  channelIds?: string[];
  visibility?: "PUBLIC" | "CHANNELS";
}) {
  return apiRequest<SocialPost>("/social/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createSocialPostWithMedia(
  media: File,
  userId: string,
  content?: string,
  channelIds?: string[],
  visibility?: "PUBLIC" | "CHANNELS",
) {
  const formData = new FormData();
  formData.append("media", media);
  formData.append("userId", userId);
  if (content) formData.append("content", content);
  if (channelIds?.length) formData.append("channelIds", JSON.stringify(channelIds));
  if (visibility) formData.append("visibility", visibility);

  const url = resolveUrl("/social/posts/with-media");
  const response = await fetch(url, { method: "POST", body: formData });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(normalizeErrorMessage(data, response.status));
  return data as SocialPost;
}

export async function sendChatMessageWithMedia(
  channelId: string,
  userId: string,
  media: File,
  content?: string,
  replyToId?: string,
) {
  const formData = new FormData();
  formData.append("media", media);
  formData.append("userId", userId);
  if (content) formData.append("content", content);
  if (replyToId) formData.append("replyToId", replyToId);

  const url = resolveUrl(`/chat/channels/${encodeURIComponent(channelId)}/messages/with-media`);
  const response = await fetch(url, { method: "POST", body: formData });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(normalizeErrorMessage(data, response.status));
  return data as ChatMessageData;
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

export async function listWorkspacesPaged(query?: WorkspacesQuery) {
  const params = new URLSearchParams();

  if (query?.status) params.set("status", query.status);
  if (query?.date) params.set("date", query.date);
  if (typeof query?.tzOffsetMinutes === "number")
    params.set("tzOffsetMinutes", String(query.tzOffsetMinutes));
  if (query?.field) params.set("field", query.field);
  if (query?.op) params.set("op", query.op);
  if (typeof query?.value === "string" && query.value.trim())
    params.set("value", query.value.trim());
  if (query?.excludeStatus?.length) {
    params.set("excludeStatus", query.excludeStatus.join(","));
  }
  if (query?.userId) params.set("userId", query.userId);
  if (typeof query?.page === "number") params.set("page", String(query.page));
  if (typeof query?.pageSize === "number")
    params.set("pageSize", String(query.pageSize));

  const suffix = params.toString();
  return apiRequest<PagedResult<Workspace>>(
    suffix ? `/workspace?${suffix}` : "/workspace",
  );
}

export async function listWorkspacesAll(
  query?: Omit<WorkspacesQuery, "page" | "pageSize">,
) {
  const pageSize = 100;
  const items: Workspace[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const result = await listWorkspacesPaged({
      ...query,
      page,
      pageSize,
    });
    items.push(...result.items);
    totalPages = result.totalPages;
    page += 1;
  }

  return items;
}

export async function listWorkspaces() {
  // Backward-compatible: most of the UI expects an array.
  return listWorkspacesAll();
}

export async function createWorkspace(payload: {
  name: string;
  description?: string;
  category?: string;
  channelName?: string;
  createdById?: number;
  githubEnabled?: boolean;
  calendarEnabled?: boolean;
  columns?: Array<{ name: string; position?: number; type?: string }>;
}) {
  return apiRequest<Workspace>("/workspace", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createWorkspaceBundle(payload: {
  name: string;
  description?: string;
  category?: string;
  channelName?: string;
  createdById?: number;
  githubEnabled?: boolean;
  calendarEnabled?: boolean;
  columns?: Array<{ name: string; position?: number; type?: string }>;
  tasks?: Array<{
    title: string;
    description?: string;
    columnName?: string;
    customFieldValues?: Record<string, unknown>;
  }>;
}) {
  return apiRequest<Workspace>("/workspace/bundle", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateWorkspace(
  workspaceId: string,
  payload: {
    name?: string;
    description?: string;
    category?: string;
    status?: string;
  },
) {
  return apiRequest<Workspace>(`/workspace/${workspaceId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteWorkspace(workspaceId: string) {
  return apiRequest<{ message: string }>(`/workspace/${workspaceId}`, {
    method: "DELETE",
  });
}

export async function createTask(
  workspaceId: string,
  payload: {
    title: string;
    description?: string;
    columnId?: string;
    assigneeId?: number;
    customFieldValues?: Record<string, unknown>;
  },
) {
  return apiRequest<{ id: string; title: string }>(
    `/workspace/${workspaceId}/tasks`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function clockIn(userId: string, expectedOut?: string) {
  return apiRequest<ShiftRecordApi>("/time-record/clock-in", {
    method: "POST",
    body: JSON.stringify({ userId, expectedOut }),
  });
}

export async function clockOut(
  userId: string,
  expectedOut: string,
  flagForApproval?: boolean,
) {
  return apiRequest<ShiftRecordApi>("/time-record/clock-out", {
    method: "POST",
    body: JSON.stringify({ userId, expectedOut, flagForApproval }),
  });
}

export async function listShifts(userId: string) {
  const encoded = encodeURIComponent(userId);
  return apiRequest<ShiftRecordApi[]>(`/time-record/shifts?userId=${encoded}`);
}

export async function requestLeave(payload: {
  userId: string;
  type: LeaveRequestApi["type"];
  date: string; // YYYY-MM-DD
  note?: string;
}) {
  return apiRequest<LeaveRequestApi>("/time-record/leave-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listLeaveRequests(userId: string) {
  const encoded = encodeURIComponent(userId);
  return apiRequest<LeaveRequestApi[]>(
    `/time-record/leave-requests?userId=${encoded}`,
  );
}

export async function signUp(payload: SignUpPayload) {
  return apiRequest<{
    message: string;
    token?: string;
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

export async function verifyEmail(token: string) {
  return apiRequest<{ message: string; token?: string }>(
    `/auth/verify-email?token=${encodeURIComponent(token)}`,
  );
}

export async function resendVerification(email: string) {
  return apiRequest<{ message: string }>("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
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
export async function chatAi(
  message: string,
  context?: ToolInput,
  confirmationId?: string,
  requireConfirmation?: boolean,
  sessionId?: number,
) {
  return chatWithAi(message, context, confirmationId, requireConfirmation, sessionId);
}

export async function getSocialPosts() {
  return listSocialPosts();
}

export async function createSocialComment(payload: {
  userId: string;
  postId: string;
  content: string;
  parentId?: string;
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
  return apiRequest<{ id: string; type: SocialReactionType }>(
    "/social/reactions",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
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

export async function getWorkspacesPaged(query?: WorkspacesQuery) {
  return listWorkspacesPaged(query);
}

export async function getWorkspaceById(workspaceId: string) {
  return apiRequest<Workspace>(`/workspace/${workspaceId}`);
}

export async function toggleWorkspaceGitHub(workspaceId: string, enabled: boolean) {
  return apiRequest<Workspace>(`/workspace/${workspaceId}`, {
    method: "PUT",
    body: JSON.stringify({ githubEnabled: enabled }),
  });
}

export async function toggleWorkspaceCalendar(workspaceId: string, enabled: boolean) {
  return apiRequest<Workspace>(`/workspace/${workspaceId}`, {
    method: "PUT",
    body: JSON.stringify({ calendarEnabled: enabled }),
  });
}

export async function createWorkspaceTask(
  workspaceId: string,
  payload: {
    title: string;
    description?: string;
    columnId?: string;
    assigneeId?: number;
    customFieldValues?: Record<string, unknown>;
  },
) {
  return createTask(workspaceId, payload);
}

export async function updateWorkspaceTask(
  workspaceId: string,
  taskId: string,
  payload: {
    title?: string;
    description?: string;
    assigneeId?: number | null;
    customFieldValues?: Record<string, unknown>;
  },
) {
  return apiRequest<{
    id: string;
    title: string;
    description?: string | null;
    customFieldValues?: Record<string, unknown> | null;
  }>(`/workspace/${workspaceId}/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function moveWorkspaceTask(
  workspaceId: string,
  taskId: string,
  payload: { status: string },
) {
  return apiRequest<{
    id: string;
    title: string;
    columnId: string;
  }>(`/workspace/${workspaceId}/tasks/${taskId}/move`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteWorkspaceTask(workspaceId: string, taskId: string) {
  return apiRequest<{ id: string; message: string }>(
    `/workspace/${workspaceId}/tasks/${taskId}`,
    {
      method: "DELETE",
    },
  );
}

// ========================================
// TASK COMMENTS
// ========================================

export interface TaskComment {
  id: number;
  content: string;
  createdAt: string;
  taskId: number;
  userId: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

export async function getTaskComments(workspaceId: string, taskId: string) {
  return apiRequest<TaskComment[]>(
    `/workspace/${workspaceId}/tasks/${taskId}/comments`,
  );
}

export async function createTaskComment(
  workspaceId: string,
  taskId: string,
  payload: { userId: string; content: string },
) {
  return apiRequest<TaskComment>(
    `/workspace/${workspaceId}/tasks/${taskId}/comments`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function deleteTaskComment(
  workspaceId: string,
  taskId: string,
  commentId: string,
  userId: string,
) {
  return apiRequest<{ id: string }>(
    `/workspace/${workspaceId}/tasks/${taskId}/comments/${commentId}`,
    {
      method: "DELETE",
      body: JSON.stringify({ userId }),
    },
  );
}

// ========================================
// TASK ATTACHMENTS
// ========================================

export interface TaskAttachment {
  id: number;
  filename: string;
  url: string;
  mimetype: string;
  size: number;
  createdAt: string;
  uploadedBy?: {
    id: number;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

export async function getTaskAttachments(workspaceId: string, taskId: string) {
  return apiRequest<TaskAttachment[]>(
    `/workspace/${workspaceId}/tasks/${taskId}/attachments`,
  );
}

export async function uploadTaskAttachment(
  workspaceId: string,
  taskId: string,
  file: File,
  userId?: string,
) {
  const formData = new FormData();
  formData.append("file", file);
  if (userId) formData.append("userId", userId);

  const url = resolveUrl(`/workspace/${workspaceId}/tasks/${taskId}/attachments`);
  const token = typeof window !== "undefined"
    ? localStorage.getItem("simpleflow_token") || ""
    : "";
  const response = await fetch(url, {
    method: "POST",
    body: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(normalizeErrorMessage(data, response.status));
  }
  return data as TaskAttachment;
}

export async function deleteTaskAttachment(
  workspaceId: string,
  taskId: string,
  attachmentId: string,
) {
  return apiRequest<{ id: string }>(
    `/workspace/${workspaceId}/tasks/${taskId}/attachments/${attachmentId}`,
    { method: "DELETE" },
  );
}

export async function getWorkspaceTaskLabels(workspaceId: string) {
  return apiRequest<{
    workspaceId: string;
    workspaceName: string;
    labels: Array<{ name: string; color: string }>;
  }>(`/workspace/${workspaceId}/labels`);
}

export async function addWorkspaceStatus(
  workspaceId: string,
  payload: { name: string },
) {
  return apiRequest<{
    id: string;
    name: string;
    position: number;
    type: string;
    boardId: string;
  }>(`/workspace/${workspaceId}/statuses`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateWorkspaceColumn(
  workspaceId: string,
  columnId: string,
  payload: { name: string },
) {
  return apiRequest<{
    id: string;
    name: string;
    position: number;
    type: string;
    boardId: string;
  }>(`/workspace/${workspaceId}/columns/${columnId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function createWorkspaceChannel(
  workspaceId: string,
  payload: { name: string; createdById: number },
) {
  return apiRequest<{ channelId: number; name: string }>(
    `/workspace/${workspaceId}/channel`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export async function deleteWorkspaceColumn(
  workspaceId: string,
  columnId: string,
) {
  return apiRequest<{ id: number; message: string }>(
    `/workspace/${workspaceId}/columns/${columnId}`,
    { method: "DELETE" },
  );
}

// ========================================
// WORKSPACE MEMBERS & INVITES
// ========================================

export async function listWorkspaceMembers(workspaceId: string) {
  return apiRequest<WorkspaceMember[]>(`/workspace/${workspaceId}/members`);
}

export async function addWorkspaceMember(workspaceId: string, userId: number) {
  return apiRequest<WorkspaceMember>(`/workspace/${workspaceId}/members`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export async function removeWorkspaceMember(
  workspaceId: string,
  userId: number,
) {
  return apiRequest<{ message: string }>(
    `/workspace/${workspaceId}/members/${userId}`,
    {
      method: "DELETE",
    },
  );
}

export async function inviteWorkspaceMember(
  workspaceId: string,
  email: string,
  invitedById: number,
) {
  return apiRequest<{
    autoAdded: boolean;
    member?: WorkspaceMember;
    invite?: unknown;
  }>(`/workspace/${workspaceId}/invites`, {
    method: "POST",
    body: JSON.stringify({ email, invitedById }),
  });
}

export async function getChannelMembersForInvite(
  workspaceId: string,
  userId: string,
) {
  return apiRequest<Array<WorkspaceUser & { channelName: string }>>(
    `/workspace/${workspaceId}/channel-members?userId=${encodeURIComponent(userId)}`,
  );
}

export async function searchUsersForWorkspace(
  query: string,
  excludeBoardId?: string,
) {
  const params = new URLSearchParams({ q: query });
  if (excludeBoardId) params.set("excludeBoardId", excludeBoardId);
  return apiRequest<WorkspaceUser[]>(
    `/workspace/users/search?${params.toString()}`,
  );
}

export function getCurrentUserId() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const raw = localStorage.getItem("simpleflow_auth_state");
    if (raw) {
      const parsed = JSON.parse(raw) as { user?: { id?: string | number } };
      if (parsed?.user?.id != null) {
        return String(parsed.user.id).trim();
      }
    }
  } catch {
    // no-op
  }

  return localStorage.getItem("simpleflow_user_id")?.trim() || "";
}

export type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  dateCreated: string;
};

export async function getUserProfile(userId: string) {
  const encoded = encodeURIComponent(userId);
  return apiRequest<UserProfile>(`/users/${encoded}/profile`);
}

export async function updateUserProfile(
  userId: string,
  payload: {
    bio?: string;
    avatarUrl?: string;
    coverUrl?: string;
    firstName?: string;
    lastName?: string;
  },
) {
  const encoded = encodeURIComponent(userId);
  return apiRequest<UserProfile>(`/users/${encoded}/profile`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function uploadProfileImage(
  userId: string,
  file: File,
  type: "avatar" | "cover",
) {
  const encoded = encodeURIComponent(userId);
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);

  const url = resolveUrl(`/users/${encoded}/profile/upload`);
  const token = typeof window !== "undefined"
    ? localStorage.getItem("simpleflow_token") || ""
    : "";
  const response = await fetch(url, {
    method: "POST",
    body: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(normalizeErrorMessage(data, response.status));
  return data as UserProfile;
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const encoded = encodeURIComponent(userId);
  return apiRequest<{ message: string }>(`/users/${encoded}/password`, {
    method: "PATCH",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

// ---------------------------------------------------------------------------
// Integrations (GitHub, Google Calendar)
// ---------------------------------------------------------------------------

// --- GitHub ---

export interface GitHubStatus {
  connected: boolean;
  githubUsername?: string;
  avatarUrl?: string;
  connectedAt?: string;
  activeRepos?: { id: number; repoFullName: string }[];
}

export interface GitHubRepoItem {
  fullName: string;
  name: string;
  private: boolean;
  language: string | null;
  updatedAt: string;
  enabled: boolean;
}

export interface GitHubEventItem {
  id: number;
  eventType: string;
  action: string | null;
  title: string;
  body: string | null;
  url: string;
  authorLogin: string;
  authorAvatar: string | null;
  branch: string | null;
  sha: string | null;
  prNumber: number | null;
  metadata: Record<string, unknown> | null;
  taskId: number | null;
  createdAt: string;
  repo: { repoFullName: string };
}

export async function getGitHubAuthUrl(userId: string) {
  return apiRequest<{ url: string }>(`/integrations/github/auth?userId=${userId}`);
}

export async function getGitHubStatus(userId: string) {
  return apiRequest<GitHubStatus>(`/integrations/github/status?userId=${userId}`);
}

export async function disconnectGitHub(userId: string) {
  return apiRequest<{ message: string }>(`/integrations/github/disconnect?userId=${userId}`, {
    method: "DELETE",
  });
}

export async function listGitHubRepos(userId: string) {
  return apiRequest<GitHubRepoItem[]>(`/integrations/github/repos?userId=${userId}`);
}

export async function enableGitHubRepo(userId: string, repoFullName: string) {
  const encoded = encodeURIComponent(repoFullName);
  return apiRequest(`/integrations/github/repos/${encoded}/enable?userId=${userId}`, {
    method: "POST",
  });
}

export async function disableGitHubRepo(userId: string, repoFullName: string) {
  const encoded = encodeURIComponent(repoFullName);
  return apiRequest(`/integrations/github/repos/${encoded}/disable?userId=${userId}`, {
    method: "DELETE",
  });
}

export async function getGitHubEvents(userId: string, taskId?: string) {
  const params = new URLSearchParams({ userId });
  if (taskId) params.set("taskId", taskId);
  return apiRequest<GitHubEventItem[]>(`/integrations/github/events?${params}`);
}

export async function listGitHubPRs(userId: string, search?: string, page = 1, pageSize = 10) {
  const params = new URLSearchParams({ userId, page: String(page), pageSize: String(pageSize) });
  if (search) params.set("search", search);
  return apiRequest<{
    items: GitHubEventItem[];
    total: number;
    page: number;
    totalPages: number;
  }>(`/integrations/github/prs?${params}`);
}

// --- Google Calendar ---

export interface GoogleCalendarStatus {
  connected: boolean;
  googleEmail?: string;
  connectedAt?: string;
  lastSyncAt?: string | null;
}

export interface CalendarEventItem {
  id: number;
  googleEventId: string;
  title: string;
  description: string | null;
  location: string | null;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  status: string;
  meetLink: string | null;
  attendees: { email: string; displayName?: string; responseStatus?: string }[] | null;
  organizer: string | null;
  taskId: number | null;
}

export async function getGoogleCalendarAuthUrl(userId: string) {
  return apiRequest<{ url: string }>(`/integrations/google-calendar/auth?userId=${userId}`);
}

export async function getGoogleCalendarStatus(userId: string) {
  return apiRequest<GoogleCalendarStatus>(`/integrations/google-calendar/status?userId=${userId}`);
}

export async function disconnectGoogleCalendar(userId: string) {
  return apiRequest<{ message: string }>(`/integrations/google-calendar/disconnect?userId=${userId}`, {
    method: "DELETE",
  });
}

export async function getCalendarEvents(userId: string, from?: string, to?: string) {
  const params = new URLSearchParams({ userId });
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  return apiRequest<CalendarEventItem[]>(`/integrations/google-calendar/events?${params}`);
}

export async function getTodayCalendarEvents(userId: string) {
  return apiRequest<CalendarEventItem[]>(`/integrations/google-calendar/events/today?userId=${userId}`);
}

export async function getUpcomingCalendarEvents(userId: string, days = 7) {
  return apiRequest<CalendarEventItem[]>(`/integrations/google-calendar/events/upcoming?userId=${userId}&days=${days}`);
}

export async function syncGoogleCalendar(userId: string) {
  return apiRequest<{ synced: number }>(`/integrations/google-calendar/sync?userId=${userId}`, {
    method: "POST",
  });
}

// ---------------------------------------------------------------------------
// Automations (Zapier-like workflow engine)
// ---------------------------------------------------------------------------

export type AutomationTriggerType =
  | "TASK_COMPLETED"
  | "TASK_MOVED"
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "POST_CREATED"
  | "CLOCK_IN"
  | "CLOCK_OUT"
  | "CRON";

export type AutomationActionType =
  | "SEND_EMAIL"
  | "CREATE_POST"
  | "CREATE_TASK"
  | "MOVE_TASK";

export type AutomationStatus = "ACTIVE" | "INACTIVE" | "ERROR";

export type ConditionOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "CONTAINS"
  | "NOT_CONTAINS"
  | "GREATER_THAN"
  | "LESS_THAN"
  | "GREATER_THAN_OR_EQUAL"
  | "LESS_THAN_OR_EQUAL"
  | "IS_EMPTY"
  | "IS_NOT_EMPTY"
  | "IN"
  | "NOT_IN";

export type ConditionLogicGate = "AND" | "OR";

export type AutomationCondition = {
  id?: string;
  field: string;
  operator: ConditionOperator;
  value?: string;
  logicGate: ConditionLogicGate;
  sortOrder: number;
};

export type AutomationData = {
  id: string;
  name: string;
  description?: string;
  userId: string;
  status: AutomationStatus;
  trigger?: {
    id: string;
    type: AutomationTriggerType;
    config?: Record<string, unknown>;
  };
  actions: Array<{
    id: string;
    type: AutomationActionType;
    config?: Record<string, unknown>;
    sortOrder: number;
  }>;
  conditions?: AutomationCondition[];
  logs?: Array<AutomationLogEntry>;
  runCount: number;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AutomationLogEntry = {
  id: string;
  automationId?: string;
  automationName?: string;
  triggerType: string;
  status: "SUCCESS" | "FAILED" | "SKIPPED";
  error?: string;
  executedAt: string;
  durationMs?: number;
};

export async function listAutomations(params?: {
  userId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.userId?.trim()) qs.set("userId", params.userId.trim());
  if (params?.status?.trim()) qs.set("status", params.status.trim());
  if (typeof params?.page === "number") qs.set("page", String(params.page));
  if (typeof params?.pageSize === "number")
    qs.set("pageSize", String(params.pageSize));
  const suffix = qs.toString();
  return apiRequest<PagedResult<AutomationData>>(
    suffix ? `/automations?${suffix}` : "/automations",
  );
}

export async function getAutomation(id: string) {
  const encoded = encodeURIComponent(id);
  return apiRequest<AutomationData>(`/automations/${encoded}`);
}

export async function createAutomation(payload: {
  name: string;
  description?: string;
  userId: string;
  trigger?: {
    type: AutomationTriggerType;
    config?: Record<string, unknown>;
  };
  actions?: Array<{
    type: AutomationActionType;
    config?: Record<string, unknown>;
    sortOrder: number;
  }>;
  conditions?: Array<{
    field: string;
    operator: ConditionOperator;
    value?: string;
    logicGate?: ConditionLogicGate;
    sortOrder?: number;
  }>;
}) {
  return apiRequest<AutomationData>("/automations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAutomation(
  id: string,
  payload: {
    name?: string;
    description?: string;
    trigger?: {
      type: AutomationTriggerType;
      config?: Record<string, unknown>;
    };
    actions?: Array<{
      type: AutomationActionType;
      config?: Record<string, unknown>;
      sortOrder: number;
    }>;
    conditions?: Array<{
      field: string;
      operator: ConditionOperator;
      value?: string;
      logicGate?: ConditionLogicGate;
      sortOrder?: number;
    }>;
  },
) {
  const encoded = encodeURIComponent(id);
  return apiRequest<AutomationData>(`/automations/${encoded}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function toggleAutomationStatus(
  id: string,
  status: AutomationStatus,
) {
  const encoded = encodeURIComponent(id);
  return apiRequest<AutomationData>(`/automations/${encoded}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteAutomation(id: string) {
  const encoded = encodeURIComponent(id);
  return apiRequest<{ message: string }>(`/automations/${encoded}`, {
    method: "DELETE",
  });
}

export async function getAutomationLogs(id: string) {
  const encoded = encodeURIComponent(id);
  const result = await apiRequest<
    PagedResult<AutomationLogEntry> | AutomationLogEntry[]
  >(`/automations/${encoded}/logs`);
  // Backend returns { items, page, ... } but callers expect a flat array
  if (Array.isArray(result)) return result;
  return (result as PagedResult<AutomationLogEntry>).items ?? [];
}

export async function testAutomation(id: string) {
  const encoded = encodeURIComponent(id);
  return apiRequest<{
    success: boolean;
    message: string;
    error?: string;
    triggerType: string;
  }>(`/automations/${encoded}/test`, { method: "POST" });
}

// ---------------------------------------------------------------------------
// Chat (Real-time messaging)
// ---------------------------------------------------------------------------

export type ChatUser = {
  id: number | string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
};

export type ChatMember = {
  id: number | string;
  channelId: number | string;
  userId: number | string;
  role: "ADMIN" | "MEMBER";
  isFavorite?: boolean;
  joinedAt: string;
  user: ChatUser;
};

export type ChatChannel = {
  id: number | string;
  name: string;
  description: string | null;
  icon: string | null;
  createdById: number | string;
  createdBy: ChatUser;
  createdAt: string;
  members: ChatMember[];
  _count?: { messages: number };
};

export type ChatMessageData = {
  id: number | string;
  channelId: number | string;
  userId: number | string;
  content: string;
  createdAt: string;
  user: ChatUser;
  replyToId?: number | null;
  replyTo?: {
    id: number;
    content: string;
    user: {
      id: number;
      firstName: string;
      lastName: string;
      avatarUrl?: string | null;
    };
  } | null;
  reactions?: Array<{
    id: number;
    emoji: string;
    userId: number;
    user: { id: number; firstName: string; lastName: string };
  }>;
};

export async function toggleChannelFavorite(channelId: string, userId: string) {
  return apiRequest<{ isFavorite: boolean }>(
    `/chat/channels/${encodeURIComponent(channelId)}/members/${encodeURIComponent(userId)}/favorite`,
    { method: "PATCH" },
  );
}

export async function getChatChannels(userId: string) {
  return apiRequest<ChatChannel[]>(
    `/chat/channels?userId=${encodeURIComponent(userId)}`,
  );
}

export async function getChatChannel(channelId: string) {
  return apiRequest<ChatChannel>(
    `/chat/channels/${encodeURIComponent(channelId)}`,
  );
}

export async function createChatChannel(data: {
  name: string;
  description?: string;
  icon?: string;
  userId: string;
}) {
  return apiRequest<ChatChannel>("/chat/channels", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateChatChannel(
  channelId: string,
  data: {
    userId: string;
    name?: string;
    description?: string;
    icon?: string;
  },
) {
  return apiRequest<ChatChannel>(
    `/chat/channels/${encodeURIComponent(channelId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
}

export async function uploadChannelIcon(
  channelId: string,
  userId: string,
  file: File,
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("userId", userId);

  const url = resolveUrl(
    `/chat/channels/${encodeURIComponent(channelId)}/icon`,
  );
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("simpleflow_token") || ""
      : "";
  const response = await fetch(url, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(normalizeErrorMessage(data, response.status));
  return data as ChatChannel;
}

export async function deleteChatChannel(channelId: string, userId: string) {
  return apiRequest<{ deleted: boolean }>(
    `/chat/channels/${encodeURIComponent(channelId)}`,
    {
      method: "DELETE",
      body: JSON.stringify({ userId }),
    },
  );
}

export async function getChatMessages(
  channelId: string,
  take = 50,
  cursor?: string,
) {
  const params = new URLSearchParams();
  params.set("take", String(take));
  if (cursor) params.set("cursor", cursor);
  return apiRequest<ChatMessageData[]>(
    `/chat/channels/${encodeURIComponent(channelId)}/messages?${params.toString()}`,
  );
}

export async function addChatMember(channelId: string, userId: string) {
  return apiRequest<ChatMember>(
    `/chat/channels/${encodeURIComponent(channelId)}/members`,
    {
      method: "POST",
      body: JSON.stringify({ userId }),
    },
  );
}

export async function removeChatMember(
  channelId: string,
  userId: string,
  requesterId: string,
) {
  return apiRequest<{ removed: boolean }>(
    `/chat/channels/${encodeURIComponent(channelId)}/members/${encodeURIComponent(userId)}`,
    { method: "DELETE", body: JSON.stringify({ requesterId }) },
  );
}

export async function inviteToChatChannel(
  channelId: string,
  email: string,
  invitedById: string,
) {
  return apiRequest<{
    id: string;
    email: string;
    status: string;
    autoAdded: boolean;
  }>(`/chat/channels/${encodeURIComponent(channelId)}/invites`, {
    method: "POST",
    body: JSON.stringify({ email, invitedById }),
  });
}

export async function sharePost(
  postId: string,
  userId: string,
  channelIds?: string[],
  visibility?: "PUBLIC" | "CHANNELS",
) {
  return apiRequest<{
    shares: unknown[];
    sourceLabel: string;
    authorName: string;
  }>(`/social/posts/${encodeURIComponent(postId)}/share`, {
    method: "POST",
    body: JSON.stringify({ userId, channelIds, visibility }),
  });
}

export async function sendChatMessage(
  channelId: string,
  userId: string,
  content: string,
  replyToId?: string,
) {
  return apiRequest<ChatMessageData>(
    `/chat/channels/${encodeURIComponent(channelId)}/messages`,
    { method: "POST", body: JSON.stringify({ userId, content, replyToId }) },
  );
}

export async function toggleChatReaction(
  channelId: string,
  messageId: string,
  userId: string,
  emoji: string,
) {
  return apiRequest<{ added: boolean; emoji: string }>(
    `/chat/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}/reactions`,
    { method: "POST", body: JSON.stringify({ userId, emoji }) },
  );
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export type NotificationType =
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_COMPLETED"
  | "TASK_MOVED"
  | "WORKSPACE_CREATED"
  | "INVITE_SENT"
  | "INVITE_ACCEPTED"
  | "AUTOMATION_EXECUTED"
  | "POST_CREATED"
  | "COMMENT_ADDED"
  | "GITHUB_EVENT"
  | "CALENDAR_EVENT";

export type NotificationData = {
  id: number;
  userId: number;
  actorId?: number | null;
  type: NotificationType;
  title: string;
  message: string;
  resourceType?: string | null;
  resourceId?: number | null;
  boardId?: number | null;
  isRead: boolean;
  createdAt: string;
  actor?: {
    id: number;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  } | null;
  board?: {
    id: number;
    name: string;
  } | null;
};

export type NotificationPreference = {
  id: number;
  userId: number;
  boardId: number;
  muted: boolean;
  updatedAt: string;
  board?: {
    id: number;
    name: string;
  };
};

export async function listNotifications(params?: {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
}) {
  const qs = new URLSearchParams();
  if (typeof params?.page === "number") qs.set("page", String(params.page));
  if (typeof params?.pageSize === "number")
    qs.set("pageSize", String(params.pageSize));
  if (params?.unreadOnly) qs.set("unreadOnly", "true");
  const suffix = qs.toString();
  return apiRequest<
    PagedResult<NotificationData> & { unreadCount: number }
  >(suffix ? `/notifications?${suffix}` : "/notifications");
}

export async function getUnreadNotificationCount() {
  return apiRequest<{ unreadCount: number }>("/notifications/unread-count");
}

export async function markNotificationAsRead(id: number) {
  return apiRequest<NotificationData>(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsAsRead() {
  return apiRequest<{ updated: number }>("/notifications/read-all", {
    method: "POST",
  });
}

export async function getNotificationPreferences() {
  return apiRequest<NotificationPreference[]>("/notifications/preferences");
}

export async function setNotificationPreference(
  boardId: number,
  muted: boolean,
) {
  return apiRequest<NotificationPreference>(
    `/notifications/preferences/${boardId}`,
    { method: "PUT", body: JSON.stringify({ muted }) },
  );
}

// ---------------------------------------------------------------------------
// Automation CRON helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------

export type TransactionType = "INCOME" | "EXPENSE";

export type TransactionData = {
  id: number;
  userId: number;
  type: TransactionType;
  amount: number;
  category: string;
  description: string | null;
  remarks: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
};

export type FinanceSummary = {
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  savingsRate: number;
  categories: Array<{ name: string; value: number }>;
  transactionCount: number;
};

export type MonthlyTrend = {
  month: string;
  income: number;
  expenses: number;
  savings: number;
};

export async function listTransactions(params?: {
  type?: TransactionType;
  category?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.type) qs.set("type", params.type);
  if (params?.category) qs.set("category", params.category);
  if (params?.startDate) qs.set("startDate", params.startDate);
  if (params?.endDate) qs.set("endDate", params.endDate);
  if (typeof params?.page === "number") qs.set("page", String(params.page));
  if (typeof params?.pageSize === "number")
    qs.set("pageSize", String(params.pageSize));
  const suffix = qs.toString();
  return apiRequest<PagedResult<TransactionData>>(
    suffix ? `/finances/transactions?${suffix}` : "/finances/transactions",
  );
}

export async function createTransaction(payload: {
  type: TransactionType;
  amount: number;
  category: string;
  description?: string;
  remarks?: string;
  date: string;
}) {
  return apiRequest<TransactionData>("/finances/transactions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTransaction(
  id: number,
  payload: {
    type?: TransactionType;
    amount?: number;
    category?: string;
    description?: string;
    remarks?: string;
    date?: string;
  },
) {
  return apiRequest<TransactionData>(`/finances/transactions/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteTransaction(id: number) {
  return apiRequest<TransactionData>(`/finances/transactions/${id}`, {
    method: "DELETE",
  });
}

export async function getFinanceSummary(month?: number, year?: number) {
  const qs = new URLSearchParams();
  if (typeof month === "number") qs.set("month", String(month));
  if (typeof year === "number") qs.set("year", String(year));
  const suffix = qs.toString();
  return apiRequest<FinanceSummary>(
    suffix ? `/finances/summary?${suffix}` : "/finances/summary",
  );
}

export async function getMonthlyTrend(months?: number) {
  const qs = new URLSearchParams();
  if (typeof months === "number") qs.set("months", String(months));
  const suffix = qs.toString();
  return apiRequest<MonthlyTrend[]>(
    suffix ? `/finances/monthly-trend?${suffix}` : "/finances/monthly-trend",
  );
}

export async function getFinanceCategories() {
  return apiRequest<Array<{ name: string; count: number }>>(
    "/finances/categories",
  );
}

// ---------------------------------------------------------------------------
// Organizations
// ---------------------------------------------------------------------------

export type OrgRole = "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";

export type OrgMember = {
  id: number;
  organizationId: number;
  userId: number;
  role: OrgRole;
  joinedAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  };
};

export type OrganizationData = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  members?: OrgMember[];
  myRole?: OrgRole;
  _count?: { members: number; boards: number };
};

export async function createOrganization(payload: {
  name: string;
  slug: string;
  description?: string;
}) {
  return apiRequest<OrganizationData>("/organizations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listMyOrganizations() {
  return apiRequest<OrganizationData[]>("/organizations");
}

export async function getOrganization(id: number) {
  return apiRequest<OrganizationData>(`/organizations/${id}`);
}

export async function updateOrganization(
  id: number,
  payload: { name?: string; description?: string; logoUrl?: string },
) {
  return apiRequest<OrganizationData>(`/organizations/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteOrganization(id: number) {
  return apiRequest<OrganizationData>(`/organizations/${id}`, {
    method: "DELETE",
  });
}

export async function listOrgMembers(orgId: number) {
  return apiRequest<OrgMember[]>(`/organizations/${orgId}/members`);
}

export async function addOrgMember(
  orgId: number,
  email: string,
  role?: OrgRole,
) {
  return apiRequest<OrgMember>(`/organizations/${orgId}/members`, {
    method: "POST",
    body: JSON.stringify({ email, role }),
  });
}

export async function updateOrgMemberRole(
  orgId: number,
  memberId: number,
  role: OrgRole,
) {
  return apiRequest<OrgMember>(
    `/organizations/${orgId}/members/${memberId}/role`,
    {
      method: "PATCH",
      body: JSON.stringify({ role }),
    },
  );
}

// ---------------------------------------------------------------------------
// Billing / Subscriptions
// ---------------------------------------------------------------------------

export type PlanTier = "FREE" | "STARTER" | "PRO" | "ENTERPRISE";

export type PlanData = {
  id: number;
  name: string;
  tier: PlanTier;
  priceMonthly: number;
  priceYearly: number;
  maxMembers: number;
  maxWorkspaces: number;
  features: string[];
  isActive: boolean;
};

export type SubscriptionData = {
  id: number;
  organizationId: number;
  planId: number;
  status: string;
  billingCycle: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  plan: PlanData;
  invoices?: Array<{
    id: number;
    amount: number;
    currency: string;
    status: string;
    invoiceUrl: string | null;
    paidAt: string | null;
    createdAt: string;
  }>;
};

export async function listPlans() {
  return apiRequest<PlanData[]>("/billing/plans");
}

export async function getSubscription(organizationId: number) {
  return apiRequest<SubscriptionData | null>(
    `/billing/subscription/${organizationId}`,
  );
}

export async function createFreeSubscription(organizationId: number) {
  return apiRequest<SubscriptionData>(
    `/billing/subscription/${organizationId}/free`,
    { method: "POST" },
  );
}

export async function createCheckout(payload: {
  organizationId: number;
  planTier: PlanTier;
  billingCycle: "monthly" | "yearly";
  successUrl: string;
  cancelUrl: string;
}) {
  return apiRequest<{ sessionId: string; url: string }>("/billing/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createBillingPortal(payload: {
  organizationId: number;
  returnUrl: string;
}) {
  return apiRequest<{ url: string }>("/billing/portal", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function removeOrgMember(orgId: number, memberId: number) {
  return apiRequest<{ id: number }>(
    `/organizations/${orgId}/members/${memberId}`,
    { method: "DELETE" },
  );
}

export async function syncCronJobs() {
  return apiRequest<{
    message: string;
    jobs: Array<{ automationId: number; cronExpression: string }>;
  }>("/automations/cron/sync", { method: "POST" });
}

export async function getCronJobs() {
  return apiRequest<Array<{ automationId: number; cronExpression: string }>>(
    "/automations/cron/jobs",
  );
}

// ─── Email Campaigns (Admin only) ─────────────────────

export type CampaignData = {
  id: number;
  name: string;
  subject: string;
  preheader?: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  templateId?: number;
  blocks: unknown[];
  listId: number;
  status: string;
  scheduledAt?: string;
  sentAt?: string;
  completedAt?: string;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalUnsubscribed: number;
  totalComplaints: number;
  createdAt: string;
  updatedAt: string;
  list?: { id: number; name: string };
  _count?: { recipients: number };
};

export type CampaignStats = CampaignData & {
  openRate: string;
  clickRate: string;
  bounceRate: string;
  unsubscribeRate: string;
};

export type ContactData = {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  status: string;
  tags: string[];
  createdAt: string;
  lists?: { list: { id: number; name: string } }[];
};

export type ContactListData = {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  _count?: { members: number };
};

export type EmailTemplateData = {
  id: number;
  name: string;
  subject: string;
  preheader?: string;
  blocks: unknown[];
  globalStyles?: unknown;
  createdAt: string;
  updatedAt: string;
};

export type CampaignRecipientData = {
  id: number;
  status: string;
  sentAt?: string;
  firstOpenAt?: string;
  lastOpenAt?: string;
  openCount: number;
  clickCount: number;
  device?: string;
  emailClient?: string;
  contact: { id: number; email: string; firstName?: string; lastName?: string };
};

// Campaigns
export async function listCampaigns(params?: { status?: string; page?: number; pageSize?: number }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  const suffix = qs.toString();
  return apiRequest<{ data: CampaignData[]; total: number; page: number; totalPages: number }>(
    suffix ? `/campaigns?${suffix}` : "/campaigns",
  );
}

export async function getCampaign(id: number) {
  return apiRequest<CampaignData>(`/campaigns/${id}`);
}

export async function createCampaign(data: {
  name: string; subject: string; fromName: string; fromEmail: string;
  blocks: unknown[]; listId: number; preheader?: string; replyTo?: string; templateId?: number; scheduledAt?: string;
}) {
  return apiRequest<CampaignData>("/campaigns", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCampaign(id: number, data: Partial<CampaignData>) {
  return apiRequest<CampaignData>(`/campaigns/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteCampaign(id: number) {
  return apiRequest<CampaignData>(`/campaigns/${id}`, { method: "DELETE" });
}

export async function sendCampaign(id: number) {
  return apiRequest<{ message: string; recipientCount: number }>(`/campaigns/${id}/send`, { method: "POST" });
}

export async function getCampaignStats(id: number) {
  return apiRequest<CampaignStats>(`/campaigns/${id}/stats`);
}

export async function getCampaignRecipients(id: number, params?: { status?: string; page?: number }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.page) qs.set("page", String(params.page));
  const suffix = qs.toString();
  return apiRequest<{ data: CampaignRecipientData[]; total: number; page: number; totalPages: number }>(
    suffix ? `/campaigns/${id}/recipients?${suffix}` : `/campaigns/${id}/recipients`,
  );
}

export async function getCampaignClicks(id: number) {
  return apiRequest<{ url: string; clicks: number }[]>(`/campaigns/${id}/clicks`);
}

export async function getCampaignTimeline(id: number) {
  return apiRequest<{ time: string; opens: number; clicks: number }[]>(`/campaigns/${id}/timeline`);
}

// Contacts
export async function listContacts(params?: { search?: string; listId?: number; page?: number; pageSize?: number }) {
  const qs = new URLSearchParams();
  if (params?.search) qs.set("search", params.search);
  if (params?.listId) qs.set("listId", String(params.listId));
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  const suffix = qs.toString();
  return apiRequest<{ data: ContactData[]; total: number; page: number; totalPages: number }>(
    suffix ? `/contacts?${suffix}` : "/contacts",
  );
}

export async function createContact(data: { email: string; firstName?: string; lastName?: string; phone?: string; company?: string; tags?: string[] }) {
  return apiRequest<ContactData>("/contacts", { method: "POST", body: JSON.stringify(data) });
}

export async function updateContact(id: number, data: Partial<ContactData>) {
  return apiRequest<ContactData>(`/contacts/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteContact(id: number) {
  return apiRequest<ContactData>(`/contacts/${id}`, { method: "DELETE" });
}

export async function importContacts(contacts: { email: string; firstName?: string; lastName?: string; company?: string }[]) {
  return apiRequest<{ created: number; skipped: number; total: number }>("/contacts/import", {
    method: "POST",
    body: JSON.stringify({ contacts }),
  });
}

// Contact Lists
export async function listContactLists() {
  return apiRequest<ContactListData[]>("/contacts/lists");
}

export async function createContactList(data: { name: string; description?: string }) {
  return apiRequest<ContactListData>("/contacts/lists", { method: "POST", body: JSON.stringify(data) });
}

export async function deleteContactList(id: number) {
  return apiRequest<ContactListData>(`/contacts/lists/${id}`, { method: "DELETE" });
}

export async function addContactsToList(listId: number, contactIds: number[]) {
  return apiRequest<ContactListData>(`/contacts/lists/${listId}/contacts`, {
    method: "POST",
    body: JSON.stringify({ contactIds }),
  });
}

// Email Templates
export async function listEmailTemplates() {
  return apiRequest<EmailTemplateData[]>("/campaigns/templates/list");
}

export async function createEmailTemplate(data: { name: string; subject: string; blocks: unknown[]; preheader?: string; globalStyles?: unknown }) {
  return apiRequest<EmailTemplateData>("/campaigns/templates", { method: "POST", body: JSON.stringify(data) });
}

export async function updateEmailTemplate(id: number, data: Partial<EmailTemplateData>) {
  return apiRequest<EmailTemplateData>(`/campaigns/templates/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteEmailTemplate(id: number) {
  return apiRequest<EmailTemplateData>(`/campaigns/templates/${id}`, { method: "DELETE" });
}

// Current user role check
export async function getCurrentUserProfile() {
  return apiRequest<{ id: number; email: string; firstName: string; lastName: string; role: string }>("/users/me");
}
