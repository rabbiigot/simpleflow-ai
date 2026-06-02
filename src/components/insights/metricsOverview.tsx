import { Card, CardContent } from "@/components/ui/card";
import { ArrowDown, ArrowUp, CheckCircle, Clock, Gauge, Timer } from "lucide-react";

type MetricsOverviewProps = {
  metrics: {
    tasksCompleted: number;
    hoursTracked: number;
    productivityScore: number;
    avgTaskMinutes: number;
  };
};

export function MetricsOverview({ metrics }: MetricsOverviewProps) {
  const cards = [
    {
      label: "Tasks Completed",
      value: String(metrics.tasksCompleted),
      change: `${metrics.tasksCompleted > 0 ? "+" : ""}${metrics.tasksCompleted}`,
      positive: metrics.tasksCompleted > 0,
      icon: CheckCircle,
    },
    {
      label: "Hours Tracked",
      value: metrics.hoursTracked.toFixed(1),
      change: `${metrics.hoursTracked > 0 ? "+" : ""}${metrics.hoursTracked.toFixed(1)}`,
      positive: metrics.hoursTracked > 0,
      icon: Clock,
    },
    {
      label: "Productivity Score",
      value: `${metrics.productivityScore}%`,
      change: `${metrics.productivityScore >= 80 ? "+" : ""}${metrics.productivityScore}`,
      positive: metrics.productivityScore >= 50,
      icon: Gauge,
    },
    {
      label: "Avg. Task Time",
      value: `${metrics.avgTaskMinutes} min`,
      change: `${metrics.avgTaskMinutes > 0 ? "+" : ""}${metrics.avgTaskMinutes}`,
      positive: metrics.avgTaskMinutes <= 60,
      icon: Timer,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((metric) => (
        <Card
          key={metric.label}
          className="bg-card hover:shadow-lg transition-shadow"
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {metric.label}
                </p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {metric.value}
                </p>
              </div>
              <div className="rounded-lg bg-blue-500/10 p-2">
                <metric.icon className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4">
              {metric.positive ? (
                <ArrowUp className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDown className="w-4 h-4 text-indigo-500" />
              )}
              <span
                className={
                  metric.positive ? "text-green-500" : "text-indigo-500"
                }
              >
                {metric.change}
              </span>
              <span className="text-xs text-muted-foreground">
                vs last week
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
