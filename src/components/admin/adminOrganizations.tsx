import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Building2,
  ChevronLeft,
  ChevronRight,
  Search,
  User,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:3000";

const TIERS = ["FREE", "PRO", "TEAM", "ENTERPRISE"] as const;

type OrgRow = {
  type: "org" | "user";
  id: number;
  name: string;
  ownerEmail: string | null;
  planTier: string;
  planName: string;
  status: string;
  memberCount: number;
  createdAt: string;
};

type OrgDetail = {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  owner: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  members: Array<{
    id: number;
    role: string;
    user: { id: number; firstName: string; lastName: string; email: string };
  }>;
  subscription: {
    status: string;
    billingCycle: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string | null;
    plan: { name: string; tier: string; priceMonthly: number };
    invoices: Array<{
      id: number;
      amount: number;
      currency: string;
      status: string;
      paidAt: string | null;
      createdAt: string;
    }>;
  } | null;
  usage: {
    plan: { name: string; tier: string };
    usage: Record<string, { used: number; limit: number }>;
  };
  boards: Array<{
    id: number;
    name: string;
    isPersonal: boolean;
    owner: { firstName: string; lastName: string; email: string } | null;
    _count: { tasks: number };
  }>;
  totalTasks: number;
};

type Props = {
  token: string;
  onLogout: () => void;
};

export function AdminOrganizations({ token, onLogout }: Props) {
  const [rows, setRows] = useState<OrgRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const authFetch = useCallback(
    async (path: string, init?: RequestInit) => {
      const res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
          "x-admin-token": token,
          "Content-Type": "application/json",
          ...(init?.headers || {}),
        },
      });
      if (res.status === 401) {
        toast.error("Admin session expired");
        onLogout();
        throw new Error("unauthorized");
      }
      return res;
    },
    [token, onLogout],
  );

  const fetchOrgs = useCallback(
    async (searchTerm: string, p: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(p), pageSize: "10" });
        if (searchTerm) params.set("search", searchTerm);
        const res = await authFetch(`/admin/organizations?${params}`);
        const data = await res.json();
        setRows(data.rows);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch {
        // handled in authFetch / swallow
      } finally {
        setLoading(false);
      }
    },
    [authFetch],
  );

  useEffect(() => {
    fetchOrgs("", 1);
  }, [fetchOrgs]);

  const handleSearch = (value: string) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchOrgs(value, 1);
    }, 300);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchOrgs(search, newPage);
  };

  if (selectedOrgId != null) {
    return (
      <OrgDetailView
        orgId={selectedOrgId}
        authFetch={authFetch}
        onBack={() => {
          setSelectedOrgId(null);
          fetchOrgs(search, page);
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span>{total} organizations &amp; accounts</span>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Members</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  Nothing found
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={`${row.type}-${row.id}`}
                  className={row.type === "org" ? "cursor-pointer" : ""}
                  onClick={
                    row.type === "org"
                      ? () => setSelectedOrgId(row.id)
                      : undefined
                  }
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                        {row.type === "org" ? (
                          <Building2 className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{row.name}</div>
                        {row.type === "user" && (
                          <div className="text-xs text-muted-foreground">
                            No organization
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.ownerEmail ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.planTier === "FREE" ? "secondary" : "default"}>
                      {row.planName}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.status === "ACTIVE" ? "active" : "editing"}>
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {row.memberCount}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>

        {totalPages >= 1 && (
          <div className="flex flex-col gap-2 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-muted-foreground">
              Showing {Math.min((page - 1) * 10 + 1, total)}–
              {Math.min(page * 10, total)} of {total}
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
  );
}

function OrgDetailView({
  orgId,
  authFetch,
  onBack,
}: {
  orgId: number;
  authFetch: (path: string, init?: RequestInit) => Promise<Response>;
  onBack: () => void;
}) {
  const [detail, setDetail] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/admin/organizations/${orgId}`);
      setDetail(await res.json());
    } catch {
      toast.error("Failed to load organization");
    } finally {
      setLoading(false);
    }
  }, [authFetch, orgId]);

  useEffect(() => {
    load();
  }, [load]);

  const changePlan = async (planTier: string) => {
    setBusy(true);
    try {
      await authFetch(`/admin/organizations/${orgId}/subscription`, {
        method: "PATCH",
        body: JSON.stringify({ planTier }),
      });
      toast.success(`Plan changed to ${planTier}`);
      await load();
    } catch {
      toast.error("Failed to change plan");
    } finally {
      setBusy(false);
    }
  };

  const cancelSub = async () => {
    if (!window.confirm("Cancel this subscription and move to Free?")) return;
    setBusy(true);
    try {
      await authFetch(`/admin/organizations/${orgId}/subscription/cancel`, {
        method: "POST",
        body: JSON.stringify({ immediate: true }),
      });
      toast.success("Subscription canceled");
      await load();
    } catch {
      toast.error("Failed to cancel");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to list
      </Button>

      {loading || !detail ? (
        <div className="py-12 text-center text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-6">
          {/* Org + owner */}
          <div className="rounded-lg border bg-card p-5">
            <h2 className="text-xl font-semibold">{detail.name}</h2>
            <p className="text-sm text-muted-foreground">/{detail.slug}</p>
            {detail.owner && (
              <p className="mt-2 text-sm">
                Owner: {detail.owner.firstName} {detail.owner.lastName} ·{" "}
                <span className="text-muted-foreground">
                  {detail.owner.email}
                </span>
              </p>
            )}
          </div>

          {/* Subscription */}
          <div className="rounded-lg border bg-card p-5">
            <h3 className="mb-3 text-lg font-semibold">Subscription</h3>
            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
              <Badge variant="default">
                {detail.subscription?.plan.name ?? "Free"}
              </Badge>
              <Badge
                variant={
                  detail.subscription?.status === "ACTIVE" ? "active" : "editing"
                }
              >
                {detail.subscription?.status ?? "NONE"}
              </Badge>
              {detail.subscription?.cancelAtPeriodEnd && (
                <span className="text-xs text-amber-600">Cancels at period end</span>
              )}
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Change plan
                </label>
                <select
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={detail.subscription?.plan.tier ?? "FREE"}
                  disabled={busy}
                  onChange={(e) => changePlan(e.target.value)}
                >
                  {TIERS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-amber-400/40 text-amber-600 hover:bg-amber-50"
                onClick={cancelSub}
                disabled={busy || detail.subscription?.plan.tier === "FREE"}
              >
                Cancel subscription
              </Button>
            </div>
          </div>

          {/* Usage */}
          <div className="rounded-lg border bg-card p-5">
            <h3 className="mb-3 text-lg font-semibold">Usage</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {Object.entries(detail.usage.usage).map(([key, m]) => (
                <div key={key} className="rounded-lg border p-3">
                  <p className="text-xs capitalize text-muted-foreground">
                    {key.replace(/([A-Z])/g, " $1")}
                  </p>
                  <p className="text-sm font-medium">
                    {m.used} / {m.limit < 0 ? "∞" : m.limit}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Workspaces */}
          <div className="rounded-lg border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Workspaces ({detail.boards.length})
              </h3>
              <span className="text-sm text-muted-foreground">
                {detail.totalTasks} total tasks
              </span>
            </div>
            {detail.boards.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No workspaces in this organization yet.
              </p>
            ) : (
              <div className="space-y-2">
                {detail.boards.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {b.name}
                        {b.isPersonal && (
                          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                            Personal
                          </span>
                        )}
                      </p>
                      {b.owner && (
                        <p className="truncate text-xs text-muted-foreground">
                          {b.owner.firstName} {b.owner.lastName} · {b.owner.email}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      {b._count.tasks} {b._count.tasks === 1 ? "task" : "tasks"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Members */}
          <div className="rounded-lg border bg-card p-5">
            <h3 className="mb-3 text-lg font-semibold">
              Members ({detail.members.length})
            </h3>
            <div className="space-y-2">
              {detail.members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {m.user.firstName} {m.user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{m.user.email}</p>
                  </div>
                  <Badge variant="secondary">{m.role}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Invoices */}
          {detail.subscription?.invoices &&
            detail.subscription.invoices.length > 0 && (
              <div className="rounded-lg border bg-card p-5">
                <h3 className="mb-3 text-lg font-semibold">Invoices</h3>
                <div className="space-y-2">
                  {detail.subscription.invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between rounded-lg border p-3 text-sm"
                    >
                      <span>
                        {inv.currency.toUpperCase()} {inv.amount.toFixed(2)}
                      </span>
                      <Badge variant={inv.status === "PAID" ? "active" : "editing"}>
                        {inv.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
