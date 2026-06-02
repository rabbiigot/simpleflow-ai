import { InsightsHeader } from "@/components/insights/insightsHeader";
import { MetricsOverview } from "@/components/insights/metricsOverview";
import { ProductivityChart } from "@/components/insights/productivityChart";
import { ReportsTable } from "@/components/insights/reportsTable";
import { TaskCompletionChart } from "@/components/insights/taskCompletionChart";
import { TimeAllocationChart } from "@/components/insights/timeAllocationChart";
import { Card, CardContent } from "@/components/ui/card";
import {
  chatWithAi,
  getCurrentUserId,
  getDashboardInsights,
  getWorkspacesPaged,
  getUserReports,
  type DashboardInsightsResponse,
  type DashboardReportsResponse,
} from "@/lib/backend-api";
import { useAuthStore } from "@/store/auth-store";
import { Loader2, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const InsightsContainer = () => {
  const authUser = useAuthStore((s) => s.user);
  const isAdmin = authUser?.role === "ADMIN";
  const [days, setDays] = useState(30);
  const [insights, setInsights] = useState<DashboardInsightsResponse | null>(
    null,
  );
  const [reports, setReports] = useState<DashboardReportsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("all");

  const fetchData = useCallback((numDays: number, wsId?: string) => {
    setIsLoading(true);
    setError(null);
    const rawUserId = getCurrentUserId();
    const userId = isAdmin ? undefined : rawUserId || undefined;
    const workspaceId = wsId && wsId !== "all" ? wsId : undefined;
    Promise.all([
      getDashboardInsights(numDays, userId, workspaceId),
      rawUserId ? getUserReports(rawUserId, 10) : Promise.resolve({ reports: [], generatedAt: new Date().toISOString() }),
    ])
      .then(([insightsData, reportsData]) => {
        setInsights(insightsData);
        setReports(reportsData);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [isAdmin]);

  useEffect(() => {
    const userId = isAdmin ? undefined : getCurrentUserId() || undefined;
    getWorkspacesPaged({ userId, pageSize: 100 })
      .then((res) => setWorkspaces(res.items.map((w) => ({ id: w.id, name: w.name }))))
      .catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    fetchData(days, selectedWorkspaceId);
  }, [days, selectedWorkspaceId, fetchData]);

  const [promptValue, setPromptValue] = useState("");
  const [promptQuestion, setPromptQuestion] = useState<string | null>(null);
  const [promptResponse, setPromptResponse] = useState<string | null>(null);
  const [isPromptLoading, setIsPromptLoading] = useState(false);

  const handlePromptSubmit = useCallback(() => {
    const trimmed = promptValue.trim();
    if (!trimmed || isPromptLoading) return;
    setIsPromptLoading(true);
    setPromptQuestion(trimmed);
    setPromptResponse(null);
    const userId = getCurrentUserId();
    const context: Record<string, unknown> = {};
    if (userId) context.userId = userId;
    const wsId = selectedWorkspaceId !== "all" ? selectedWorkspaceId : undefined;
    if (wsId) {
      context.workspaceId = wsId;
      const ws = workspaces.find((w) => w.id === wsId);
      if (ws) context.workspaceName = ws.name;
    }
    chatWithAi(trimmed, context)
      .then((result) => {
        setPromptResponse(result.message);
        setPromptValue("");
      })
      .catch((err: Error) => setPromptResponse(`Error: ${err.message}`))
      .finally(() => setIsPromptLoading(false));
  }, [promptValue, isPromptLoading, selectedWorkspaceId, workspaces]);

  const handleDaysChange = useCallback((newDays: number) => {
    setDays(newDays);
  }, []);

  const handleReportCreated = useCallback(() => {
    const userId = getCurrentUserId();
    if (!userId) return;
    getUserReports(userId, 10)
      .then(setReports)
      .catch(() => {});
  }, []);

  const fallback = useMemo<DashboardInsightsResponse>(() => {
    return {
      periodDays: days,
      metrics: {
        tasksCompleted: 0,
        hoursTracked: 0,
        productivityScore: 0,
        avgTaskMinutes: 0,
      },
      productivityTrend: [],
      taskStatusOverview: [],
      timeAllocation: [],
      reports: [],
      generatedAt: new Date().toISOString(),
    };
  }, [days]);

  const data = insights || fallback;
  const reportsData = reports?.reports || data.reports;

  return (
    <div className="page-shell">
      <p className="section-label">Insights & Reports</p>
      <div className="mx-auto max-w-8xl space-y-6">
        <InsightsHeader
          days={days}
          onDaysChange={handleDaysChange}
          metrics={data.metrics}
          reports={reportsData}
          onReportCreated={handleReportCreated}
          workspaces={workspaces}
          selectedWorkspaceId={selectedWorkspaceId}
          onWorkspaceChange={setSelectedWorkspaceId}
          promptValue={promptValue}
          onPromptChange={setPromptValue}
          onPromptSubmit={handlePromptSubmit}
          isPromptLoading={isPromptLoading}
          aiQuestion={promptQuestion}
          aiResponse={promptResponse}
          productivityTrend={data.productivityTrend}
          taskStatusOverview={data.taskStatusOverview}
          timeAllocation={data.timeAllocation}
        />

        {isPromptLoading && (
          <Card>
            <CardContent className="pt-4 pb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing your data...
            </CardContent>
          </Card>
        )}

        {promptResponse && !isPromptLoading && (
          <Card>
            <CardContent className="pt-4 pb-4 space-y-3">
              {promptQuestion && (
                <div className="flex gap-2">
                  <span className="text-xs font-semibold text-muted-foreground shrink-0 mt-0.5">Question:</span>
                  <p className="text-sm text-foreground">{promptQuestion}</p>
                </div>
              )}
              <div className="flex gap-2">
                <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-muted-foreground">Response:</span>
                  <p className="text-sm text-foreground whitespace-pre-wrap mt-0.5">{promptResponse}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-4 text-sm text-amber-700">
              {error}
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Loading insights data...</span>
          </div>
        )}

        <MetricsOverview metrics={data.metrics} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-tour="insights-charts">
          <ProductivityChart data={data.productivityTrend} />
          <TaskCompletionChart data={data.taskStatusOverview} />
        </div>

        <TimeAllocationChart data={data.timeAllocation} />

        <ReportsTable reports={reportsData} />
      </div>
    </div>
  );
};

export default InsightsContainer;
