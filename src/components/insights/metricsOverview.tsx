"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowDown, ArrowUp } from "lucide-react";

const metrics = [
  {
    label: "Tasks Completed",
    value: "127",
    change: "+12%",
    positive: true,
    icon: "✓",
  },
  {
    label: "Hours Tracked",
    value: "156.5",
    change: "+8%",
    positive: true,
    icon: "⏱",
  },
  {
    label: "Productivity Score",
    value: "8.4/10",
    change: "+5%",
    positive: true,
    icon: "📊",
  },
  {
    label: "Avg. Task Time",
    value: "47 min",
    change: "-3%",
    positive: false,
    icon: "⏰",
  },
];

export function MetricsOverview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
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
              <span className="text-2xl">{metric.icon}</span>
            </div>
            <div className="flex items-center gap-1 mt-4">
              {metric.positive ? (
                <ArrowUp className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDown className="w-4 h-4 text-orange-500" />
              )}
              <span
                className={
                  metric.positive ? "text-green-500" : "text-orange-500"
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
