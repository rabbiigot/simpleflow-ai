import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Target,
  TrendingUp,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";

const DashboardContainer = () => {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-balance">Welcome back!</h1>
        <p className="text-muted-foreground mt-2 text-pretty">
          Track your goals, manage tasks, and achieve success with your daily
          routine planner.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">3</div>
            <p className="text-xs text-muted-foreground">+1 from last month</p>
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
            <div className="text-2xl font-bold text-primary">24</div>
            <p className="text-xs text-muted-foreground">+12% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">87%</div>
            <p className="text-xs text-muted-foreground">+5% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Budget
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">$2,450</div>
            <p className="text-xs text-muted-foreground">$550 remaining</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Current Goals
            </CardTitle>
            <CardDescription>
              Track your progress towards achieving your goals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Learn React Development
                </span>
                <Badge variant="secondary">75%</Badge>
              </div>
              <Progress value={75} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Morning Exercise Routine
                </span>
                <Badge variant="secondary">60%</Badge>
              </div>
              <Progress value={60} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Save $5000 Emergency Fund
                </span>
                <Badge variant="secondary">40%</Badge>
              </div>
              <Progress value={40} className="h-2" />
            </div>

            <Button className="w-full mt-4 bg-transparent" variant="outline">
              View All Goals
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Today's Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Today's Tasks
            </CardTitle>
            <CardDescription>
              Your daily routine to achieve your goals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <CheckCircle className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Complete React tutorial chapter 3
                </p>
                <p className="text-xs text-muted-foreground">Due: 2:00 PM</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">30-minute morning workout</p>
                <p className="text-xs text-muted-foreground">Due: 7:00 AM</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Review monthly expenses</p>
                <p className="text-xs text-muted-foreground">Due: 8:00 PM</p>
              </div>
            </div>

            <Button className="w-full mt-4 bg-transparent" variant="outline">
              View All Tasks
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button
            className="h-20 flex-col gap-2 bg-transparent"
            variant="outline"
          >
            <Target className="h-6 w-6" />
            <span>Create Goal</span>
          </Button>
          <Button
            className="h-20 flex-col gap-2 bg-transparent"
            variant="outline"
          >
            <Calendar className="h-6 w-6" />
            <span>Add Task</span>
          </Button>
          <Button
            className="h-20 flex-col gap-2 bg-transparent"
            variant="outline"
          >
            <DollarSign className="h-6 w-6" />
            <span>Log Expense</span>
          </Button>
          <Button
            className="h-20 flex-col gap-2 bg-transparent"
            variant="outline"
          >
            <TrendingUp className="h-6 w-6" />
            <span>View Analytics</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardContainer;
