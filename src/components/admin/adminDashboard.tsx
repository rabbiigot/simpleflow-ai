import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Search,
  Shield,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AdminOrganizations } from "./adminOrganizations";
import { AdminFeedback } from "./adminFeedback";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:3000";

const FEATURE_KEYS = [
  { key: "campaign", label: "Campaign" },
  { key: "insights", label: "Insights" },
  { key: "automation", label: "Automation" },
  { key: "finance", label: "Finance" },
  { key: "ai", label: "AI Assistant" },
] as const;

type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "USER" | "ADMIN";
  isActive: boolean;
  emailVerified: boolean;
  avatarUrl: string | null;
  featureFlags: Record<string, boolean> | null;
  dateCreated: string;
  lastLoginAt: string | null;
};

type Props = {
  token: string;
  onLogout: () => void;
};

export function AdminDashboard({ token, onLogout }: Props) {
  const [view, setView] = useState<"organizations" | "users" | "feedback">("organizations");
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchUsers = useCallback(
    async (searchTerm: string, p: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(p), pageSize: "10" });
        if (searchTerm) params.set("search", searchTerm);

        const res = await fetch(`${API_BASE}/admin/users?${params}`, {
          headers: { "x-admin-token": token },
        });

        if (res.status === 401) {
          toast.error("Admin session expired");
          onLogout();
          return;
        }

        const data = await res.json();
        setUsers(data.users);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch {
        toast.error("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    },
    [token, onLogout],
  );

  useEffect(() => {
    fetchUsers("", 1);
  }, [fetchUsers]);

  const handleSearch = (value: string) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchUsers(value, 1);
    }, 300);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchUsers(search, newPage);
  };

  const toggleRole = async (user: User) => {
    const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    try {
      const res = await fetch(`${API_BASE}/admin/users/${user.id}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) throw new Error();

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)),
      );
      toast.success(`${user.firstName} is now ${newRole}`);
    } catch {
      toast.error("Failed to update role");
    }
  };

  const toggleFeature = async (
    user: User,
    featureKey: string,
    enabled: boolean,
  ) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${user.id}/features`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ [featureKey]: enabled }),
      });

      if (!res.ok) throw new Error();

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                featureFlags: { ...(u.featureFlags || {}), [featureKey]: enabled },
              }
            : u,
        ),
      );
    } catch {
      toast.error("Failed to update feature access");
    }
  };

  const toggleActive = async (user: User) => {
    try {
      const res = await fetch(
        `${API_BASE}/admin/users/${user.id}/toggle-active`,
        {
          method: "PATCH",
          headers: { "x-admin-token": token },
        },
      );

      if (!res.ok) throw new Error();

      const data = await res.json();
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, isActive: data.isActive } : u,
        ),
      );
      toast.success(
        `${user.firstName} is now ${data.isActive ? "active" : "deactivated"}`,
      );
    } catch {
      toast.error("Failed to toggle user status");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">SimpleFlow Admin</h1>
              <p className="text-xs text-muted-foreground">
                Organizations &amp; Accounts
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-1 rounded-lg border p-0.5 md:flex-none">
              <Button
                variant={view === "organizations" ? "default" : "ghost"}
                size="sm"
                className="flex-1 md:flex-none"
                onClick={() => setView("organizations")}
              >
                <Building2 className="mr-2 h-4 w-4" />
                Organizations
              </Button>
              <Button
                variant={view === "users" ? "default" : "ghost"}
                size="sm"
                className="flex-1 md:flex-none"
                onClick={() => setView("users")}
              >
                <Users className="mr-2 h-4 w-4" />
                Accounts
              </Button>
              <Button
                variant={view === "feedback" ? "default" : "ghost"}
                size="sm"
                className="flex-1 md:flex-none"
                onClick={() => setView("feedback")}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Feedback
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {view === "organizations" ? (
        <AdminOrganizations token={token} onLogout={onLogout} />
      ) : view === "feedback" ? (
        <AdminFeedback token={token} onLogout={onLogout} />
      ) : (
      /* Content */
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {/* Stats & Search */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{total} total users</span>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                {FEATURE_KEYS.map((f) => (
                  <TableHead key={f.key} className="text-center">
                    {f.label}
                  </TableHead>
                ))}
                <TableHead className="text-center">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4 + FEATURE_KEYS.length}
                    className="py-12 text-center text-muted-foreground"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4 + FEATURE_KEYS.length}
                    className="py-12 text-center text-muted-foreground"
                  >
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.role === "ADMIN" ? "default" : "secondary"
                        }
                        className="cursor-pointer"
                        onClick={() => toggleRole(user)}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {user.emailVerified ? (
                          <Badge variant="active">Verified</Badge>
                        ) : (
                          <Badge variant="editing">Unverified</Badge>
                        )}
                      </div>
                    </TableCell>
                    {FEATURE_KEYS.map((f) => (
                      <TableCell key={f.key} className="text-center">
                        <Switch
                          checked={user.featureFlags?.[f.key] ?? false}
                          onCheckedChange={(checked) =>
                            toggleFeature(user, f.key, checked)
                          }
                        />
                      </TableCell>
                    ))}
                    <TableCell className="text-center">
                      <Switch
                        checked={user.isActive}
                        onCheckedChange={() => toggleActive(user)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>

          {/* Pagination */}
          {totalPages >= 1 && (
            <div className="flex flex-col gap-2 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-muted-foreground">
                Showing {Math.min((page - 1) * 10 + 1, total)}–{Math.min(page * 10, total)} of {total}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => handlePageChange(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
