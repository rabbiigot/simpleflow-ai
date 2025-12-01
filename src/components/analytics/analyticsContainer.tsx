import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  BarChart3,
  CheckCircle,
  Clock,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Mock data for analytics
const goalProgressData = [
  { month: "Jan", "Learn React": 20, Exercise: 15, "Save Money": 10 },
  { month: "Feb", "Learn React": 35, Exercise: 30, "Save Money": 20 },
  { month: "Mar", "Learn React": 50, Exercise: 45, "Save Money": 30 },
  { month: "Apr", "Learn React": 65, Exercise: 55, "Save Money": 35 },
  { month: "May", "Learn React": 75, Exercise: 60, "Save Money": 40 },
];

const taskCompletionData = [
  { day: "Mon", completed: 8, total: 10 },
  { day: "Tue", completed: 6, total: 8 },
  { day: "Wed", completed: 9, total: 12 },
  { day: "Thu", completed: 7, total: 9 },
  { day: "Fri", completed: 10, total: 11 },
  { day: "Sat", completed: 5, total: 6 },
  { day: "Sun", completed: 4, total: 5 },
];

const categoryDistribution = [
  { name: "Learning", value: 35, color: "#10b981" },
  { name: "Health", value: 25, color: "#3b82f6" },
  { name: "Finance", value: 20, color: "#8b5cf6" },
  { name: "Work", value: 15, color: "#f59e0b" },
  { name: "Personal", value: 5, color: "#ef4444" },
];

const productivityTrend = [
  { week: "Week 1", productivity: 65, focus: 70 },
  { week: "Week 2", productivity: 72, focus: 75 },
  { week: "Week 3", productivity: 68, focus: 72 },
  { week: "Week 4", productivity: 85, focus: 88 },
  { week: "Week 5", productivity: 78, focus: 82 },
];

const streakData = [
  { goal: "Morning Exercise", current: 12, best: 18 },
  { goal: "Daily Learning", current: 8, best: 15 },
  { goal: "Budget Tracking", current: 5, best: 10 },
];

const AnalyticsContainer = () => {
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

        <Select defaultValue="30days">
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
            <div className="text-2xl font-bold text-primary">73%</div>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <p className="text-xs text-green-500">+8% from last month</p>
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
            <div className="text-2xl font-bold text-primary">87%</div>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <p className="text-xs text-green-500">+5% from last week</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Streak</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">12 days</div>
            <div className="flex items-center gap-2 mt-2">
              <TrendingDown className="h-3 w-3 text-red-500" />
              <p className="text-xs text-red-500">6 days from best</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Daily Focus
            </CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">4.2h</div>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <p className="text-xs text-green-500">+0.5h from last week</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* Goal Progress Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Goal Progress Over Time
            </CardTitle>
            <CardDescription>
              Track how your goals are progressing month by month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={goalProgressData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis dataKey="month" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Learn React"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="Exercise"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="Save Money"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Task Completion Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Weekly Task Completion
            </CardTitle>
            <CardDescription>
              Daily task completion vs total tasks assigned
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskCompletionData}>
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
                  <Bar dataKey="completed" fill="#10b981" name="Completed" />
                  <Bar dataKey="total" fill="#e5e7eb" name="Total" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row Charts */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Task Category Distribution</CardTitle>
            <CardDescription>
              How your time is distributed across different categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Productivity Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Productivity & Focus Trend</CardTitle>
            <CardDescription>
              Your productivity and focus levels over the past weeks
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
                  <XAxis dataKey="week" className="text-muted-foreground" />
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
                  />
                  <Area
                    type="monotone"
                    dataKey="focus"
                    stackId="2"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Streak Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Goal Streaks</CardTitle>
          <CardDescription>
            Current streaks vs your personal best for each goal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {streakData.map((streak, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{streak.goal}</span>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">
                      Current: {streak.current} days
                    </Badge>
                    <Badge variant="outline">Best: {streak.best} days</Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <Progress
                    value={(streak.current / streak.best) * 100}
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0 days</span>
                    <span>{streak.best} days (Personal Best)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsContainer;
