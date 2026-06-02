import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  getCurrentUserId,
  getDashboardOverview,
  type DashboardOverviewResponse,
} from "@/lib/backend-api";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Calendar,
  CheckCircle,
  ChevronDown,
  Clock,
  DollarSign,
  Loader2,
  Target,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const DASHBOARD_VISITED_KEY = "simpleflow_dashboard_visited";

const DashboardContainer = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAiInsightOpen, setIsAiInsightOpen] = useState(false);
  const [isFirstVisit] = useState(() => {
    if (typeof window === "undefined") return true;
    const visited = sessionStorage.getItem(DASHBOARD_VISITED_KEY);
    sessionStorage.setItem(DASHBOARD_VISITED_KEY, "true");
    return !visited;
  });

  useEffect(() => {
    const userId = getCurrentUserId();
    getDashboardOverview(userId || undefined)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, []);

  const fallback = useMemo<DashboardOverviewResponse>(() => {
    return {
      summary: {
        activeGoals: 0,
        tasksCompleted: 0,
        totalTasks: 0,
        successRate: 0,
        monthlyHoursTracked: 0,
        monthlyPosts: 0,
      },
      goals: [],
      todayTasks: [],
      aiInsight: {
        title: "AI Insight",
        summary:
          "No data yet. Start creating workspaces and tasks to unlock insights.",
        highlights: [],
        recommendations: [],
      },
      generatedAt: new Date().toISOString(),
    };
  }, []);

  const overview = data || fallback;

  return (
    <div className="page-shell">
      <p className="section-label">Dashboard</p>
      <div className="section-stack mb-6">
        <h1 className="text-3xl font-bold text-balance">
          {isFirstVisit ? "Welcome back!" : "Here's your overview"}
        </h1>
        <p className="mt-2 text-pretty text-muted-foreground">
          Live activity from your workspaces, tasks, social feed, and AI
          insights.
        </p>
      </div>

      {error && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="pt-4 text-sm text-amber-700">
            Unable to load dashboard data. Showing default view — create
            workspaces and tasks to get started.
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12 mb-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading dashboard data...</span>
        </div>
      ) : null}

      <Card className="mb-6 border-primary/20 bg-primary/5" data-tour="dashboard-ai-insight">
        <CardContent className="p-0">
          <button
            type="button"
            onClick={() => setIsAiInsightOpen((prev) => !prev)}
            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-primary"
          >
            <span className="inline-flex items-center gap-2 text-base font-semibold">
              <Bot className="h-5 w-5" />
              {overview.aiInsight.title}
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-300 ${
                isAiInsightOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isAiInsightOpen
                ? "max-h-[520px] opacity-100 pb-3 px-3"
                : "max-h-0 opacity-0 px-3 pb-0"
            }`}
          >
            <CardDescription className="mt-1 text-primary/90">
              {overview.aiInsight.summary}
            </CardDescription>
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">
                  Highlights
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {overview.aiInsight.highlights.map((item, idx) => (
                    <li key={`highlight-${idx}`}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">
                  Recommendations
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {overview.aiInsight.recommendations.map((item, idx) => (
                    <li key={`rec-${idx}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-tour="dashboard-summary">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {overview.summary.activeGoals}
            </div>
            <p className="text-xs text-muted-foreground">Workspaces tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tasks Completed
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {overview.summary.tasksCompleted}
            </div>
            <p className="text-xs text-muted-foreground">
              of {overview.summary.totalTasks} total tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {overview.summary.successRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Completion efficiency
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Hours</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {overview.summary.monthlyHoursTracked}h
            </div>
            <p className="text-xs text-muted-foreground">
              Time tracked this month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card data-tour="dashboard-goals">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Current Goals
            </CardTitle>
            <CardDescription>
              Workspace progress from live task completion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.goals.length === 0 ? (
              <div className="flex flex-col items-center py-4 text-center">
                <Target className="mb-2 h-8 w-8 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No workspaces yet. Create your first workspace to track goals
                  here.
                </p>
              </div>
            ) : (
              overview.goals.slice(0, 5).map((goal) => (
                <div key={goal.workspaceId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{goal.name}</span>
                    <Badge variant="active">{goal.progress}%</Badge>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {goal.completedTasks}/{goal.totalTasks} tasks completed
                  </p>
                </div>
              ))
            )}
            <Button
              className="mt-2 w-full bg-transparent"
              variant="outline"
              onClick={() => navigate({ to: "/workspace" })}
            >
              View All Workspaces
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card data-tour="dashboard-today">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Today&apos;s Tasks
            </CardTitle>
            <CardDescription>
              Tasks created today from backend records
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.todayTasks.length === 0 ? (
              <div className="flex flex-col items-center py-4 text-center">
                <Calendar className="mb-2 h-8 w-8 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No tasks created today. Add tasks in your workspaces to see
                  them here.
                </p>
              </div>
            ) : (
              overview.todayTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  {task.done ? (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  ) : (
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.workspaceName} • {task.status}
                    </p>
                  </div>
                </div>
              ))
            )}
            <Button
              className="mt-2 w-full bg-transparent"
              variant="outline"
              onClick={() => navigate({ to: "/tasks" })}
            >
              View All Tasks
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardContainer;
