import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getCurrentUserId,
  getDashboardInsights,
  getDashboardOverview,
  getWorkspacesPaged,
  type DashboardInsightsResponse,
  type DashboardOverviewResponse,
} from "@/lib/backend-api";
import {
  Activity,
  BarChart3,
  CheckCircle,
  Clock,
  Loader2,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PIE_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];

const PERIOD_MAP: Record<string, number> = {
  "7days": 7,
  "30days": 30,
  "90days": 90,
  "1year": 365,
};

const AnalyticsContainer = () => {
  const [days, setDays] = useState(30);
  const [periodKey, setPeriodKey] = useState("30days");
  const [overview, setOverview] = useState<DashboardOverviewResponse | null>(null);
  const [insights, setInsights] = useState<DashboardInsightsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("all");

  const fetchData = useCallback(async (numDays: number, wsId?: string) => {
    setIsLoading(true);
    setError(null);
    const userId = getCurrentUserId() || undefined;
    const workspaceId = wsId && wsId !== "all" ? wsId : undefined;
    try {
      const [overviewData, insightsData] = await Promise.all([
        getDashboardOverview(userId, workspaceId),
        getDashboardInsights(numDays, userId, workspaceId),
      ]);
      setOverview(overviewData);
      setInsights(insightsData);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load analytics";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const userId = getCurrentUserId() || undefined;
    getWorkspacesPaged({ userId, pageSize: 100 })
      .then((res) => setWorkspaces(res.items.map((w) => ({ id: w.id, name: w.name }))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchData(days, selectedWorkspaceId);
  }, [days, selectedWorkspaceId, fetchData]);

  const handlePeriodChange = (value: string) => {
    setPeriodKey(value);
    setDays(PERIOD_MAP[value] ?? 30);
  };

  const handleWorkspaceChange = (value: string) => {
    setSelectedWorkspaceId(value);
  };

  const summary = overview?.summary;
  const successRate = summary?.successRate ?? 0;
  const tasksCompleted = summary?.tasksCompleted ?? 0;
  const totalTasks = summary?.totalTasks ?? 0;
  const completionRate = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;
  const monthlyHours = summary?.monthlyHoursTracked ?? 0;
  const activeGoals = summary?.activeGoals ?? 0;

  const productivityTrend = insights?.productivityTrend ?? [];
  const taskStatusOverview = insights?.taskStatusOverview ?? [];
  const timeAllocation = insights?.timeAllocation ?? [];

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-balance">Analytics</h1>
          <p className="text-muted-foreground mt-2 text-pretty">
            Track your progress and analyze your goal achievement patterns
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedWorkspaceId} onValueChange={handleWorkspaceChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Workspaces" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Workspaces</SelectItem>
              {workspaces.map((ws) => (
                <SelectItem key={ws.id} value={ws.id}>
                  {ws.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={periodKey} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="1year">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <Card className="border-red-300 mb-8">
          <CardContent className="pt-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12 mb-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading analytics...</span>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overall Progress
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{successRate}%</div>
            <div className="flex items-center gap-2 mt-2">
              {successRate >= 50 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <p className={`text-xs ${successRate >= 50 ? "text-green-500" : "text-red-500"}`}>
                {successRate}% success rate
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Task Completion Rate
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{completionRate}%</div>
            <div className="flex items-center gap-2 mt-2">
              {completionRate >= 50 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <p className={`text-xs ${completionRate >= 50 ? "text-green-500" : "text-red-500"}`}>
                {tasksCompleted} of {totalTasks} tasks
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{activeGoals}</div>
            <div className="flex items-center gap-2 mt-2">
              {activeGoals > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <p className={`text-xs ${activeGoals > 0 ? "text-green-500" : "text-red-500"}`}>
                {activeGoals} active goal{activeGoals !== 1 ? "s" : ""}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Hours
            </CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{monthlyHours}h</div>
            <div className="flex items-center gap-2 mt-2">
              {monthlyHours > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <p className={`text-xs ${monthlyHours > 0 ? "text-green-500" : "text-red-500"}`}>
                {monthlyHours}h tracked this month
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* Productivity Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Productivity Trend
            </CardTitle>
            <CardDescription>
              Your productivity score compared to target over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={productivityTrend}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis dataKey="day" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="productivity"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                    name="Productivity"
                  />
                  <Area
                    type="monotone"
                    dataKey="target"
                    stackId="2"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    name="Target"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Task Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Task Status Overview
            </CardTitle>
            <CardDescription>
              Breakdown of tasks by their current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskStatusOverview}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis dataKey="category" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="value" fill="#10b981" name="Count" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Allocation */}
      <Card>
        <CardHeader>
          <CardTitle>Time Allocation</CardTitle>
          <CardDescription>
            How your time is distributed across different categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={timeAllocation}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {timeAllocation.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => `${value}%`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsContainer;
